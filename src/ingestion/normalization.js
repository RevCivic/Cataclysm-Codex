'use strict';

// ─── Species ────────────────────────────────────────────────────────────────

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

// Raw spreadsheet column names explicitly handled by normalizeSpeciesRecord.
// Exported so species.js can exclude them from the extensions object.
const SPECIES_EXCLUDED_COLUMNS = [
  'Species_Name', 'Matched_Index_Name', 'Home_World', 'Size', 'Type', 'Air', 'Sex',
  'Attributes', 'Hours_of_Sleep', 'Days_Without_Food', 'Days_Without_Water',
  'Background', 'Sociology', 'Physiology', 'Special_Abilities'
];

// ─── People (crew-v1) ────────────────────────────────────────────────────────

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

// Raw spreadsheet column names explicitly handled when building crew records.
// Exported so crew.js can exclude them from the extensions object.
const PEOPLE_EXCLUDED_COLUMNS = [
  'Name', 'Full Name', 'Character Name', 'PC Name', 'Race', 'Species', 'Class', 'Character Class',
  'Level', 'Role', 'Position', 'Rank', 'Title', 'Department', 'Home World', 'Homeworld',
  'Alignment', 'Deity', 'Religion', 'Background', 'Notes', 'Description',
  'Occupation', 'Affiliation', 'Faction'
];

// Narrower exclusion list for NPC/supporting-character rows. PC-specific columns
// (Class, Level, Rank, Alignment, etc.) are intentionally kept so they flow into
// the extensions object when present on an NPC sheet.
const NPC_EXCLUDED_COLUMNS = [
  'Name', 'Full Name', 'Character Name', 'PC Name', 'Race', 'Species',
  'Role', 'Position', 'Department', 'Occupation', 'Affiliation', 'Faction',
  'Notes', 'Description'
];

// ─── Departments (crew-v1) ───────────────────────────────────────────────────

const DEPARTMENT_FIELDS = {
  name: 'name',
  head: 'head',
  description: 'description',
  function: 'function',
  notes: 'notes',
  extensions: 'extensions'
};

// Raw spreadsheet column names explicitly handled when building department records.
const DEPARTMENT_EXCLUDED_COLUMNS = [
  'Department', 'Department Name', 'Head', 'Commander', 'Chief', 'Description', 'Purpose',
  'Function', 'Role', 'Notes'
];

// ─── Items & Upgrades (equipment-v1) ─────────────────────────────────────────
// Upgrades are merged into the items collection with item_kind = 'upgrade'.

const ITEM_FIELDS = {
  name: 'name',
  item_kind: 'item_kind',
  handed_size_small: 'handed_size_small',
  handed_size_medium: 'handed_size_medium',
  handed_size_large: 'handed_size_large',
  category: 'category',
  attack_bonus: 'attack_bonus',
  damage: 'damage',
  damage_type: 'damage_type',
  critical: 'critical',
  capacity: 'capacity',
  fire_rate: 'fire_rate',
  range: 'range',
  special: 'special',
  rarity: 'rarity',
  armor_class: 'armor_class',
  eac_bonus: 'eac_bonus',
  kac_bonus: 'kac_bonus',
  max_dex: 'max_dex',
  armor_check_penalty: 'armor_check_penalty',
  speed_adjustment: 'speed_adjustment',
  upgrade_slots: 'upgrade_slots',
  bulk: 'bulk',
  extras: 'extras',
  description: 'description',
  extra_info: 'extra_info',
  compatibility: 'compatibility',
  effect: 'effect',
  manufacturer: 'manufacturer',
  approval_status: 'approval_status',
  ruleset: 'ruleset',
  content_origin: 'content_origin'
};

// ─── Ship Designs (ship-classes-v1) ─────────────────────────────────────────

const SHIP_DESIGN_FIELDS = {
  name: 'name',
  ship_class: 'ship_class',
  role: 'role',
  faction_name: 'faction_name',
  fore_weapons: 'fore_weapons',
  aft_weapons: 'aft_weapons',
  starboard_weapons: 'starboard_weapons',
  port_weapons: 'port_weapons',
  status: 'status',
  length: 'length',
  width: 'width',
  height: 'height',
  notable_ships_raw: 'notable_ships_raw',
  decks: 'decks',
  notes: 'notes',
  source_group: 'source_group',
  ruleset: 'ruleset',
  content_origin: 'content_origin'
};

// ─── Sessions (campaign-v1) ──────────────────────────────────────────────────

const SESSION_FIELDS = {
  episode_number: 'episode_number',
  title: 'title',
  summary: 'summary',
  in_world_date_raw: 'in_world_date_raw',
  location_raw: 'location_raw',
  ruleset: 'ruleset',
  content_origin: 'content_origin'
};

// ─── Events (campaign-v1, historical-timeline-v1) ────────────────────────────

