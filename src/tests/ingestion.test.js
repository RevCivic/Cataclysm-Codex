'use strict';

const { after, afterEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
process.env.DB_PATH = path.join(os.tmpdir(), `codex-ingestion-db-${process.pid}.json`);
const ExcelJS = require('exceljs');
const { exportUrl, getSource, listSources } = require('../ingestion/source-registry');
const { fetchSnapshot } = require('../ingestion/snapshot-store');
const { parseSpeciesWorkbook } = require('../ingestion/parsers/species');
const { parseEquipmentWorkbook } = require('../ingestion/parsers/equipment');
const { parseShipClassesWorkbook } = require('../ingestion/parsers/ship-classes');
const { historicalTimelineFromParagraphs, loreFromParagraphs } = require('../ingestion/parsers/documents');
const { campaignFromSheets } = require('../ingestion/parsers/campaign');
const { applyImport, previewImport } = require('../ingestion/import-service');
const { identityFor, normalizeParsedImport } = require('../ingestion/normalization');
const { db, getAll } = require('../database');

const tempDirectories = [];

async function tempDirectory() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-ingestion-'));
  tempDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map(directory => fs.rm(directory, { recursive: true, force: true })));
});

describe('import normalization', () => {
  it('trims source values and keeps same-named catalog entries in separate kinds', () => {
    const normalized = normalizeParsedImport({
      parser: 'equipment-v1',
      collections: {
        items: [
          { sourceRecordKey: 'Weapons:2', sourceLocator: 'Weapons!2', name: ' Special ', item_kind: ' weapon ' },
          { sourceRecordKey: 'Armor:2', sourceLocator: 'Armor!2', name: 'Special', item_kind: 'armor' }
        ]
      },
      issues: []
    });

    assert.equal(normalized.collections.items[0].name, 'Special');
    assert.equal(normalized.collections.items[0].item_kind, 'weapon');
    assert.notEqual(identityFor('items', normalized.collections.items[0]), identityFor('items', normalized.collections.items[1]));
    assert.deepEqual(normalized.issues, []);
  });

  it('blocks duplicate source keys before they can overwrite mappings', () => {
    const normalized = normalizeParsedImport({
      parser: 'campaign-v1',
      collections: {
        people: [
          { sourceRecordKey: 'People:2', sourceLocator: 'People!2', name: 'Alex' },
          { sourceRecordKey: 'People:2', sourceLocator: 'People!3', name: 'Blake' }
        ]
      },
      issues: []
    });

    assert.equal(normalized.issues[0].code, 'duplicate_source_key');
    assert.equal(normalized.issues[0].severity, 'error');
  });

  it('equipment-v1 normalizes items with defaults and syncs item_type', () => {
    const normalized = normalizeParsedImport({
      parser: 'equipment-v1',
      collections: {
        items: [
          { sourceRecordKey: 'W:2', sourceLocator: 'W!2', name: 'Blaster', item_kind: 'weapon', damage: '1d6', category: 'Pistols' },
          { sourceRecordKey: 'U:2', sourceLocator: 'U!2', name: 'Scope', item_kind: 'upgrade', compatibility: 'Weapon', effect: '+1 atk' }
        ]
      },
      issues: []
    });
    const weapon = normalized.collections.items[0];
    assert.equal(weapon.item_type, 'weapon');
    assert.equal(weapon.content_origin, 'homebrew');
    assert.equal(weapon.approval_status, 'imported');
    assert.equal(weapon.category, 'Pistols');
    const upgrade = normalized.collections.items[1];
    assert.equal(upgrade.item_kind, 'upgrade');
    assert.equal(upgrade.compatibility, 'Weapon');
  });

  it('ship-classes-v1 normalizes ship designs with defaults', () => {
    const normalized = normalizeParsedImport({
      parser: 'ship-classes-v1',
      collections: {
        shipDesigns: [
          {
            sourceRecordKey: 'Accord Ship Classes:3', sourceLocator: 'Accord Ship Classes!3',
            name: 'Valiant', ship_class: 'Frigate', role: 'Combat', faction_name: 'Accord',
            fore_weapons: 'Laser', source_group: 'Accord Ship Classes'
          }
        ]
      },
      issues: []
    });
    const design = normalized.collections.shipDesigns[0];
    assert.equal(design.ship_class, 'Frigate');
    assert.equal(design.faction_name, 'Accord');
    assert.equal(design.fore_weapons, 'Laser');
    assert.equal(design.content_origin, 'homebrew');
    assert.equal(design.approval_status, 'imported');
  });

  it('campaign-v1 normalizes sessions, events, star systems, and worlds with content_origin', () => {
    const normalized = normalizeParsedImport({
      parser: 'campaign-v1',
      collections: {
        sessions: [{ sourceRecordKey: 'Timeline:3', sourceLocator: 'Timeline!3', episode_number: 1, title: 'Arrival', summary: 'Reached the station', in_world_date_raw: 'Sept 1', location_raw: 'Station Alpha', ruleset: 'starfinder_1e', content_origin: 'homebrew' }],
        events: [{ sourceRecordKey: 'Timeline Event:3', sourceLocator: 'Timeline!3', title: 'Docked', event_kind: 'session_event', session_source_key: 'Timeline:3' }],
        starSystems: [{ sourceRecordKey: 'Star Chart:2', sourceLocator: 'Star Chart!2', name: 'A-001', source_code: '001', sector: 'A', star_type: 'Yellow' }],
        worlds: [{ sourceRecordKey: 'Star Chart World:2:1', sourceLocator: 'Star Chart World!2:1', name: 'A-001-1', orbital_position: '1', planet_class: 'B', star_system_source_key: 'Star Chart:2' }]
      },
      issues: []
    });
    const session = normalized.collections.sessions[0];
    assert.equal(session.episode_number, 1);
    assert.equal(session.title, 'Arrival');
    assert.equal(session.in_world_date_raw, 'Sept 1');
    assert.equal(session.content_origin, 'homebrew');
    const event = normalized.collections.events[0];
    assert.equal(event.event_kind, 'session_event');
    assert.equal(event.content_origin, 'homebrew');
    const system = normalized.collections.starSystems[0];
    assert.equal(system.source_code, '001');
    assert.equal(system.sector, 'A');
    const world = normalized.collections.worlds[0];
    assert.equal(world.orbital_position, '1');
    assert.equal(world.planet_class, 'B');
  });

  it('lore-document-v1 normalizes documents and sections with content_origin', () => {
    const normalized = normalizeParsedImport({
      parser: 'lore-document-v1',
      collections: {
        loreDocuments: [{ sourceRecordKey: 'document', sourceLocator: 'document', title: 'Constitution', document_kind: 'constitution', ruleset: 'system_neutral', content_origin: 'homebrew' }],
        loreSections: [{ sourceRecordKey: 'paragraph:1', sourceLocator: 'paragraph:1', document_source_key: 'document', position: 1, heading: 'Preamble', body: 'Preamble text.' }]
      },
      issues: []
    });
    assert.equal(normalized.collections.loreDocuments[0].document_kind, 'constitution');
    assert.equal(normalized.collections.loreSections[0].document_source_key, 'document');
    assert.equal(normalized.collections.loreSections[0].content_origin, 'homebrew');
    assert.equal(normalized.collections.loreSections[0].title, 'Preamble');
    assert.equal(normalized.collections.loreSections[0].content, 'Preamble text.');
    assert.equal(normalized.collections.loreSections[0].sort_order, 1);
  });

  it('historical-timeline-v1 normalizes events with year fields and content_origin', () => {
    const normalized = normalizeParsedImport({
      parser: 'historical-timeline-v1',
      collections: {
        events: [{ sourceRecordKey: 'paragraph:1', sourceLocator: 'paragraph:1', title: 'First Contact', description: '2145- First contact', start_year: 2145, end_year: 2145, date_precision: 'year', event_kind: 'world_history' }]
      },
      issues: []
    });
    const event = normalized.collections.events[0];
    assert.equal(event.start_year, 2145);
    assert.equal(event.date_precision, 'year');
    assert.equal(event.event_kind, 'world_history');
    assert.equal(event.content_origin, 'homebrew');
  });
});

