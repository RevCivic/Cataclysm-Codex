'use strict';

const express = require('express');
const db = require('../database');

const router = express.Router();
const ENTITY_TYPES = new Set([
  'species', 'items', 'upgrades', 'shipDesigns', 'events', 'loreDocuments', 'organizations', 'sessions',
  'people', 'planetClasses', 'starSystems', 'worlds', 'shipSpaces', 'referenceEntries', 'historicalMemberships'
]);

router.get('/:entityType/:entityId', async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    if (!ENTITY_TYPES.has(entityType)) return res.status(404).json({ error: 'Unknown provenance entity type' });

    const mappings = await db.getAll('sourceRecords');
    const filteredMappings = mappings.filter(record =>
      record.entity_type === entityType && record.entity_id === entityId);
    const records = await db.getAll('fieldProvenance');
    const filteredRecords = records.filter(record =>
      record.entity_type === entityType && record.entity_id === entityId);
    const latestFields = new Map();
    [...filteredRecords].sort((a, b) => String(b.imported_at).localeCompare(String(a.imported_at))).forEach(record => {
      if (!latestFields.has(record.field_path)) latestFields.set(record.field_path, {
        field: record.field_path,
        source_id: record.source_id,
        source_locator: record.source_locator,
        snapshot_sha256: record.snapshot_sha256,
        transform_version: record.transform_version,
        imported_at: record.imported_at,
        import_run_id: record.import_run_id
      });
    });

    res.json({
      entity_type: entityType,
      entity_id: entityId,
      imported: filteredMappings.length > 0,
      source_records: filteredMappings.map(record => ({
        source_id: record.source_id,
        source_record_key: record.source_record_key,
        source_locator: record.source_locator,
        created_at: record.created_at
      })),
      fields: [...latestFields.values()].sort((a, b) => a.field.localeCompare(b.field)),
      history_count: filteredRecords.length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