const EVENT_FIELDS = {
  title: 'title',
  description: 'description',
  raw_date: 'raw_date',
  event_kind: 'event_kind',
  session_source_key: 'session_source_key',
  location_raw: 'location_raw',
  start_year: 'start_year',
  end_year: 'end_year',
  date_precision: 'date_precision',
  ruleset: 'ruleset',
  content_origin: 'content_origin'
};

// ─── Star Systems (campaign-v1) ──────────────────────────────────────────────

const STAR_SYSTEM_FIELDS = {
  name: 'name',
  source_code: 'source_code',
  sector: 'sector',
  star_type: 'star_type',
  inhabited: 'inhabited',
  discovered_by: 'discovered_by',
  notes: 'notes',
  ruleset: 'ruleset',
  content_origin: 'content_origin'
};

// ─── Worlds (campaign-v1) ────────────────────────────────────────────────────

const WORLD_FIELDS = {
  name: 'name',
  orbital_position: 'orbital_position',
  planet_class: 'planet_class',
  star_system_source_key: 'star_system_source_key',
  inhabited: 'inhabited',
  discovered_by: 'discovered_by',
  system_notes: 'system_notes',
  ruleset: 'ruleset',
  content_origin: 'content_origin'
};

// ─── Organizations (campaign-v1) ─────────────────────────────────────────────

const ORGANIZATION_FIELDS = {
  name: 'name',
  organization_kind: 'organization_kind',
  industry: 'industry',
  leader_raw: 'leader_raw',
  products_raw: 'products_raw',
  ruleset: 'ruleset',
  content_origin: 'content_origin'
};

// ─── Planet Classes (campaign-v1) ────────────────────────────────────────────

const PLANET_CLASS_FIELDS = {
  name: 'name',
  code: 'code',
  habitable: 'habitable',
  example: 'example',
  description: 'description',
  content_origin: 'content_origin'
};

// ─── Historical Memberships (campaign-v1) ────────────────────────────────────

const HISTORICAL_MEMBERSHIP_FIELDS = {
  group_name: 'group_name',
  member_name: 'member_name',
  position: 'position'
};

// ─── Ship Spaces (campaign-v1) ───────────────────────────────────────────────

const SHIP_SPACE_FIELDS = {
  name: 'name',
  deck_number: 'deck_number',
  areas_raw: 'areas_raw',
  layout_version: 'layout_version'
};

// ─── Reference Entries (campaign-v1) ────────────────────────────────────────

const REFERENCE_ENTRY_FIELDS = {
  name: 'name',
  reference_kind: 'reference_kind',
  value: 'value',
  position: 'position'
};

// ─── Lore Documents ──────────────────────────────────────────────────────────

const LORE_DOCUMENT_FIELDS = {
  title: 'title',
  document_kind: 'document_kind',
  ruleset: 'ruleset',
  content_origin: 'content_origin'
};

// ─── Lore Sections ───────────────────────────────────────────────────────────

const LORE_SECTION_FIELDS = {
  document_source_key: 'document_source_key',
  position: 'sort_order',
  article_number: 'article_number',
  section_number: 'section_number',
  heading: 'title',
  body: 'content'
};

// ─── Collection schemas ──────────────────────────────────────────────────────