describe('additional source parsers', () => {
  it('normalizes campaign sessions, systems, worlds, people, and side tables', () => {
    const parsed = campaignFromSheets({
      timelineRows: [['Episodes'], ['#', 'Name'], [1, 'Arrival', 'Reached the station', 'Sept 2 2547', 'Absalom']],
      historyRows: [['Founders'], [null], ['Humans']],
      chartRows: [
        ['Sytem Name', 'Sector', 'Star', 'A', 'B', 'Inhabited', 'Discovered', 'Notes'],
        ['001', 'A', 'Yellow', null, '1,2', 'Yes', 'Ship', 'Home system']
      ],
      planetRows: [['Planet Class', 'Habitable', 'Example', 'Description'], ['B', 'No', 'Mercury', 'Molten']],
      economyRows: [['Company Name', 'Industry', 'CEO', 'Major Productions'], ['CE', 'Manufacturing', 'Alex', 'Weapons']],
      medicalRows: [['Analgesics', null, 'Equipment'], ['Anaprovaline', 'Pain relief', 'Hypospray', 'Injector']],
      acronymRows: [[null, null], ['S.T.E.A.M.', 'Strategic team']],
      deckRows: [['Deck', null, null, 'Decks', 'Areas'], [1, 'Bridge', null, 1, 'Bridge, Ready Room']],
      peopleRows: [['People Met'], [], ['Name', 'Species', 'Age', 'Sex', 'Rank', 'Job', 'Met'], [], ['Sam', 'Human', 35, 'M', 'Captain', 'Pilot', 'Station']],
      noteRows: [['Accord Alphabet', null, null, null, 'Clearance Levels', null, 'Vatican Army'], ['A', 'Alpha', null, 'Highest', 'Violet', null, 'Pope']]
    });
    assert.equal(parsed.collections.sessions[0].title, 'Arrival');
    assert.equal(parsed.collections.events[0].session_source_key, 'Timeline:3');
    assert.equal(parsed.collections.people[0].name, 'Sam');
    assert.equal(parsed.collections.starSystems[0].source_code, '001');
    assert.deepEqual(parsed.collections.worlds.map(world => world.orbital_position), ['1', '2']);
    assert.equal(parsed.collections.items.length, 2);
    assert.equal(parsed.collections.shipSpaces.length, 2);
    assert.equal(parsed.collections.historicalMemberships[0].group_name, 'Founders');
  });

  it('separates weapons, armor, and upgrades into catalog collections', async () => {
    const directory = await tempDirectory();
    const filePath = path.join(directory, 'equipment.xlsx');
    const workbook = new ExcelJS.Workbook();
    const weapons = workbook.addWorksheet('Weapons');
    weapons.addRow(['Image', 'Name', 'Size (S)', 'Size (M)', 'Size (L)', 'Catagory', 'Atk Bonus', 'Damage', 'Type', 'Crit', 'Clip', 'Fire Rate', 'Range', 'Special']);
    weapons.addRow([null, 'Laser Rifle', null, null, 'L', 'Long Arms', 1, '2d8', 'Energy', 20, 20, 'Single', 60, 'Reliable']);
    const armor = workbook.addWorksheet('Armor');
    armor.addRow(['Armor', 'Rarity', 'Class', 'EAC', 'KAC', 'Max Dex', 'Armor Check Penalty', 'Speed Adjustment', 'Upgrade Slots', 'Bulk']);
    armor.addRow(['Marine Armor', 'Common', 'Heavy', 2, 5, 0, -3, -10, 3, 3]);
    const upgrades = workbook.addWorksheet('Upgrades');
    upgrades.addRow(['Name', 'Rarity', 'Bulk', 'Weapon or Armor', 'Effect', 'Manufacturer', 'Brandon Approved?']);
    upgrades.addRow(['Mag Boots', 'Common', 1, 'Armor', 'Allow zero-G movement']);
    await workbook.xlsx.writeFile(filePath);

    const parsed = await parseEquipmentWorkbook(filePath);
    // Weapons, armor, and upgrades are all in the items collection (item_kind discriminates)
    assert.equal(parsed.collections.items.length, 3);
    assert.equal(parsed.collections.items[0].damage, '2d8');
    assert.equal(parsed.collections.items[1].item_kind, 'armor');
    assert.equal(parsed.collections.items[2].item_kind, 'upgrade');
    assert.equal(parsed.collections.items[2].compatibility, 'Armor');
  });

  it('uses physical ship sheet columns without treating the image column as a name', async () => {
    const directory = await tempDirectory();
    const filePath = path.join(directory, 'ships.xlsx');
    const workbook = new ExcelJS.Workbook();
    for (const tab of ['Accord Ship Classes', 'Enemy Ship Classes', 'Species Ship Classes']) {
      const sheet = workbook.addWorksheet(tab);
      sheet.addRow(['Escort']);
      sheet.addRow(['Image', 'Class', 'Tonnage', 'Type', 'Faction', 'Fore', 'Aft', 'Starboard', 'Port', 'Status', 'Length', 'Width', 'Height', 'Notable Ships', 'Decks', 'Notes']);
      sheet.addRow([null, `${tab} Design`, 'Frigate', 'Combat', 'Accord', 'Laser', null, null, null, 'Active', 100, 40, 20, 'Example', 5]);
    }
    await workbook.xlsx.writeFile(filePath);
    const parsed = await parseShipClassesWorkbook(filePath);
    assert.equal(parsed.collections.shipDesigns.length, 3);
    assert.equal(parsed.collections.shipDesigns[0].name, 'Accord Ship Classes Design');
    assert.equal(parsed.collections.shipDesigns[0].ship_class, 'Frigate');
  });

  it('preserves lore hierarchy and quarantines undated history paragraphs', () => {
    const lore = loreFromParagraphs(['Preamble', 'Article 1. Citizens', 'Section 2. Duties', 'Obey the law.']);
    assert.equal(lore.collections.loreSections[3].article_number, 1);
    assert.equal(lore.collections.loreSections[3].section_number, 2);
    const history = historicalTimelineFromParagraphs(['2085-2091- A long war', '2145- First contact', 'War begins']);
    assert.equal(history.collections.events[0].end_year, 2091);
    assert.equal(history.collections.events[1].date_precision, 'year');
    assert.equal(history.issues[0].code, 'unparsed_date');
  });

  it('previews and applies multiple target collections idempotently', async () => {
    await db.set('items', []).set('sourceRecords', []).set('sourceSnapshots', [])
      .set('importRuns', []).set('fieldProvenance', []).write();
    const parsed = {
      parser: 'equipment-v1', issues: [], collections: {
        items: [
          { sourceRecordKey: 'Weapons:2', sourceLocator: 'Weapons!2', name: 'Laser', item_kind: 'weapon' },
          { sourceRecordKey: 'Upgrades:2', sourceLocator: 'Upgrades!2', name: 'Scope', item_kind: 'upgrade', effect: '+1' }
        ]
      }
    };
    const source = getSource('equipment');
    const snapshot = { manifest: { sha256: 'b'.repeat(64), fetchedAt: new Date().toISOString(), parser: parsed.parser } };
    const preview1 = await previewImport(parsed, source.id);
    assert.deepEqual(preview1.counts, { create: 2, update: 0, unchanged: 0 });
    const run = await applyImport(parsed, source, snapshot);
    assert.equal(run.records_created, 2);
    assert.equal(run.records_updated, 0);
    const sourceRecords = await getAll('source_records');
    assert.equal(sourceRecords.length, 2);
    const preview2 = await previewImport(parsed, source.id);
    assert.deepEqual(preview2.counts, { create: 0, update: 0, unchanged: 2 });
  });

  it('resolves campaign child records through stable source keys', async () => {
    await db.set('sessions', []).set('events', []).set('sourceRecords', []).set('sourceSnapshots', [])
      .set('importRuns', []).set('fieldProvenance', []).write();
    const parsed = { parser: 'campaign-v1', issues: [], collections: {
      sessions: [{ sourceRecordKey: 'Timeline:3', sourceLocator: 'Timeline!3', title: 'Arrival' }],
      events: [{ sourceRecordKey: 'Timeline Event:3', sourceLocator: 'Timeline!3', title: 'Docked', session_source_key: 'Timeline:3' }]
    } };
    await applyImport(parsed, getSource('campaign'), {
      manifest: { sha256: 'd'.repeat(64), fetchedAt: new Date().toISOString(), parser: parsed.parser }
    });
    const events = await getAll('events');
    const sessions = await getAll('sessions');
    assert.equal(events[0].session_id, sessions[0].id);
  });
});

