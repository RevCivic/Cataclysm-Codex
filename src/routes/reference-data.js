'use strict';

const express = require('express');
const db = require('../database');

const router = express.Router();
const RESOURCES = {
  items: { collection: 'items', label: 'Item' },
  upgrades: { collection: 'upgrades', label: 'Upgrade' },
  'ship-designs': { collection: 'shipDesigns', label: 'Ship design' },
  events: { collection: 'events', label: 'Event', sort: compareEvents },
  organizations: { collection: 'organizations', label: 'Organization' },
  sessions: { collection: 'sessions', label: 'Session' },
  'planet-classes': { collection: 'planetClasses', label: 'Planet class' },
  'star-systems': { collection: 'starSystems', label: 'Star system' },
  worlds: { collection: 'worlds', label: 'World' },
  'ship-spaces': { collection: 'shipSpaces', label: 'Ship space' },
  'reference-entries': { collection: 'referenceEntries', label: 'Reference entry' },
  'historical-memberships': { collection: 'historicalMemberships', label: 'Historical membership' }
};

function compareEvents(a, b) {
  return (Number(a.start_year) || 0) - (Number(b.start_year) || 0) ||
    String(a.title || '').localeCompare(String(b.title || ''));
}

function matchesFilters(record, query) {
  if (query.kind && record.item_kind !== query.kind) return false;
  if (query.campaign_id && record.campaign_id !== query.campaign_id) return false;
  // Support unified schema filters
  if (query.item_type && record.item_type !== query.item_type) return false;
  if (query.organization_type && record.organization_type !== query.organization_type) return false;
  if (query.entity_type && record.entity_type !== query.entity_type) return false;
  return true;
}

router.get('/:resource', (req, res, next) => {
  const resource = RESOURCES[req.params.resource];
  if (!resource) return next();
  let records = db.getAll(resource.collection).filter(record => matchesFilters(record, req.query));
  if (resource.sort) records = [...records].sort(resource.sort);
  res.json(records);
});

router.get('/:resource/:id', (req, res, next) => {
  const resource = RESOURCES[req.params.resource];
  if (!resource) return next();
  const record = db.getById(resource.collection, req.params.id);
  if (!record) return res.status(404).json({ error: `${resource.label} not found` });
  res.json(record);
});

router.use((req, res) => res.status(404).json({ error: 'Unknown reference resource' }));

module.exports = router;
