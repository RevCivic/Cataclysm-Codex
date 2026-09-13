'use strict';

const ExcelJS = require('exceljs');
const { extractImageUrl, createImageRef, findImageColumnIndex } = require('../image-service');
const { assertSheet, headersFor, plainValue, rowObject } = require('./workbook');
const { SPECIES_EXCLUDED_COLUMNS } = require('../normalization');

const REQUIRED_COLUMNS = ['Species_Name', 'Matched_Index_Name'];

async function parseSpeciesWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const speciesSheet = assertSheet(workbook, 'DB_Species_Table');
  const speciesHeaders = headersFor(speciesSheet);
  for (const column of REQUIRED_COLUMNS) {
    if (!speciesHeaders.includes(column)) throw new Error(`DB_Species_Table is missing required column: ${column}`);
  }

  const imageColumnIndex = findImageColumnIndex(speciesHeaders);
  
  // Determine the actual image column header that was matched (if any)
  const matchedImageColumn = imageColumnIndex >= 0 ? speciesHeaders[imageColumnIndex] : null;

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
    
    // Extract image URL if available
    let imageUrl = null;
    if (imageColumnIndex >= 0) {
      const cellValue = row.getCell(imageColumnIndex + 1).value;
      imageUrl = extractImageUrl(cellValue);
    }
    
    // Create image reference if URL found
    const imageRef = imageUrl ? createImageRef(imageUrl, `DB_Species_Table!${rowNumber}`) : null;

    // Exclude only the columns that are explicitly mapped or are the matched image column
    const excludedColumns = [...SPECIES_EXCLUDED_COLUMNS];
    if (matchedImageColumn) {
      excludedColumns.push(matchedImageColumn);
    }

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
      imageUrl,
      imageRef: imageRef ? imageRef.ref : null,
      extensions: Object.fromEntries(Object.entries(raw).filter(([key]) => !excludedColumns.includes(key)))
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

module.exports = { parseSpeciesWorkbook };
