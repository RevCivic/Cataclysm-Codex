'use strict';

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'db.json');
const DEFAULT_CAMPAIGN_ID = '00000000-0000-4000-8000-000000000001';

const adapter = new FileSync(DB_PATH);
const db = low(adapter);

// Initialize database with default empty collections
// Legacy collections (maintained for backward compatibility during migration)
db.defaults({
  people: [],
  species: [],
  parties: [],
  factions: [],
  weapons: [],
  starships: [],
  armors: [],
  timeline: [],
  campaigns: [{ id: DEFAULT_CAMPAIGN_ID, slug: 'cataclysm', name: 'Cataclysm', ruleset: 'starfinder_1e' }],
  organizations: [],
  sessions: [],
  events: [],
  starSystems: [],
  worlds: [],
  locations: [],
  shipDesigns: [],
  items: [],
  upgrades: [],
  loreDocuments: [],
  loreSections: [],
  personRelationships: [],
  crewAssignments: [],
  partyMemberships: [],
  inventories: [],
  entityAliases: [],
  sourceRecords: [],
  sourceSnapshots: [],
  importRuns: [],
  fieldProvenance: [],
  planetClasses: [],
  historicalMemberships: [],
  shipSpaces: [],
  referenceEntries: [],
  // New unified collections (Phase 2, 3, 4)
  entities: [],
  relationships: []
}).write();

/**
 * Generic CRUD helpers for a collection
 */
function getAll(collection) {
  return db.get(collection).value();
}

function getById(collection, id) {
  return db.get(collection).find({ id }).value();
}

function create(collection, data) {
  const record = { ...data, id: uuidv4(), created_at: new Date().toISOString() };
  db.get(collection).push(record).write();
  return record;
}

function update(collection, id, data) {
  db.get(collection).find({ id }).assign({ ...data, updated_at: new Date().toISOString() }).write();
  return db.get(collection).find({ id }).value();
}

function remove(collection, id) {
  const record = db.get(collection).find({ id }).value();
  if (!record) return null;
  db.get(collection).remove({ id }).write();
  return record;
}

/**
 * Query helpers for unified entity and relationship schemas
 */
function getAllByType(collection, entityType) {
  const records = db.get(collection).value();
  if (!Array.isArray(records)) return [];
  return records.filter(record => record.entity_type === entityType);
}

function getByIdentity(collection, identity) {
  if (!identity) return null;
  const records = db.get(collection).value();
  if (!Array.isArray(records)) return null;
  return records.find(record => {
    if (record.entity_type === 'organization') {
      return record.organization_identity === identity;
    } else if (record.entity_type === 'item') {
      return record.item_identity === identity;
    } else if (record.entity_type === 'person') {
      return record.person_identity === identity;
    }
    return false;
  }) || null;
}

function getState() {
  return db.getState();
}

function setState(state) {
  return db.setState(state);
}

module.exports = { DEFAULT_CAMPAIGN_ID, db, getAll, getById, create, update, remove, getAllByType, getByIdentity, getState, setState };
