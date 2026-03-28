'use strict';

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'db.json');

const adapter = new FileSync(DB_PATH);
const db = low(adapter);

// Initialize database with default empty collections
db.defaults({
  people: [],
  species: [],
  parties: [],
  factions: [],
  weapons: [],
  starships: [],
  armors: [],
  timeline: []
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

module.exports = { db, getAll, getById, create, update, remove };
