'use strict';

const ExcelJS = require('exceljs');
const { extractImageUrl, createImageRef, findImageColumnIndex } = require('../image-service');

const REQUIRED_TABS = ['Main Crew', 'Other Crew', 'Departments', 'Stats'];

const LOG_PREFIX = '[crew-v1]';

/**
 * Find the first row in a sheet that looks like a header row.
 * Some workbooks put a human-readable title in row 1 and actual column headers in row 2 or later.
 * A "header row" is defined as the first row (within the first 5) that contains at least one of
 * the supplied candidate column names (case-insensitive exact match).
 * Falls back to row 1 if no better candidate is found.
 */
function findHeaderRow(sheet, candidates) {
  let headerRowNumber = 1;
  let found = false;
  if (!candidates || candidates.length === 0) return headerRowNumber;
  const lowerCandidates = candidates.map(c => c.toLocaleLowerCase('en-US'));
  sheet.eachRow((row, rowNumber) => {
    if (found || rowNumber > 5) return;
    const rowValues = row.values.slice(1).map(v => (v !== null && v !== undefined) ? String(v).trim().toLocaleLowerCase('en-US') : '');
    if (lowerCandidates.some(c => rowValues.includes(c))) {
      headerRowNumber = rowNumber;
      found = true;
    }
  });
  return headerRowNumber;
}

function plainValue(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map(part => part.text).join('');
    if ('result' in value) return plainValue(value.result);
    if ('text' in value) return value.text;
    if ('hyperlink' in value) return value.text || value.hyperlink;
    if ('error' in value) return null; // Handle Excel error values
    // For unexpected objects, return null rather than the object itself
    return null;
  }
  // For primitive types (string, number, boolean), return as-is; otherwise return null
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : null;
}

function rowObject(row, headers) {
  const result = {};
  for (let column = 1; column <= headers.length; column += 1) {
    if (headers[column - 1]) result[headers[column - 1]] = plainValue(row.getCell(column).value);
  }
  return result;
}

function headersFor(sheet, rowNumber = 1) {
  return sheet.getRow(rowNumber).values.slice(1).map(value => String(value || '').trim());
}

function assertSheet(workbook, name) {
  const sheet = workbook.getWorksheet(name);
  if (!sheet) throw new Error(`Crew workbook is missing required tab: ${name}`);
  return sheet;
}

/**
 * Generic crew tab parser
 * @param {ExcelJS.Worksheet} sheet - The worksheet to parse
 * @param {string[]} headers - Column headers
 * @param {number} headerRowNumber - Row number where headers are located
 * @param {number} imageColumnIndex - Index of image column, or -1
 * @param {string} tabName - Tab name (for sourcing keys)
 * @param {string[]} nameColumnCandidates - Possible column names for person's name
 * @param {string[]} baseExcludedColumns - Base columns to exclude from extensions
 * @param {string} crewStatus - Status to assign (e.g., 'active', 'npc')
 * @param {Function} fieldExtractor - Function(raw) -> object of fields to include in record
 * @param {Object} issues - Issues array to report warnings
 * @returns {Object[]} Array of parsed crew records
 */
function parseCrewTab(sheet, headers, headerRowNumber, imageColumnIndex, tabName, nameColumnCandidates, baseExcludedColumns, crewStatus, fieldExtractor, issues) {
  const people = [];
  const seen = new Map();
  let rowsProcessed = 0;
  let rowsSkipped = 0;

  console.log(`${LOG_PREFIX} ${tabName}: header row=${headerRowNumber}, ${headers.length} columns, name candidates=${JSON.stringify(nameColumnCandidates)}`);
  
  // Determine the actual image column header that was matched (if any)
  const matchedImageColumn = imageColumnIndex >= 0 ? headers[imageColumnIndex] : null;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return; // skip header row(s) and any title rows above
    rowsProcessed++;
    const raw = rowObject(row, headers);
    
    // Get name from various possible column names
    const name = nameColumnCandidates.reduce((found, col) => found || raw[col], null);
    if (!name || typeof name !== 'string') {
      if (rowsSkipped < 5) {
        const rawKeys = Object.keys(raw).filter(k => raw[k] !== null && raw[k] !== undefined);
        console.log(`${LOG_PREFIX} ${tabName} row ${rowNumber}: skipped — no valid name found. Non-null keys: ${JSON.stringify(rawKeys.slice(0, 8))}, checked candidates: ${JSON.stringify(nameColumnCandidates)}`);
      } else if (rowsSkipped === 5) {
        console.log(`${LOG_PREFIX} ${tabName}: suppressing further skip logs...`);
      }
      rowsSkipped++;
      return;
    }
    
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const normalizedName = trimmedName.toLocaleLowerCase('en-US');
    if (seen.has(normalizedName)) {
      issues.push({
        severity: 'warning',
        code: 'duplicate_crew_name',
        sourceLocator: `${tabName}!${rowNumber}`,
        conflictingLocator: seen.get(normalizedName),
        detail: `Duplicate name "${trimmedName}" in ${tabName}, skipping`
      });
      return;
    }
    seen.set(normalizedName, `${tabName}!${rowNumber}`);

    // Extract image URL if available
    let imageUrl = null;
    if (imageColumnIndex >= 0) {
      const cellValue = row.getCell(imageColumnIndex + 1).value;
      imageUrl = extractImageUrl(cellValue);
    }

    const imageRef = imageUrl ? createImageRef(imageUrl, `${tabName}!${rowNumber}`) : null;

    // Exclude only the columns that are explicitly mapped or are the matched image column
    const excludedColumns = [...baseExcludedColumns];
    if (matchedImageColumn) {
      excludedColumns.push(matchedImageColumn);
    }

    // Build record with common fields
    const record = {
      sourceRecordKey: `${tabName}:${rowNumber}`,
      sourceLocator: `${tabName}!${rowNumber}`,
      name: trimmedName,
      imageUrl,
      imageRef: imageRef ? imageRef.ref : null,
      crewStatus,
      extensions: Object.fromEntries(Object.entries(raw).filter(([key]) => !excludedColumns.includes(key)))
    };

    // Add tab-specific fields
    Object.assign(record, fieldExtractor(raw));

    people.push(record);
  });

  console.log(`${LOG_PREFIX} ${tabName}: ${rowsProcessed} data rows processed → ${people.length} records added, ${rowsSkipped} rows skipped`);
  return people;
}

