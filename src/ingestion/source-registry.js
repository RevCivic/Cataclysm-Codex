'use strict';

const definitions = require('../../config/sources.json');

const VALID_KINDS = new Set(['sheet', 'doc']);
const VALID_FORMATS = new Set(['xlsx', 'docx']);

function validateDefinition(source) {
  if (!source || typeof source !== 'object') throw new Error('Source definition must be an object');
  if (!/^[a-z0-9-]+$/.test(source.id || '')) throw new Error(`Invalid source id: ${source.id || '(missing)'}`);
  if (!/^[a-zA-Z0-9_-]+$/.test(source.googleFileId || '')) {
    throw new Error(`Invalid Google file id for source ${source.id}`);
  }
  if (!VALID_KINDS.has(source.kind)) throw new Error(`Invalid source kind for ${source.id}: ${source.kind}`);
  if (!VALID_FORMATS.has(source.format)) throw new Error(`Invalid source format for ${source.id}: ${source.format}`);
  if (!source.parser) throw new Error(`Missing parser for source ${source.id}`);
  return Object.freeze({ ...source, expectedTabs: Object.freeze([...(source.expectedTabs || [])]) });
}

const sources = definitions.map(validateDefinition);
const byId = new Map(sources.map(source => [source.id, source]));

if (byId.size !== sources.length) throw new Error('Source ids must be unique');

function listSources() {
  return [...sources];
}

function getSource(id) {
  const source = byId.get(id);
  if (!source) throw new Error(`Unknown source: ${id}`);
  return source;
}

function exportUrl(source) {
  const resource = source.kind === 'sheet' ? 'spreadsheets' : 'document';
  return `https://docs.google.com/${resource}/d/${source.googleFileId}/export?format=${source.format}`;
}

module.exports = { exportUrl, getSource, listSources, validateDefinition };
