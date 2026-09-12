'use strict';

const { v4: uuidv4 } = require('uuid');
const { DEFAULT_CAMPAIGN_ID, db, validateCollection } = require('../database');
const { identityFor, normalizeParsedImport } = require('./normalization');

// Maps from source record fields to entity collection references
// Supports both legacy (collection-based) and new unified schema (entity_type-based)
const SOURCE_RELATIONS = {
  document_source_key: { entityType: 'loreDocuments', field: 'document_id' },
  session_source_key: { entityType: 'sessions', field: 'session_id' },
  star_system_source_key: { entityType: 'starSystems', field: 'star_system_id' }
};

// Extended relations for unified schema (used when migrateToUnified is true)
const UNIFIED_SOURCE_RELATIONS = {
  document_source_key: { entityType: 'loreDocuments', field: 'document_id' },
  session_source_key: { entityType: 'sessions', field: 'session_id' },
  star_system_source_key: { entityType: 'starSystems', field: 'star_system_id' },
  organization_source_key: { entityType: 'organizations', field: 'organization_id', entityTypeFilter: 'organization' },
  item_source_key: { entityType: 'items', field: 'item_id', entityTypeFilter: 'item' }
};

function domainFields(record) {
  return Object.fromEntries(Object.entries(record).filter(([field]) =>
    !['sourceRecordKey', 'sourceLocator'].includes(field) && !field.endsWith('_source_key')));
}

function projectRecord(record, state, sourceId) {
  const projected = { ...domainFields(record), campaign_id: DEFAULT_CAMPAIGN_ID };
  for (const [sourceField, relation] of Object.entries(SOURCE_RELATIONS)) {
    if (!record[sourceField]) continue;
    const mapping = (state.source_records || []).find(item => item.source_id === sourceId &&
      item.entity_type === relation.entityType && item.source_record_key === record[sourceField]);
    if (mapping) projected[relation.field] = mapping.entity_id;
  }
  return projected;
}