/**
 * Parse the Main Crew tab - primary crew members
 */
function parseMainCrew(sheet, headers, headerRowNumber, imageColumnIndex, issues) {
  return parseCrewTab(
    sheet,
    headers,
    headerRowNumber,
    imageColumnIndex,
    'Main Crew',
    ['Name', 'Full Name', 'Character Name', 'PC Name'],
    [
      'Name', 'Full Name', 'Character Name', 'PC Name', 'Race', 'Species', 'Class', 'Character Class',
      'Level', 'Role', 'Position', 'Rank', 'Title', 'Department', 'Home World', 'Homeworld',
      'Alignment', 'Deity', 'Religion', 'Background', 'Notes', 'Description'
    ],
    'active',
    (raw) => ({
      race: raw.Race || raw.Species,
      class: raw.Class || raw['Character Class'],
      level: raw.Level,
      role: raw.Role || raw.Position,
      rank: raw.Rank || raw.Title,
      department: raw.Department,
      homeWorld: raw['Home World'] || raw.Homeworld,
      alignment: raw.Alignment,
      deity: raw.Deity || raw.Religion,
      background: raw.Background,
      notes: raw.Notes || raw.Description
    }),
    issues
  );
}

/**
 * Parse the Other Crew tab - supporting characters
 */
function parseOtherCrew(sheet, headers, headerRowNumber, imageColumnIndex, issues) {
  return parseCrewTab(
    sheet,
    headers,
    headerRowNumber,
    imageColumnIndex,
    'Other Crew',
    ['Name', 'Full Name', 'Character Name'],
    [
      'Name', 'Full Name', 'Character Name', 'Race', 'Species', 'Role', 'Position', 'Department',
      'Occupation', 'Affiliation', 'Faction', 'Notes', 'Description'
    ],
    'npc',
    (raw) => ({
      race: raw.Race || raw.Species,
      role: raw.Role || raw.Position,
      department: raw.Department,
      occupation: raw.Occupation,
      affiliation: raw.Affiliation || raw.Faction,
      notes: raw.Notes || raw.Description
    }),
    issues
  );
}

/**
 * Parse Departments tab - organizational structure
 */
function parseDepartments(sheet, issues) {
  const headerRowNumber = findHeaderRow(sheet, ['Department', 'Department Name', 'Head', 'Commander']);
  const headers = headersFor(sheet, headerRowNumber);
  console.log(`${LOG_PREFIX} Departments: header row=${headerRowNumber}, headers=${JSON.stringify(headers.filter(Boolean).slice(0, 10))}`);
  const departments = [];
  const seen = new Set();
  let rowsSkipped = 0;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return;
    const raw = rowObject(row, headers);
    
    const name = raw.Department || raw['Department Name'];
    if (!name || typeof name !== 'string') {
      rowsSkipped++;
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) return;
    
    // Use case-insensitive comparison for consistency with crew tabs
    const nameLower = trimmedName.toLocaleLowerCase();
    if (seen.has(nameLower)) {
      issues.push({
        severity: 'warning',
        code: 'duplicate_department_name',
        sourceLocator: `Departments!${rowNumber}`,
        detail: `Duplicate department name "${trimmedName}", skipping`
      });
      return;
    }
    seen.add(nameLower);

    departments.push({
      sourceRecordKey: `Departments:${rowNumber}`,
      sourceLocator: `Departments!${rowNumber}`,
      name: trimmedName,
      head: raw.Head || raw.Commander || raw.Chief,
      description: raw.Description || raw.Purpose,
      function: raw.Function || raw.Role,
      notes: raw.Notes,
      extensions: Object.fromEntries(Object.entries(raw).filter(([key]) => ![
        'Department', 'Department Name', 'Head', 'Commander', 'Chief', 'Description', 'Purpose',
        'Function', 'Role', 'Notes'
      ].includes(key)))
    });
  });

  console.log(`${LOG_PREFIX} Departments: ${departments.length} departments parsed, ${rowsSkipped} rows skipped`);
  return departments;
}

