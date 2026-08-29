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
const { applySpeciesImport, previewSpeciesImport } = require('../ingestion/import-service');
const { db } = require('../database');

const tempDirectories = [];

async function tempDirectory() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-ingestion-'));
  tempDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map(directory => fs.rm(directory, { recursive: true, force: true })));
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
    db.set('species', []).set('sourceRecords', []).set('entityAliases', [])
      .set('sourceSnapshots', []).set('importRuns', []).set('fieldProvenance', []).write();
    const parsed = await parseSpeciesWorkbook(await writeFixture());
    const source = getSource('species');
    const snapshot = { manifest: { sha256: 'a'.repeat(64), fetchedAt: new Date().toISOString(), parser: 'species-v1' } };

    assert.deepEqual(previewSpeciesImport(parsed, source.id).counts, { create: 1, update: 0, unchanged: 0 });
    const run = applySpeciesImport(parsed, source, snapshot);
    assert.deepEqual(run.counts, { create: 1, update: 0, unchanged: 0 });
    assert.equal(db.get('species').value()[0].home_world, 'Adreena');
    assert.equal(db.get('species').value()[0].content_origin, 'homebrew');
    assert.equal(db.get('sourceRecords').size().value(), 1);
    assert.equal(db.get('fieldProvenance').size().value(), 15);
    assert.deepEqual(previewSpeciesImport(parsed, source.id).counts, { create: 0, update: 0, unchanged: 1 });
  });
});
