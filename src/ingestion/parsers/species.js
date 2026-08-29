'use strict';

const ExcelJS = require('exceljs');

const REQUIRED_COLUMNS = ['Species_Name', 'Matched_Index_Name'];

function plainValue(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map(part => part.text).join('');
    if ('result' in value) return plainValue(value.result);
    if ('text' in value) return value.text;
    if ('hyperlink' in value) return value.text || value.hyperlink;
  }
  return value;
}

function rowObject(row, headers) {
  const result = {};
  for (let column = 1; column <= headers.length; column += 1) {
    if (headers[column - 1]) result[headers[column - 1]] = plainValue(row.getCell(column).value);
  }
  return result;
}

function headersFor(sheet) {
  return sheet.getRow(1).values.slice(1).map(value => String(value || '').trim());
}

function assertSheet(workbook, name) {
  const sheet = workbook.getWorksheet(name);
  if (!sheet) throw new Error(`Species workbook is missing required tab: ${name}`);
  return sheet;
}

async function parseSpeciesWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const speciesSheet = assertSheet(workbook, 'DB_Species_Table');
  const speciesHeaders = headersFor(speciesSheet);
  for (const column of REQUIRED_COLUMNS) {
    if (!speciesHeaders.includes(column)) throw new Error(`DB_Species_Table is missing required column: ${column}`);
  }

  const issues = [];
  const species = [];
  const seen = new Map();
  speciesSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const raw = rowObject(row, speciesHeaders);
    const name = typeof raw.Species_Name === 'string' ? raw.Species_Name.trim() : raw.Species_Name;
    if (!name) {
      if (Object.values(raw).some(value => value !== null)) {
        issues.push({ severity: 'error', code: 'missing_name', sourceLocator: `DB_Species_Table!${rowNumber}` });
      }
      return;
    }
    const normalizedName = String(name).toLocaleLowerCase('en-US');
    if (seen.has(normalizedName)) {
      issues.push({
        severity: 'error',
        code: 'duplicate_name',
        sourceLocator: `DB_Species_Table!${rowNumber}`,
        conflictingLocator: seen.get(normalizedName)
      });
      return;
    }
    seen.set(normalizedName, `DB_Species_Table!${rowNumber}`);
    species.push({
      sourceRecordKey: `DB_Species_Table:${rowNumber}`,
      sourceLocator: `DB_Species_Table!${rowNumber}`,
      name,
      matchedIndexName: raw.Matched_Index_Name,
      homeWorld: raw.Home_World,
      size: raw.Size,
      type: raw.Type,
      atmosphere: raw.Air,
      sexes: raw.Sex,
      attributes: raw.Attributes,
      hoursOfSleep: raw.Hours_of_Sleep,
      daysWithoutFood: raw.Days_Without_Food,
      daysWithoutWater: raw.Days_Without_Water,
      background: raw.Background,
      sociology: raw.Sociology,
      physiology: raw.Physiology,
      specialAbilities: raw.Special_Abilities,
      extensions: Object.fromEntries(Object.entries(raw).filter(([key]) => ![
        'Species_Name', 'Matched_Index_Name', 'Home_World', 'Size', 'Type', 'Air', 'Sex',
        'Attributes', 'Hours_of_Sleep', 'Days_Without_Food', 'Days_Without_Water',
        'Background', 'Sociology', 'Physiology', 'Special_Abilities'
      ].includes(key)))
    });
  });

  const aliasSheet = assertSheet(workbook, 'DB_AliasMap');
  const aliasHeaders = headersFor(aliasSheet);
  const aliases = [];
  aliasSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const raw = rowObject(row, aliasHeaders);
    if (!raw.Stats_Name || !raw.Index_Name) return;
    aliases.push({
      sourceRecordKey: `DB_AliasMap:${rowNumber}`,
      sourceLocator: `DB_AliasMap!${rowNumber}`,
      alias: raw.Stats_Name,
      canonicalName: raw.Index_Name,
      notes: raw.Notes
    });
  });

  return { parser: 'species-v1', species, aliases, issues };
}

module.exports = { parseSpeciesWorkbook, plainValue };