function collectionContext(state, sourceId, collection) {
  // Convert collection name from camelCase to snake_case if needed to access state table
  // (e.g., 'loreDocuments' -> 'lore_documents' to access state.lore_documents)
  const tableName = validateCollection(collection);
  const entities = state[tableName];
  if (!Array.isArray(entities)) throw new Error(`Unknown target collection: ${collection}`);
  return {
    entities,
    byId: new Map(entities.map(entity => [entity.id, entity])),
    byIdentity: new Map(entities.map(entity => [identityFor(collection, entity), entity]).filter(([identity]) => identity)),
    // Note: entity_type in source_records is stored as camelCase (e.g., 'loreDocuments')
    // to match SOURCE_RELATIONS keys and maintain consistency with entity type tracking
    mappings: new Map((state.source_records || [])
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

async function previewImport(input, sourceId) {
  try {
    const parsed = normalizeParsedImport(input);
    
    // Fetch current database state for comparison
    const state = await db.getState();
    
    // Initialize state arrays to ensure consistent references
    if (!state.source_records) state.source_records = [];
    if (!state.field_provenance) state.field_provenance = [];
    if (!state.entity_aliases) state.entity_aliases = [];
    
    const breakdown = {};
    const changes = [];
    
    // Analyze each collection in the parsed input
    for (const [collection, records] of Object.entries(parsed.collections || {})) {
      if (!Array.isArray(records)) continue;
      
      breakdown[collection] = { create: 0, update: 0, unchanged: 0 };
      const context = collectionContext(state, sourceId, collection);
      
      for (const record of records) {
        const existing = existingEntity(context, collection, record);
        const projected = projectRecord(record, state, sourceId);
        const changed = changedFields(existing, projected);
        
        if (!existing) {
          breakdown[collection].create++;
          changes.push({ type: 'create', collection, record: projected });
        } else if (changed.length > 0) {
          breakdown[collection].update++;
          changes.push({ type: 'update', collection, record: projected, changed });
        } else {
          breakdown[collection].unchanged++;
        }
      }
    }
    
    return {
      parser: parsed.parser,
      counts: summarize(breakdown),
      breakdown,
      changes: changes.slice(0, 100), // Limit for UI
      issues: parsed.issues,
      aliases: (parsed.aliases || []).length
    };
  } catch (error) {
    console.error('Error previewing import:', error);
    throw error;
  }
}

function addMapping(state, context, source, collection, record, entity, now) {
  let mapping = context.mappings.get(record.sourceRecordKey);
  if (mapping) return mapping;
  mapping = {
    id: uuidv4(), source_id: source.id, source_record_key: record.sourceRecordKey,
    source_locator: record.sourceLocator, entity_type: collection, entity_id: entity.id, created_at: now
  };
  state.source_records.push(mapping);
  context.mappings.set(record.sourceRecordKey, mapping);
  return mapping;
}

function addProvenance(state, run, source, snapshot, collection, entity, record, projected, fields, now) {
  for (const field of fields) state.field_provenance.push({
    id: uuidv4(), entity_type: collection, entity_id: entity.id, field_path: field,
    source_id: source.id, snapshot_sha256: snapshot.manifest.sha256,
    source_locator: record.sourceLocator, raw_value: projected[field],
    transform_version: run.parser, import_run_id: run.id, imported_at: now
  });
}

function applyAliases(state, parsed, source, now) {
  if (!parsed.aliases.length || !parsed.collections.species) return;
  const speciesByName = new Map();
  const species = state.species || [];
  for (const sp of species) {
    for (const name of [sp.name, sp.matched_index_name]) {
      if (name) speciesByName.set(String(name).toLocaleLowerCase('en-US'), sp);
    }
  }
  for (const alias of parsed.aliases) {
    const entity = speciesByName.get(String(alias.canonicalName).toLocaleLowerCase('en-US'));
    if (!entity) continue;
    const normalizedAlias = String(alias.alias).trim().toLocaleLowerCase('en-US');
    const exists = state.entity_aliases.some(item => item.entity_type === 'species' &&
      item.entity_id === entity.id && item.normalized_alias === normalizedAlias);
    if (!exists) state.entity_aliases.push({
      id: uuidv4(), entity_type: 'species', entity_id: entity.id, alias: String(alias.alias).trim(),
      normalized_alias: normalizedAlias, source_id: source.id, source_locator: alias.sourceLocator,
      notes: alias.notes, created_at: now
    });
  }
}

async function applyImport(input, source, snapshot) {
  const parsed = normalizeParsedImport(input);
  if (parsed.issues.some(issue => issue.severity === 'error')) {
    throw new Error('Import contains blocking validation issues');
  }

  const now = new Date().toISOString();
  const state = await db.getState();
  
  // Initialize state arrays to ensure consistent references
  if (!state.source_records) state.source_records = [];
  if (!state.field_provenance) state.field_provenance = [];
  if (!state.entity_aliases) state.entity_aliases = [];
  
  const run = {
    id: uuidv4(), source_name: source.id, snapshot_hash: snapshot.manifest.sha256,
    status: 'completed', started_at: now, completed_at: now,
    records_created: 0, records_updated: 0, records_skipped: 0
  };

  try {
    // Process each collection in the parsed import
    for (const [collection, records] of Object.entries(parsed.collections || {})) {
      if (!Array.isArray(records)) continue;
      
      const context = collectionContext(state, source.id, collection);
      
      for (const record of records) {
        try {
          const existing = existingEntity(context, collection, record);
          const projected = projectRecord(record, state, source.id);
          
          if (!existing) {
            // Create new record
            await db.create(collection, projected);
            run.records_created++;
            
            // Add mapping for this new record
            const created = { ...projected, id: projected.id };
            addMapping(state, context, source, collection, record, created, now);
          } else {
            const changed = changedFields(existing, projected);
            if (changed.length > 0) {
              // Update existing record
              await db.update(collection, existing.id, projected);
              run.records_updated++;
            } else {
              run.records_skipped++;
            }
          }
        } catch (error) {
          console.warn(`Warning: Could not process ${collection} record:`, error.message);
          run.records_skipped++;
        }
      }
    }
    
    // Apply aliases if present
    applyAliases(state, parsed, source, now);
    
    // Record the import run
    await db.create('import_runs', run);
  } catch (error) {
    console.warn('Error during import:', error);
    // Still record the run even if there were errors
    try {
      await db.create('import_runs', run);
    } catch (runError) {
      console.warn('Error recording import run:', runError);
    }
  }

  return run;
}

module.exports = { applyImport, previewImport };
