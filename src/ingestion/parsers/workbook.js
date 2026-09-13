'use strict';

function plainValue(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map(part => part.text).join('');
    if ('result' in value) return plainValue(value.result);
    if ('text' in value) return value.text;
    if ('hyperlink' in value) return value.text || value.hyperlink;
    if ('error' in value) return null;
    // For unexpected objects, return null rather than the object itself
    return null;
  }
  // For primitive types (string, number, boolean), return as-is; otherwise return null
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : null;
}

function headersFor(sheet, rowNumber = 1) {
  return sheet.getRow(rowNumber).values.slice(1).map(value => String(value || '').trim());
}

function rowObject(row, headers) {
  const result = {};
  for (let column = 1; column <= headers.length; column += 1) {
    if (headers[column - 1]) result[headers[column - 1]] = plainValue(row.getCell(column).value);
  }
  return result;
}

function assertSheet(workbook, name) {
  const sheet = workbook.getWorksheet(name);
  if (!sheet) throw new Error(`Workbook is missing required tab: ${name}`);
  return sheet;
}

module.exports = { assertSheet, headersFor, plainValue, rowObject };