after(async () => {
  await fs.rm(process.env.DB_PATH, { force: true });
});

describe('source registry', () => {
  it('defines each supplied source with unique ids and safe export URLs', () => {
    const sources = listSources();
    assert.equal(sources.length, 7);
    assert.equal(new Set(sources.map(source => source.id)).size, sources.length);
    assert.equal(
      exportUrl(getSource('species')),
      'https://docs.google.com/spreadsheets/d/14y4MTQicf1nAuQEOUJwowp7Vq9qkij4FUFP0uuw5P0k/export?format=xlsx'
    );
  });

  it('rejects unknown source ids', () => {
    assert.throws(() => getSource('../unknown'), /Unknown source/);
  });
});

describe('snapshot store', () => {
  it('stores content by checksum and reuses an identical immutable snapshot', async () => {
    const root = await tempDirectory();
    const bytes = Buffer.from('workbook fixture');
    const fetchImpl = async () => new Response(bytes, {
      status: 200,
      headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', etag: 'revision-1' }
    });

    const first = await fetchSnapshot(getSource('species'), { root, fetchImpl });
    const second = await fetchSnapshot(getSource('species'), { root, fetchImpl });

    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.equal(first.directory, second.directory);
    assert.deepEqual(await fs.readFile(first.dataFile), bytes);
    const manifest = JSON.parse(await fs.readFile(first.manifestFile, 'utf8'));
    assert.equal(manifest.sha256, '99174d3644aaafbcec5e1d4aace37f96dee11373c71d35616dc17b3c46fb5e30');
    assert.equal(manifest.parser, 'species-v1');
    assert.equal(manifest.etag, 'revision-1');
  });

  it('does not write a snapshot for an unsuccessful response', async () => {
    const root = await tempDirectory();
    const fetchImpl = async () => new Response('private', { status: 403 });
    await assert.rejects(fetchSnapshot(getSource('species'), { root, fetchImpl }), /HTTP 403/);
    assert.deepEqual(await fs.readdir(root), []);
  });
});

