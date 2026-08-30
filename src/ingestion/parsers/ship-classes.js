'use strict';

const ExcelJS = require('exceljs');
const { assertSheet, headersFor, rowObject } = require('./workbook');

const TABS = ['Accord Ship Classes', 'Enemy Ship Classes', 'Species Ship Classes'];

async function parseShipClassesWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const shipDesigns = [];
  for (const tab of TABS) {
    const sheet = assertSheet(workbook, tab);
    const headers = headersFor(sheet, 2);
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      const raw = rowObject(row, headers);
      const name = typeof raw.Class === 'string' ? raw.Class.trim() : raw.Class;
      if (!name) return;
      shipDesigns.push({
        sourceRecordKey: `${tab}:${rowNumber}`, sourceLocator: `${tab}!${rowNumber}`,
        name, ship_class: raw.Tonnage, role: raw.Type, faction_name: raw.Faction,
        fore_weapons: raw.Fore, aft_weapons: raw.Aft, starboard_weapons: raw.Starboard,
        port_weapons: raw.Port, status: raw.Status, length: raw.Length, width: raw.Width,
        height: raw.Height, notable_ships_raw: raw['Notable Ships'], decks: raw.Decks,
        notes: raw.Notes, source_group: tab, ruleset: 'starfinder_1e', content_origin: 'homebrew'
      });
    });
  }
  return { parser: 'ship-classes-v1', collections: { shipDesigns }, issues: [] };
}

module.exports = { parseShipClassesWorkbook };
