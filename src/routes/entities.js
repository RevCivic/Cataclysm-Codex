'use strict';

const express = require('express');
const db = require('../database');

const router = express.Router();

/**
 * Unified entities endpoint supporting both legacy and new schema
 * GET /api/entities/:entity_type - List all entities of a specific type
 * GET /api/entities/:entity_type/:id - Get a specific entity
 */

const ENTITY_SOURCES = {
  person: { collection: 'people', legacyFilter: null },
  species: { collection: 'species', legacyFilter: null },
  organization: { collection: 'organizations', legacyFilter: null },
  item: { collection: 'items', legacyFilter: null },
  starship: { collection: 'starships', legacyFilter: null },
  event: { collection: 'events', legacyFilter: null },
  location: { collection: 'locations', legacyFilter: null },
  world: { collection: 'worlds', legacyFilter: null },
  // Support for unified schema attributes
  weapon: { collection: 'items', entityTypeFilter: 'item', itemTypeFilter: 'weapon' },
  armor: { collection: 'items', entityTypeFilter: 'item', itemTypeFilter: 'armor' },
  upgrade: { collection: 'items', entityTypeFilter: 'item', itemTypeFilter: 'upgrade' },
  party: { collection: 'organizations', entityTypeFilter: 'organization', organizationTypeFilter: 'party' },
  faction: { collection: 'organizations', entityTypeFilter: 'organization', organizationTypeFilter: 'faction' }
};

function filterRecords(records, filters) {
  return records.filter(record => {
    if (filters.entityTypeFilter && record.entity_type !== filters.entityTypeFilter) return false;
    if (filters.itemTypeFilter && record.item_type !== filters.itemTypeFilter) return false;
    if (filters.organizationTypeFilter && record.organization_type !== filters.organizationTypeFilter) return false;
    if (filters.campaignId && record.campaign_id !== filters.campaignId) return false;
    return true;
  });
}

// GET /api/entities/:entity_type - List all entities of a type
router.get('/:entity_type', (req, res, next) => {
  const source = ENTITY_SOURCES[req.params.entity_type];
  if (!source) return next();

  const records = db.getAll(source.collection) || [];
  const filtered = filterRecords(records, {
    entityTypeFilter: source.entityTypeFilter,
    itemTypeFilter: source.itemTypeFilter,
    organizationTypeFilter: source.organizationTypeFilter,
    campaignId: req.query.campaign_id
  });

  res.json(filtered);
});

// GET /api/entities/:entity_type/:id - Get a specific entity
router.get('/:entity_type/:id', (req, res, next) => {
  const source = ENTITY_SOURCES[req.params.entity_type];
  if (!source) return next();

  const record = db.getById(source.collection, req.params.id);
  if (!record) return res.status(404).json({ error: `${req.params.entity_type} not found` });

  // Apply filters if needed
  if (source.entityTypeFilter && record.entity_type !== source.entityTypeFilter) {
    return res.status(404).json({ error: `${req.params.entity_type} not found` });
  }
  if (source.itemTypeFilter && record.item_type !== source.itemTypeFilter) {
    return res.status(404).json({ error: `${req.params.entity_type} not found` });
  }
  if (source.organizationTypeFilter && record.organization_type !== source.organizationTypeFilter) {
    return res.status(404).json({ error: `${req.params.entity_type} not found` });
  }

  res.json(record);
});

// Error handler for unknown entity types
router.use((req, res) => res.status(404).json({ error: 'Unknown entity type' }));

module.exports = router;