describe('species parser', () => {
  async function writeFixture({ duplicate = false } = {}) {
    const directory = await tempDirectory();
    const filePath = path.join(directory, 'species.xlsx');
    const workbook = new ExcelJS.Workbook();
    const species = workbook.addWorksheet('DB_Species_Table');
    species.addRow([
      'Species_Name', 'Matched_Index_Name', 'Home_World', 'Size', 'Type', 'Air', 'Sex',
      'Attributes', 'Hours_of_Sleep', 'Days_Without_Food', 'Days_Without_Water',
      'Background', 'Sociology', 'Physiology', 'Special_Abilities', 'Tech_Level'
    ]);
    species.addRow([
      'Adreen', 'Adreen', 'Adreena', 'S', 'Animal', 'Oxygen', 2,
      '-4 STR, +2 DEX', 8, 20, 2, 'Water-world explorers', 'Extended families',
      'Amphibious humanoids', '+20 swim', 5
    ]);
    if (duplicate) species.addRow(['adreen', 'Adreen']);
    const aliases = workbook.addWorksheet('DB_AliasMap');
    aliases.addRow(['Stats_Name', 'Index_Name', 'Notes']);
    aliases.addRow(['Kasatha', 'Kasathas', 'Plural form']);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  it('projects curated records, aliases, extensions, and source locators', async () => {
    const result = await parseSpeciesWorkbook(await writeFixture());
    assert.equal(result.parser, 'species-v1');
    assert.equal(result.species.length, 1);
    assert.equal(result.species[0].name, 'Adreen');
    assert.equal(result.species[0].hoursOfSleep, 8);
    assert.equal(result.species[0].extensions.Tech_Level, 5);
    assert.equal(result.species[0].sourceLocator, 'DB_Species_Table!2');
    assert.deepEqual(result.aliases[0], {
      sourceRecordKey: 'DB_AliasMap:2',
      sourceLocator: 'DB_AliasMap!2',
      alias: 'Kasatha',
      canonicalName: 'Kasathas',
      notes: 'Plural form'
    });
    assert.deepEqual(result.issues, []);
  });

  it('quarantines case-insensitive duplicate names', async () => {
    const result = await parseSpeciesWorkbook(await writeFixture({ duplicate: true }));
    assert.equal(result.species.length, 1);
    assert.deepEqual(result.issues, [{
      severity: 'error',
      code: 'duplicate_name',
      sourceLocator: 'DB_Species_Table!3',
      conflictingLocator: 'DB_Species_Table!2'
    }]);
  });

  it('previews and atomically applies species with mappings and field provenance', async () => {
    await db.set('species', []).set('sourceRecords', []).set('entityAliases', [])
      .set('sourceSnapshots', []).set('importRuns', []).set('fieldProvenance', []).write();
    const parsed = await parseSpeciesWorkbook(await writeFixture());
    const source = getSource('species');
    const snapshot = { manifest: { sha256: 'a'.repeat(64), fetchedAt: new Date().toISOString(), parser: 'species-v1' } };

    const preview1 = await previewImport(parsed, source.id);
    assert.deepEqual(preview1.counts, { create: 1, update: 0, unchanged: 0 });
    const run = await applyImport(parsed, source, snapshot);
    assert.equal(run.records_created, 1);
    assert.equal(run.records_updated, 0);
    const allSpecies = await getAll('species');
    assert.equal(allSpecies[0].home_world, 'Adreena');
    assert.equal(allSpecies[0].content_origin, 'homebrew');
    const allSourceRecords = await getAll('source_records');
    assert.equal(allSourceRecords.length, 1);
    // Expect 22 fields: original 20 + imageUrl + imageRef (both null in fixture)
    const allFieldProvenance = await getAll('field_provenance');
    assert.equal(allFieldProvenance.length, 22);
    const preview2 = await previewImport(parsed, source.id);
    assert.deepEqual(preview2.counts, { create: 0, update: 0, unchanged: 1 });

    const unchangedRun = await applyImport(parsed, source, snapshot);
    assert.equal(unchangedRun.records_created, 0);
    assert.equal(unchangedRun.records_skipped, 1);
    const allFieldProvenance2 = await getAll('field_provenance');
    assert.equal(allFieldProvenance2.length, 22);
  });
});
