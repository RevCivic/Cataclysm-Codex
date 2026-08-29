'use strict';

const { v4: uuidv4 } = require('uuid');
const { DEFAULT_CAMPAIGN_ID, db } = require('../database');

const SPECIES_FIELDS = {
  name: 'name',
  homeWorld: 'home_world',
  size: 'size',
  type: 'type',
  attributes: 'attribute_bonuses',
  specialAbilities: 'traits',
  background: 'background',
  sociology: 'sociology',
  physiology: 'physiology',
  atmosphere: 'atmosphere',
  sexes: 'sexes',
  hoursOfSleep: 'hours_of_sleep',
  daysWithoutFood: 'days_without_food',
  daysWithoutWater: 'days_without_water',
  extensions: 'extensions'
};

function speciesProjection(record) {
  const projected = {};
  for (const [sourceField, targetField] of Object.entries(SPECIES_FIELDS)) {
    projected[targetField] = record[sourceField] ?? null;
  }
  return {
    ...projected,
    campaign_id: DEFAULT_CAMPAIGN_ID,
    ruleset: 'starfinder_1e',
    content_origin: 'homebrew',
    approval_status: 'imported'
  };
}

function previewSpeciesImport(parsed, sourceId) {
  const state = db.getState();
  const mappings = new Map((state.sourceRecords || [])
    .filter(record => record.source_id === sourceId && record.entity_type === 'species')
    .map(record => [record.source_record_key, record.entity_id]));
  const speciesById = new Map((state.species || []).map(record => [record.id, record]));
  const speciesByName = new Map((state.species || []).map(record => [record.name.toLocaleLowerCase('en-US'), record]));
  const changes = parsed.species.map(record => {
    const existing = speciesById.get(mappings.get(record.sourceRecordKey)) || speciesByName.get(record.name.toLocaleLowerCase('en-US'));
    const projected = speciesProjection(record);
    if (!existing) return { action: 'create', sourceRecordKey: record.sourceRecordKey, name: record.name };
    const changedFields = Object.keys(projected).filter(field => JSON.stringify(existing[field] ?? null) !== JSON.stringify(projected[field]));
    return { action: changedFields.length ? 'update' : 'unchanged', sourceRecordKey: record.sourceRecordKey, name: record.name, changedFields };
  });
  const counts = changes.reduce((result, change) => ({ ...result, [change.action]: (result[change.action] || 0) + 1 }), {
    create: 0, update: 0, unchanged: 0
  });
  return { parser: parsed.parser, counts, changes, issues: parsed.issues, aliases: parsed.aliases.length };
}

function applySpeciesImport(parsed, source, snapshot) {
  if (parsed.issues.some(issue => issue.severity === 'error')) {
    throw new Error('Import contains blocking validation issues');
  }
  const now = new Date().toISOString();
  const state = structuredClone(db.getState());
  const run = {
    id: uuidv4(), source_id: source.id, snapshot_sha256: snapshot.manifest.sha256,
    parser: parsed.parser, status: 'completed', started_at: now, completed_at: now
  };
  const mappings = new Map(state.sourceRecords
    .filter(record => record.source_id === source.id && record.entity_type === 'species')
    .map(record => [record.source_record_key, record]));
  const speciesById = new Map(state.species.map(record => [record.id, record]));
  const speciesByName = new Map(state.species.map(record => [record.name.toLocaleLowerCase('en-US'), record]));
  const counts = { create: 0, update: 0, unchanged: 0 };

  for (const record of parsed.species) {
    let mapping = mappings.get(record.sourceRecordKey);
    let entity = mapping ? speciesById.get(mapping.entity_id) : null;
    if (!entity) entity = speciesByName.get(record.name.toLocaleLowerCase('en-US'));
    const projected = speciesProjection(record);
    const action = entity
      ? (Object.keys(projected).some(field => JSON.stringify(entity[field] ?? null) !== JSON.stringify(projected[field])) ? 'update' : 'unchanged')
      : 'create';
    if (!entity) {
      entity = { id: uuidv4(), created_at: now };
      state.species.push(entity);
      speciesById.set(entity.id, entity);
    }
    Object.assign(entity, projected, action === 'update' ? { updated_at: now } : {});
    counts[action] += 1;
    if (!mapping) {
      mapping = {
        id: uuidv4(), source_id: source.id, source_record_key: record.sourceRecordKey,
        source_locator: record.sourceLocator, entity_type: 'species', entity_id: entity.id, created_at: now
      };
      state.sourceRecords.push(mapping);
      mappings.set(record.sourceRecordKey, mapping);
    }
    for (const [sourceField, targetField] of Object.entries(SPECIES_FIELDS)) {
      state.fieldProvenance.push({
        id: uuidv4(), entity_type: 'species', entity_id: entity.id, field_path: targetField,
        source_id: source.id, snapshot_sha256: snapshot.manifest.sha256,
        source_locator: record.sourceLocator, raw_value: record[sourceField] ?? null,
        transform_version: parsed.parser, import_run_id: run.id, imported_at: now
      });
    }
  }
  for (const alias of parsed.aliases) {
    const entity = speciesByName.get(String(alias.canonicalName).toLocaleLowerCase('en-US'));
    if (!entity) continue;
    const exists = state.entityAliases.some(item => item.entity_type === 'species' && item.entity_id === entity.id && item.alias === alias.alias);
    if (!exists) state.entityAliases.push({
      id: uuidv4(), entity_type: 'species', entity_id: entity.id, alias: alias.alias,
      normalized_alias: alias.alias.toLocaleLowerCase('en-US'), source_id: source.id,
      source_locator: alias.sourceLocator, notes: alias.notes, created_at: now
    });
  }
  if (!state.sourceSnapshots.some(item => item.source_id === source.id && item.sha256 === snapshot.manifest.sha256)) {
    state.sourceSnapshots.push({ ...snapshot.manifest, id: uuidv4(), source_id: source.id, recorded_at: now });
  }
  run.counts = counts;
  state.importRuns.push(run);
  db.setState(state).write();
  return run;
}

module.exports = { applySpeciesImport, previewSpeciesImport, speciesProjection };
