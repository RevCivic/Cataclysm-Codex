'use strict';

const { v4: uuidv4 } = require('uuid');
const { DEFAULT_CAMPAIGN_ID, db } = require('../database');
const { identityFor, normalizeParsedImport } = require('./normalization');

const SOURCE_RELATIONS = {
  document_source_key: { entityType: 'loreDocuments', field: 'document_id' },
  session_source_key: { entityType: 'sessions', field: 'session_id' },
  star_system_source_key: { entityType: 'starSystems', field: 'star_system_id' }
};

function domainFields(record) {
  return Object.fromEntries(Object.entries(record).filter(([field]) =>
    !['sourceRecordKey', 'sourceLocator'].includes(field) && !field.endsWith('_source_key')));
}

function projectRecord(record, state, sourceId) {
  const projected = { ...domainFields(record), campaign_id: DEFAULT_CAMPAIGN_ID };
  for (const [sourceField, relation] of Object.entries(SOURCE_RELATIONS)) {
    if (!record[sourceField]) continue;
    const mapping = state.sourceRecords.find(item => item.source_id === sourceId &&
      item.entity_type === relation.entityType && item.source_record_key === record[sourceField]);
    if (mapping) projected[relation.field] = mapping.entity_id;
  }
  return projected;
}

function collectionContext(state, sourceId, collection) {
  const entities = state[collection];
  if (!Array.isArray(entities)) throw new Error(`Unknown target collection: ${collection}`);
  return {
    entities,
    byId: new Map(entities.map(entity => [entity.id, entity])),
    byIdentity: new Map(entities.map(entity => [identityFor(collection, entity), entity]).filter(([identity]) => identity)),
    mappings: new Map(state.sourceRecords
      .filter(item => item.source_id === sourceId && item.entity_type === collection)
      .map(item => [item.source_record_key, item]))
  };
}

function existingEntity(context, collection, record) {
  const mapping = context.mappings.get(record.sourceRecordKey);
  return (mapping && context.byId.get(mapping.entity_id)) ||
    context.byIdentity.get(identityFor(collection, record)) || null;
}

function changedFields(entity, projected) {
  if (!entity) return Object.keys(projected);
  return Object.keys(projected).filter(field =>
    JSON.stringify(entity[field] ?? null) !== JSON.stringify(projected[field]));
}

function summarize(breakdown) {
  return Object.values(breakdown).reduce((total, counts) => ({
    create: total.create + counts.create,
    update: total.update + counts.update,
    unchanged: total.unchanged + counts.unchanged
  }), { create: 0, update: 0, unchanged: 0 });
}

function previewImport(input, sourceId) {
  const parsed = normalizeParsedImport(input);
  const state = db.getState();
  const breakdown = {};
  const changes = [];

  for (const [collection, records] of Object.entries(parsed.collections)) {
    const context = collectionContext(state, sourceId, collection);
    const counts = { create: 0, update: 0, unchanged: 0 };
    for (const record of records) {
      const entity = existingEntity(context, collection, record);
      const fields = changedFields(entity, projectRecord(record, state, sourceId));
      const action = !entity ? 'create' : fields.length ? 'update' : 'unchanged';
      counts[action] += 1;
      changes.push({
        collection, action, sourceRecordKey: record.sourceRecordKey,
        name: record.name || record.heading || record.title, changedFields: fields
      });
    }
    breakdown[collection] = counts;
  }

  return {
    parser: parsed.parser,
    counts: summarize(breakdown),
    breakdown,
    changes,
    issues: parsed.issues,
    aliases: parsed.aliases.length
  };
}

function addMapping(state, context, source, collection, record, entity, now) {
  let mapping = context.mappings.get(record.sourceRecordKey);
  if (mapping) return mapping;
  mapping = {
    id: uuidv4(), source_id: source.id, source_record_key: record.sourceRecordKey,
    source_locator: record.sourceLocator, entity_type: collection, entity_id: entity.id, created_at: now
  };
  state.sourceRecords.push(mapping);
  context.mappings.set(record.sourceRecordKey, mapping);
  return mapping;
}

function addProvenance(state, run, source, snapshot, collection, entity, record, projected, fields, now) {
  for (const field of fields) state.fieldProvenance.push({
    id: uuidv4(), entity_type: collection, entity_id: entity.id, field_path: field,
    source_id: source.id, snapshot_sha256: snapshot.manifest.sha256,
    source_locator: record.sourceLocator, raw_value: projected[field],
    transform_version: run.parser, import_run_id: run.id, imported_at: now
  });
}

function applyAliases(state, parsed, source, now) {
  if (!parsed.aliases.length || !parsed.collections.species) return;
  const speciesByName = new Map();
  for (const species of state.species) {
    for (const name of [species.name, species.matched_index_name]) {
      if (name) speciesByName.set(String(name).toLocaleLowerCase('en-US'), species);
    }
  }
  for (const alias of parsed.aliases) {
    const entity = speciesByName.get(String(alias.canonicalName).toLocaleLowerCase('en-US'));
    if (!entity) continue;
    const normalizedAlias = String(alias.alias).trim().toLocaleLowerCase('en-US');
    const exists = state.entityAliases.some(item => item.entity_type === 'species' &&
      item.entity_id === entity.id && item.normalized_alias === normalizedAlias);
    if (!exists) state.entityAliases.push({
      id: uuidv4(), entity_type: 'species', entity_id: entity.id, alias: String(alias.alias).trim(),
      normalized_alias: normalizedAlias, source_id: source.id, source_locator: alias.sourceLocator,
      notes: alias.notes, created_at: now
    });
  }
}

function applyImport(input, source, snapshot) {
  const parsed = normalizeParsedImport(input);
  if (parsed.issues.some(issue => issue.severity === 'error')) {
    throw new Error('Import contains blocking validation issues');
  }

  const now = new Date().toISOString();
  const state = structuredClone(db.getState());
  const run = {
    id: uuidv4(), source_id: source.id, snapshot_sha256: snapshot.manifest.sha256,
    parser: parsed.parser, status: 'completed', started_at: now, completed_at: now,
    counts: { create: 0, update: 0, unchanged: 0 }, breakdown: {}
  };

  for (const [collection, records] of Object.entries(parsed.collections)) {
    const context = collectionContext(state, source.id, collection);
    const counts = { create: 0, update: 0, unchanged: 0 };
    for (const record of records) {
      let entity = existingEntity(context, collection, record);
      const projected = projectRecord(record, state, source.id);
      const fields = changedFields(entity, projected);
      const action = !entity ? 'create' : fields.length ? 'update' : 'unchanged';
      if (!entity) {
        entity = { id: uuidv4(), created_at: now };
        context.entities.push(entity);
        context.byId.set(entity.id, entity);
      }
      if (action !== 'unchanged') Object.assign(entity, projected, action === 'update' ? { updated_at: now } : {});
      counts[action] += 1;
      addMapping(state, context, source, collection, record, entity, now);
      if (action !== 'unchanged') {
        addProvenance(state, run, source, snapshot, collection, entity, record, projected, fields, now);
      }
    }
    run.breakdown[collection] = counts;
  }

  run.counts = summarize(run.breakdown);
  applyAliases(state, parsed, source, now);
  if (!state.sourceSnapshots.some(item => item.source_id === source.id && item.sha256 === snapshot.manifest.sha256)) {
    state.sourceSnapshots.push({ ...snapshot.manifest, id: uuidv4(), source_id: source.id, recorded_at: now });
  }
  state.importRuns.push(run);
  db.setState(state).write();
  return run;
}

module.exports = { applyImport, previewImport };
