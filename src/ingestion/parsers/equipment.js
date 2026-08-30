'use strict';

const ExcelJS = require('exceljs');
const { assertSheet, headersFor, rowObject } = require('./workbook');

function collectRows(sheet, nameColumn, transform) {
  const headers = headersFor(sheet);
  const records = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const raw = rowObject(row, headers);
    const name = typeof raw[nameColumn] === 'string' ? raw[nameColumn].trim() : raw[nameColumn];
    if (!name) return;
    records.push({
      sourceRecordKey: `${sheet.name}:${rowNumber}`,
      sourceLocator: `${sheet.name}!${rowNumber}`,
      ...transform(raw, name)
    });
  });
  return records;
}

async function parseEquipmentWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const weapons = collectRows(assertSheet(workbook, 'Weapons'), 'Name', (raw, name) => ({
    name, item_kind: 'weapon', handed_size_small: raw['Size (S)'], handed_size_medium: raw['Size (M)'],
    handed_size_large: raw['Size (L)'], category: raw.Catagory, attack_bonus: raw['Atk Bonus'],
    damage: raw.Damage, damage_type: raw.Type, critical: raw.Crit, capacity: raw.Clip,
    fire_rate: raw['Fire Rate'], range: raw.Range, special: raw.Special,
    ruleset: 'starfinder_1e', content_origin: 'homebrew', approval_status: 'source_pending'
  }));
  const armors = collectRows(assertSheet(workbook, 'Armor'), 'Armor', (raw, name) => ({
    name, item_kind: 'armor', rarity: raw.Rarity, armor_class: raw.Class, eac_bonus: raw.EAC,
    kac_bonus: raw.KAC, max_dex: raw['Max Dex'], armor_check_penalty: raw['Armor Check Penalty'],
    speed_adjustment: raw['Speed Adjustment'], upgrade_slots: raw['Upgrade Slots'], bulk: raw.Bulk,
    extras: raw.Extras, description: raw.Description, extra_info: raw['Extra Info'],
    approval_status: raw['Brandon Approved?'] || 'source_pending', ruleset: 'starfinder_1e', content_origin: 'homebrew'
  }));
  const upgrades = collectRows(assertSheet(workbook, 'Upgrades'), 'Name', (raw, name) => ({
    name, rarity: raw.Rarity, bulk: raw.Bulk, compatibility: raw['Weapon or Armor'], effect: raw.Effect,
    manufacturer: raw.Manufacturer, approval_status: raw['Brandon Approved?'] || 'source_pending',
    ruleset: 'starfinder_1e', content_origin: 'homebrew'
  }));
  return { parser: 'equipment-v1', collections: { items: [...weapons, ...armors], upgrades }, issues: [] };
}

module.exports = { parseEquipmentWorkbook };