const COLLECTION_SCHEMAS = {
  species: { identity: record => key(record.name) },
  people: { identity: record => key(record.name) },
  departments: { identity: record => key(record.name) },
  items: { identity: record => compound(record.item_kind, record.name) },
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
  shipSpaces: { identity: record => compound(record.layout_version, String(record.deck_number)) },
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

// Generic helper: normalize a record using a fields map (sourceField → targetField)
// and apply a set of default values for fields that are null/missing after normalization.
function normalizeWithFields(record, fields, defaults = {}) {
  const normalized = {
    sourceRecordKey: record.sourceRecordKey,
    sourceLocator: record.sourceLocator
  };
  for (const [sourceField, targetField] of Object.entries(fields)) {
    normalized[targetField] = normalizeValue(record[sourceField] ?? null);
  }
  for (const [field, value] of Object.entries(defaults)) {
    if (normalized[field] === null || normalized[field] === undefined) {
      normalized[field] = value;
    }
  }
  return normalized;
}

// Normalize a record that already uses snake_case target field names.
// Applies normalizeValue to each field and sets defaults for null/missing fields.
function normalizeSnakeCaseRecord(record, defaults = {}) {
  const normalized = normalizeRecord(record);
  for (const [field, value] of Object.entries(defaults)) {
    if (normalized[field] === null || normalized[field] === undefined) {
      normalized[field] = value;
    }
  }
  return normalized;
}

function normalizeSpeciesRecord(record) {
  return normalizeWithFields(record, SPECIES_FIELDS, {
    ruleset: 'starfinder_1e',
    content_origin: 'homebrew',
    approval_status: 'imported'
  });
}

function normalizePeopleRecord(record) {
  return normalizeWithFields(record, PEOPLE_FIELDS, {
    ruleset: 'starfinder_1e',
    content_origin: 'homebrew',
    approval_status: 'imported'
  });
}

function normalizeDepartmentRecord(record) {
  return normalizeWithFields(record, DEPARTMENT_FIELDS, {
    content_origin: 'homebrew',
    approval_status: 'imported'
  });
}

function normalizeItemRecord(record) {
  const normalized = normalizeSnakeCaseRecord(record, {
    content_origin: 'homebrew',
    approval_status: 'imported'
  });
  // Keep item_type in sync with item_kind for legacy view compatibility
  if (normalized.item_kind && !normalized.item_type) {
    normalized.item_type = normalized.item_kind;
  }
  return normalized;
}

function normalizeShipDesignRecord(record) {
  return normalizeSnakeCaseRecord(record, {
    content_origin: 'homebrew',
    approval_status: 'imported'
  });
}

function normalizeLoreSectionRecord(record) {
  return normalizeWithFields(record, LORE_SECTION_FIELDS, { content_origin: 'homebrew' });
}

function normalizeSessionRecord(record) {
  return normalizeSnakeCaseRecord(record, { content_origin: 'homebrew' });
}

function normalizeEventRecord(record) {
  return normalizeSnakeCaseRecord(record, { content_origin: 'homebrew' });
}

function normalizeCampaignCollectionRecord(collection, record) {
  switch (collection) {
    case 'sessions': return normalizeSessionRecord(record);
    case 'events':   return normalizeEventRecord(record);
    default:         return normalizeSnakeCaseRecord(record, { content_origin: 'homebrew' });
  }
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
      console.log(`[crew-v1] normalizeParsedImport: ${parsed.collections.people.length} people input → ${inputCollections.people.length} normalized`);
    } else {
      console.log('[crew-v1] normalizeParsedImport: no people collection in parsed input');
    }
    if (parsed.collections?.departments) {
      inputCollections.departments = parsed.collections.departments.map(normalizeDepartmentRecord);
      console.log(`[crew-v1] normalizeParsedImport: ${parsed.collections.departments.length} departments input → ${inputCollections.departments.length} normalized`);
    } else {
      console.log('[crew-v1] normalizeParsedImport: no departments collection in parsed input');
    }
  } else if (parsed.parser === 'equipment-v1') {
    inputCollections = {};
    if (parsed.collections?.items) {
      inputCollections.items = parsed.collections.items.map(normalizeItemRecord);
    }
    // upgrades are merged into items (item_kind='upgrade') by the equipment parser
  } else if (parsed.parser === 'ship-classes-v1') {
    inputCollections = {};
    if (parsed.collections?.shipDesigns) {
      inputCollections.shipDesigns = parsed.collections.shipDesigns.map(normalizeShipDesignRecord);
    }
  } else if (parsed.parser === 'campaign-v1') {
    inputCollections = {};
    for (const [collection, records] of Object.entries(parsed.collections || {})) {
      if (!Array.isArray(records)) continue;
      inputCollections[collection] = records.map(record => normalizeCampaignCollectionRecord(collection, record));
    }
  } else if (parsed.parser === 'lore-document-v1' || parsed.parser === 'historical-timeline-v1') {
    inputCollections = {};
    for (const [collection, records] of Object.entries(parsed.collections || {})) {
      if (!Array.isArray(records)) continue;
      if (collection === 'loreSections') {
        inputCollections[collection] = records.map(normalizeLoreSectionRecord);
      } else {
        inputCollections[collection] = records.map(record => normalizeSnakeCaseRecord(record, { content_origin: 'homebrew' }));
      }
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
  COLLECTION_SCHEMAS,
  SPECIES_FIELDS, SPECIES_EXCLUDED_COLUMNS,
  PEOPLE_FIELDS, PEOPLE_EXCLUDED_COLUMNS, NPC_EXCLUDED_COLUMNS,
  DEPARTMENT_FIELDS, DEPARTMENT_EXCLUDED_COLUMNS,
  ITEM_FIELDS, SHIP_DESIGN_FIELDS,
  SESSION_FIELDS, EVENT_FIELDS,
  STAR_SYSTEM_FIELDS, WORLD_FIELDS, ORGANIZATION_FIELDS,
  PLANET_CLASS_FIELDS, HISTORICAL_MEMBERSHIP_FIELDS,
  SHIP_SPACE_FIELDS, REFERENCE_ENTRY_FIELDS,
  LORE_DOCUMENT_FIELDS, LORE_SECTION_FIELDS,
  identityFor, normalizeParsedImport,
  normalizeRecord, normalizeSpeciesRecord, normalizePeopleRecord, normalizeDepartmentRecord,
  normalizeItemRecord, normalizeShipDesignRecord, normalizeValue
};
