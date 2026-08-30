'use strict';

const readXlsxFile = require('read-excel-file/node');

function valueText(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString();
  return String(value).trim() || null;
}

function record(tab, rowNumber, values) {
  return { sourceRecordKey: `${tab}:${rowNumber}`, sourceLocator: `${tab}!${rowNumber}`, ...values };
}

async function sheet(filePath, name) {
  return readXlsxFile(filePath, { sheet: name });
}

async function parseCampaignWorkbook(filePath) {
  const rows = await Promise.all([
    sheet(filePath, 'Timeline'), sheet(filePath, 'History'), sheet(filePath, 'Star Chart'),
    sheet(filePath, 'Type Planets'), sheet(filePath, 'Economy'), sheet(filePath, 'Medical'),
    sheet(filePath, 'Acronym'), sheet(filePath, 'Decks'), sheet(filePath, 'People Met'), sheet(filePath, 'Notes')
  ]);
  return campaignFromSheets({
    timelineRows: rows[0], historyRows: rows[1], chartRows: rows[2], planetRows: rows[3],
    economyRows: rows[4], medicalRows: rows[5], acronymRows: rows[6], deckRows: rows[7],
    peopleRows: rows[8], noteRows: rows[9]
  });
}

function campaignFromSheets({
  timelineRows, historyRows, chartRows, planetRows, economyRows, medicalRows,
  acronymRows, deckRows, peopleRows, noteRows
}) {

  const sessions = [];
  const events = [];
  timelineRows.slice(2).forEach((row, index) => {
    if (row[0] === null || !valueText(row[1])) return;
    const rowNumber = index + 3;
    const date = valueText(row[3]);
    const session = record('Timeline', rowNumber, {
      episode_number: row[0], title: valueText(row[1]), summary: valueText(row[2]),
      in_world_date_raw: date, location_raw: valueText(row[4]) || valueText(row[5]),
      ruleset: 'starfinder_1e', content_origin: 'homebrew'
    });
    sessions.push(session);
    if (session.summary) events.push(record('Timeline Event', rowNumber, {
      title: session.summary, description: session.summary, raw_date: date,
      event_kind: 'session_event', session_source_key: session.sourceRecordKey,
      location_raw: session.location_raw, ruleset: 'starfinder_1e', content_origin: 'homebrew'
    }));
  });

  const people = peopleRows.slice(3).map((row, index) => row[0] ? record('People Met', index + 4, {
    name: valueText(row[0]), race: valueText(row[1]), age: valueText(row[2]),
    sex: valueText(row[3]), rank: valueText(row[4]), occupation: valueText(row[5]),
    encounter_context: valueText(row[6]), ruleset: 'starfinder_1e', content_origin: 'homebrew'
  }) : null).filter(Boolean);

  const organizations = economyRows.map((row, index) => row[0] && row[0] !== 'Company Name' ? record('Economy', index + 1, {
    name: valueText(row[0]), organization_kind: 'company', industry: valueText(row[1]),
    leader_raw: valueText(row[2]), products_raw: valueText(row[3]),
    ruleset: 'system_neutral', content_origin: 'homebrew'
  }) : null).filter(Boolean);

  const planetClasses = planetRows.slice(1).map((row, index) => row[0] ? record('Type Planets', index + 2, {
    name: valueText(row[0]), code: valueText(row[0]), habitable: valueText(row[1]),
    example: valueText(row[2]), description: valueText(row[3]), content_origin: 'homebrew'
  }) : null).filter(Boolean);

  const starSystems = [];
  const worlds = [];
  const chartHeaders = chartRows[0];
  const inhabitedIndex = chartHeaders.indexOf('Inhabited');
  const discoveredIndex = chartHeaders.indexOf('Discovered');
  const notesIndex = chartHeaders.indexOf('Notes');
  const classHeaders = chartHeaders.slice(3, inhabitedIndex === -1 ? chartHeaders.length : inhabitedIndex);
  chartRows.slice(1).forEach((row, index) => {
    if (!row[0] || !row[1]) return;
    const rowNumber = index + 2;
    const systemKey = `Star Chart:${rowNumber}`;
    const systemCode = valueText(row[0]);
    const sector = valueText(row[1]);
    starSystems.push(record('Star Chart', rowNumber, {
      name: `${sector}-${systemCode}`, source_code: systemCode, sector, star_type: valueText(row[2]),
      inhabited: valueText(row[inhabitedIndex]), discovered_by: valueText(row[discoveredIndex]), notes: valueText(row[notesIndex]),
      ruleset: 'system_neutral', content_origin: 'homebrew'
    }));
    classHeaders.forEach((planetClass, classIndex) => {
      const rawOrbits = valueText(row[classIndex + 3]);
      if (!planetClass || !rawOrbits) return;
      rawOrbits.split(',').map(item => item.trim()).filter(Boolean).forEach((orbit, orbitIndex) => {
        worlds.push(record('Star Chart World', `${rowNumber}:${classIndex + 3}:${orbitIndex + 1}`, {
          name: `${sector}-${systemCode}-${orbit}`, orbital_position: orbit, planet_class: valueText(planetClass),
          star_system_source_key: systemKey, inhabited: valueText(row[inhabitedIndex]), discovered_by: valueText(row[discoveredIndex]),
          system_notes: valueText(row[notesIndex]), ruleset: 'system_neutral', content_origin: 'homebrew'
        }));
      });
    });
  });

  const items = [];
  medicalRows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    if (row[0]) items.push(record('Medical Drug', rowNumber, {
      name: valueText(row[0]), item_kind: 'medical_drug', description: valueText(row[1]),
      ruleset: 'starfinder_1e', content_origin: 'homebrew'
    }));
    if (row[2]) items.push(record('Medical Equipment', rowNumber, {
      name: valueText(row[2]), item_kind: 'medical_equipment', description: valueText(row[3]),
      ruleset: 'starfinder_1e', content_origin: 'homebrew'
    }));
  });

  const historicalMemberships = [];
  const historyGroups = historyRows[0];
  historyRows.slice(2).forEach((row, index) => row.forEach((member, column) => {
    if (!member) return;
    let headingColumn = column;
    while (headingColumn >= 0 && !historyGroups[headingColumn]) headingColumn -= 1;
    historicalMemberships.push(record('History', `${index + 3}:${column + 1}`, {
      group_name: valueText(historyGroups[headingColumn]), member_name: valueText(member), position: index + 1
    }));
  }));

  const shipSpaces = [];
  deckRows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    if (row[0] !== null && row[0] !== undefined) shipSpaces.push(record('Decks Legacy', rowNumber, {
      name: `Legacy deck ${row[0]}`, deck_number: row[0], areas_raw: valueText(row[1]), layout_version: 'legacy'
    }));
    if (row[3] !== null && row[3] !== undefined) shipSpaces.push(record('Decks Current', rowNumber, {
      name: `Current deck ${row[3]}`, deck_number: row[3], areas_raw: valueText(row[4]), layout_version: 'current'
    }));
  });

  const referenceEntries = acronymRows.slice(1).filter(row => row[0]).map((row, index) => record('Acronym', index + 2, {
    name: valueText(row[0]), reference_kind: 'acronym', value: valueText(row[1])
  }));
  noteRows.slice(1).forEach((row, index) => {
    if (row[0]) referenceEntries.push(record('Notes Alphabet', index + 2, {
      name: valueText(row[0]), reference_kind: 'accord_alphabet', value: valueText(row[1])
    }));
    if (row[4]) referenceEntries.push(record('Notes Clearance', index + 2, {
      name: valueText(row[4]), reference_kind: 'clearance_level', value: valueText(row[3])
    }));
    row.slice(6).forEach((value, offset) => {
      if (value) referenceEntries.push(record('Notes Vatican', `${index + 2}:${offset + 7}`, {
        name: valueText(value), reference_kind: 'vatican_hierarchy', position: offset + 1
      }));
    });
  });

  return {
    parser: 'campaign-v1',
    collections: { sessions, events, people, organizations, planetClasses, starSystems, worlds, items, historicalMemberships, shipSpaces, referenceEntries },
    issues: []
  };
}

module.exports = { campaignFromSheets, parseCampaignWorkbook, valueText };