/**
 * Parse Stats tab - crew statistics or reference data
 */
function parseStats(sheet) {
  const headers = headersFor(sheet);
  const stats = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const raw = rowObject(row, headers);
    
    // Stats tab might contain various reference data - preserve as-is
    if (Object.values(raw).some(v => v !== null)) {
      stats.push({
        sourceRecordKey: `Stats:${rowNumber}`,
        sourceLocator: `Stats!${rowNumber}`,
        data: raw
      });
    }
  });

  return stats;
}

async function parseCrewWorkbook(filePath) {
  console.log(`${LOG_PREFIX} Parsing crew workbook: ${filePath}`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  // Log all available worksheets
  const sheetNames = workbook.worksheets.map(ws => ws.name);
  console.log(`${LOG_PREFIX} Found ${sheetNames.length} worksheets: ${JSON.stringify(sheetNames)}`);

  // Validate required tabs
  for (const tabName of REQUIRED_TABS) {
    assertSheet(workbook, tabName);
  }
  console.log(`${LOG_PREFIX} All required tabs present: ${JSON.stringify(REQUIRED_TABS)}`);

  const issues = [];
  const people = [];
  const departments = [];
  const stats = [];

  // Parse Main Crew
  const mainCrewSheet = workbook.getWorksheet('Main Crew');
  const mainCrewHeaderRow = findHeaderRow(mainCrewSheet, ['Name', 'Full Name', 'Character Name', 'PC Name', 'Race', 'Class']);
  const mainCrewHeaders = headersFor(mainCrewSheet, mainCrewHeaderRow);
  console.log(`${LOG_PREFIX} Main Crew headers (row ${mainCrewHeaderRow}): ${JSON.stringify(mainCrewHeaders.filter(Boolean).slice(0, 15))}`);
  const mainCrewImageCol = findImageColumnIndex(mainCrewHeaders);
  people.push(...parseMainCrew(mainCrewSheet, mainCrewHeaders, mainCrewHeaderRow, mainCrewImageCol, issues));

  // Parse Other Crew
  const otherCrewSheet = workbook.getWorksheet('Other Crew');
  const otherCrewHeaderRow = findHeaderRow(otherCrewSheet, ['Name', 'Full Name', 'Character Name', 'Race', 'Role']);
  const otherCrewHeaders = headersFor(otherCrewSheet, otherCrewHeaderRow);
  console.log(`${LOG_PREFIX} Other Crew headers (row ${otherCrewHeaderRow}): ${JSON.stringify(otherCrewHeaders.filter(Boolean).slice(0, 15))}`);
  const otherCrewImageCol = findImageColumnIndex(otherCrewHeaders);
  people.push(...parseOtherCrew(otherCrewSheet, otherCrewHeaders, otherCrewHeaderRow, otherCrewImageCol, issues));

  // Parse Departments
  const departmentsSheet = workbook.getWorksheet('Departments');
  departments.push(...parseDepartments(departmentsSheet, issues));

  // Parse Stats
  const statsSheet = workbook.getWorksheet('Stats');
  stats.push(...parseStats(statsSheet));

  // Try to parse optional tabs if they exist
  const optionalTabs = ['Assets', 'Family', 'Kids', 'Equipment', 'Quarters', 'Supers'];
  const extensions = {};

  for (const tabName of optionalTabs) {
    const sheet = workbook.getWorksheet(tabName);
    if (sheet) {
      const headers = headersFor(sheet);
      const records = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const raw = rowObject(row, headers);
        if (Object.values(raw).some(v => v !== null)) {
          records.push({
            sourceRecordKey: `${tabName}:${rowNumber}`,
            sourceLocator: `${tabName}!${rowNumber}`,
            data: raw
          });
        }
      });
      if (records.length > 0) {
        console.log(`${LOG_PREFIX} Optional tab "${tabName}": ${records.length} records`);
        extensions[tabName.toLowerCase()] = records;
      }
    }
  }

  console.log(`${LOG_PREFIX} Parse complete: ${people.length} people, ${departments.length} departments, ${stats.length} stats rows, ${issues.length} issues`);

  return {
    parser: 'crew-v1',
    collections: {
      people,
      departments
    },
    stats,
    extensions,
    issues
  };
}

module.exports = { parseCrewWorkbook, plainValue };
