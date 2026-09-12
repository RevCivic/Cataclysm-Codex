'use strict';

const SPECIES_FIELDS = {
  name: 'name',
  matchedIndexName: 'matched_index_name',
  homeWorld: 'home_world',
  size: 'size',
  type: 'type',
  atmosphere: 'atmosphere',
  sexes: 'sexes',
  attributes: 'attribute_bonuses',
  hoursOfSleep: 'hours_of_sleep',
  daysWithoutFood: 'days_without_food',
  daysWithoutWater: 'days_without_water',
  background: 'background',
  sociology: 'sociology',
  physiology: 'physiology',
  specialAbilities: 'traits',
  imageUrl: 'image_url',
  imageRef: 'image_ref',
  extensions: 'extensions'
};

const PEOPLE_FIELDS = {
  name: 'name',
  race: 'race',
  class: 'class',
  level: 'level',
  role: 'role',
  rank: 'rank',
  department: 'department',
  homeWorld: 'home_world',
  alignment: 'alignment',
  deity: 'deity',
  background: 'background',
  notes: 'notes',
  imageUrl: 'image_url',
  imageRef: 'image_ref',
  crewStatus: 'crew_status',
  ruleset: 'ruleset',
  contentOrigin: 'content_origin',
  occupation: 'occupation',
  affiliation: 'affiliation',
  extensions: 'extensions'
};

const DEPARTMENT_FIELDS = {
  name: 'name',
  head: 'head',
  description: 'description',
  function: 'function',
  notes: 'notes',
  extensions: 'extensions'
};

const COLLECTION_SCHEMAS = {
  species: { identity: record => key(record.name) },
  people: { identity: record => key(record.name) },
  departments: { identity: record => key(record.name) },
  items: { identity: record => compound(record.item_kind, record.name) },
  upgrades: { identity: record => key(record.name) },
  shipDesigns: { identity: record => key(record.name) },
  loreDocuments: { identity: record => compound(record.document_kind, record.title) },
  loreSections: {},
  events: {},
  sessions: { identity: record => key(record.episode_number) },
  organizations: { identity: record => key(record.name) },
  planetClasses: { identity: record => key(record.code) },
  starSystems: { identity: record => compound(record.sector, record.source_code) },
  worlds: {},
  historicalMemberships: {},
  shipSpaces: { identity: record => compound(record.layout_version, record.deck_number) },
  referenceEntries: { identity: record => compound(record.reference_kind, record.name) },
  // Unified schema support for Phase 2, 3, 4
  entities: {
    identity: record => {
      if (record.entity_type === 'organization') {
        return record.organization_identity;
      } else if (record.entity_type === 'item') {
        return record.item_identity;
      } else if (record.entity_type === 'person') {
        return record.person_identity;
      }
      return key(record.name);
    }
  },
  relationships: {}
};

function key(value) {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim().toLocaleLowerCase('en-US');
}

function compound(...values) {
  const parts = values.map(key);
  return parts.every(Boolean) ? parts.join('\u001f') : null;
}

function normalizeValue(value) {
  if (typeof value === 'string') return value.trim() || null;
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([field, nested]) => [field, normalizeValue(nested)]));
  }
  return value;
}

function normalizeRecord(record) {
  return Object.fromEntries(Object.entries(record).map(([field, value]) => [field, normalizeValue(value)]));
}

function normalizeSpeciesRecord(record) {
  const normalized = {
    sourceRecordKey: record.sourceRecordKey,
    sourceLocator: record.sourceLocator
  };
  for (const [sourceField, targetField] of Object.entries(SPECIES_FIELDS)) {
    normalized[targetField] = normalizeValue(record[sourceField] ?? null);
  }
  return {
    ...normalized,
    ruleset: 'starfinder_1e',
    content_origin: 'homebrew',
    approval_status: 'imported'
  };
}

function normalizePeopleRecord(record) {
  const normalized = {
    sourceRecordKey: record.sourceRecordKey,
    sourceLocator: record.sourceLocator
  };
  for (const [sourceField, targetField] of Object.entries(PEOPLE_FIELDS)) {
    normalized[targetField] = normalizeValue(record[sourceField] ?? null);
  }
  
  // Apply defaults only for fields that are null/missing after normalization
  // This preserves explicit values from the source record
  if (normalized.ruleset === null) {
    normalized.ruleset = 'starfinder_1e';
  }
  if (normalized.content_origin === null) {
    normalized.content_origin = 'homebrew';
  }
  
  return {
    ...normalized,
    approval_status: 'imported'
  };
}

function normalizeDepartmentRecord(record) {
  const normalized = {
    sourceRecordKey: record.sourceRecordKey,
    sourceLocator: record.sourceLocator
  };
  for (const [sourceField, targetField] of Object.entries(DEPARTMENT_FIELDS)) {
    normalized[targetField] = normalizeValue(record[sourceField] ?? null);
  }
  return {
    ...normalized,
    content_origin: 'homebrew',
    approval_status: 'imported'
  };
}

function normalizeParsedImport(parsed) {
  const issues = [...(parsed.issues || [])];
  let inputCollections = {};

  if (parsed.parser === 'species-v1') {
    inputCollections = { species: (parsed.species || parsed.collections?.species || []).map(normalizeSpeciesRecord) };
  } else if (parsed.parser === 'crew-v1') {
    inputCollections = {};
    if (parsed.collections?.people) {
      inputCollections.people = parsed.collections.people.map(normalizePeopleRecord);
    }
    if (parsed.collections?.departments) {
      inputCollections.departments = parsed.collections.departments.map(normalizeDepartmentRecord);
    }
  } else {
    inputCollections = parsed.collections || {};
  }

  const collections = {};

  for (const [collection, records] of Object.entries(inputCollections)) {
    if (!COLLECTION_SCHEMAS[collection]) {
      issues.push({ severity: 'error', code: 'unknown_target_collection', collection });
      continue;
    }
    const seenSourceKeys = new Set();
    collections[collection] = [];
    for (const input of records) {
      const record = normalizeRecord(input);
      if (!record.sourceRecordKey || !record.sourceLocator) {
        issues.push({ severity: 'error', code: 'missing_source_identity', collection });
        continue;
      }
      if (seenSourceKeys.has(record.sourceRecordKey)) {
        issues.push({ severity: 'error', code: 'duplicate_source_key', collection, sourceRecordKey: record.sourceRecordKey });
        continue;
      }
      seenSourceKeys.add(record.sourceRecordKey);
      collections[collection].push(record);
    }
  }

  return { ...parsed, collections, aliases: parsed.aliases || [], issues };
}

function identityFor(collection, record) {
  return COLLECTION_SCHEMAS[collection]?.identity?.(record) || null;
}

module.exports = {
  COLLECTION_SCHEMAS, SPECIES_FIELDS, PEOPLE_FIELDS, DEPARTMENT_FIELDS, identityFor, normalizeParsedImport,
  normalizeRecord, normalizeSpeciesRecord, normalizePeopleRecord, normalizeDepartmentRecord, normalizeValue
};
