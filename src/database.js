'use strict';

const { pool, DEFAULT_CAMPAIGN_ID, seedTable } = require('./database-pool');
const { v4: uuidv4 } = require('uuid');

/**
 * Whitelist of allowed collections/tables
 * Supports both snake_case (actual table names) and camelCase (route aliases)
 */
const ALLOWED_COLLECTIONS = new Set([
  // Core entities (snake_case - actual table names)
  'campaigns', 'people', 'species', 'organizations', 'items', 'starships', 'timeline',
  'departments', 'sessions', 'events', 'star_systems', 'worlds', 'locations', 
  'ship_designs', 'lore_documents', 'lore_sections',
  'person_relationships', 'crew_assignments', 'party_memberships', 'inventories',
  'entity_aliases', 'source_records', 'source_snapshots', 'import_runs', 'field_provenance',
  'planet_classes', 'historical_memberships', 'ship_spaces', 'reference_entries',
  'entities', 'relationships',
  // Legacy view names (read-only for now)
  'parties', 'factions', 'weapons', 'armors', 'upgrades',
  // Compatibility aliases (camelCase - used by some routes)
  'starSystems', 'worldSystems', 'loreDocuments', 'loreSections', 'shipDesigns',
  'entityAliases', 'sourceRecords', 'sourceSnapshots', 'importRuns', 'fieldProvenance',
  'planetClasses', 'historicalMemberships', 'shipSpaces', 'referenceEntries'
]);

// Mapping from camelCase aliases to snake_case table names
const CASE_MAP = {
  'starSystems': 'star_systems',
  'worldSystems': 'worlds',
  'loreDocuments': 'lore_documents',
  'loreSections': 'lore_sections',
  'shipDesigns': 'ship_designs',
  'entityAliases': 'entity_aliases',
  'sourceRecords': 'source_records',
  'sourceSnapshots': 'source_snapshots',
  'importRuns': 'import_runs',
  'fieldProvenance': 'field_provenance',
  'planetClasses': 'planet_classes',
  'historicalMemberships': 'historical_memberships',
  'shipSpaces': 'ship_spaces',
  'referenceEntries': 'reference_entries'
};

/**
 * Validate and normalize collection name to prevent SQL injection
 */
function validateCollection(collection) {
  if (!ALLOWED_COLLECTIONS.has(collection)) {
    throw new Error(`Invalid collection: ${collection}`);
  }
  // Map camelCase to snake_case if needed
  return CASE_MAP[collection] || collection;
}

/**
 * Generic CRUD helpers for a collection/table
 */

async function getAll(collection) {
  try {
    const col = validateCollection(collection);
    const result = await pool.query(`SELECT * FROM ${col} ORDER BY created_at DESC`);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching all from ${collection}:`, error);
    throw error;
  }
}

async function getById(collection, id) {
  try {
    const col = validateCollection(collection);
    const result = await pool.query(
      `SELECT * FROM ${col} WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error fetching ${id} from ${collection}:`, error);
    throw error;
  }
}

async function create(collection, data) {
  try {
    const col = validateCollection(collection);
    const id = uuidv4();
    const now = new Date().toISOString();
    const record = { ...data, id, created_at: now, updated_at: now };
    
    // Build dynamic INSERT query with quoted column names
    const keys = Object.keys(record);
    const values = Object.values(record);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const quotedKeys = keys.map(key => `"${key}"`).join(', ');
    
    const query = `
      INSERT INTO ${col} (${quotedKeys})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    // Clear cache on mutation
    cachedState = null;
    return result.rows[0];
  } catch (error) {
    console.error(`Error creating in ${collection}:`, error);
    throw error;
  }
}

async function update(collection, id, data) {
  try {
    const col = validateCollection(collection);
    const now = new Date().toISOString();
    const updateData = { ...data, updated_at: now };
    
    // Build dynamic UPDATE query with quoted column names
    const keys = Object.keys(updateData);
    const values = [...Object.values(updateData), id];
    const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');
    
    const query = `
      UPDATE ${col}
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    // Clear cache on mutation
    cachedState = null;
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error updating ${id} in ${collection}:`, error);
    throw error;
  }
}

async function remove(collection, id) {
  try {
    const col = validateCollection(collection);
    // First get the record
    const getResult = await pool.query(
      `SELECT * FROM ${col} WHERE id = $1`,
      [id]
    );
    
    if (getResult.rows.length === 0) return null;
    
    const record = getResult.rows[0];
    
    // Then delete it
    await pool.query(
      `DELETE FROM ${col} WHERE id = $1`,
      [id]
    );
    
    // Clear cache on mutation
    cachedState = null;
    return record;
  } catch (error) {
    console.error(`Error deleting ${id} from ${collection}:`, error);
    throw error;
  }
}

/**
 * Query helpers for unified entity and relationship schemas
 */

async function getAllByType(collection, entityType) {
  try {
    const col = validateCollection(collection);
    const result = await pool.query(
      `SELECT * FROM ${col} WHERE entity_type = $1 ORDER BY created_at DESC`,
      [entityType]
    );
    return result.rows;
  } catch (error) {
    console.error(`Error fetching ${entityType} from ${collection}:`, error);
    throw error;
  }
}

async function getByIdentity(collection, identity) {
  try {
    const col = validateCollection(collection);
    if (!identity) return null;
    
    const result = await pool.query(
      `SELECT * FROM ${col} 
       WHERE organization_identity = $1 
          OR item_identity = $1 
          OR person_identity = $1
       LIMIT 1`,
      [identity]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error fetching by identity from ${collection}:`, error);
    throw error;
  }
}

/**
 * State management (for compatibility with legacy code)
 */

let cachedState = null;

async function getState() {
  if (cachedState) return cachedState;
  
  try {
    const state = {};
    
    // Get unique snake_case table names (resolving aliases through CASE_MAP)
    const uniqueTables = new Set();
    for (const collection of ALLOWED_COLLECTIONS) {
      const normalizedName = CASE_MAP[collection] || collection;
      uniqueTables.add(normalizedName);
    }
    
    const tables = Array.from(uniqueTables);
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT * FROM ${table}`);
        state[table] = result.rows;
      } catch (error) {
        // Table might not exist in schema, skip it
        state[table] = [];
      }
    }
    
    cachedState = state;
    return state;
  } catch (error) {
    console.error('Error fetching database state:', error);
    throw error;
  }
}

async function setState(state) {
  try {
    // Clear all tables first (be careful with this!)
    for (const [table, records] of Object.entries(state)) {
      const col = validateCollection(table);
      await pool.query(`TRUNCATE TABLE ${col} CASCADE`);
      
      // Re-insert records
      if (Array.isArray(records) && records.length > 0) {
        for (const record of records) {
          const keys = Object.keys(record);
          const values = Object.values(record);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          
          try {
            await pool.query(
              `INSERT INTO ${col} (${keys.join(', ')}) VALUES (${placeholders})`,
              values
            );
          } catch (error) {
            console.warn(`Warning: Could not insert record in ${table}:`, error.message);
          }
        }
      }
    }
    
    cachedState = state;
  } catch (error) {
    console.error('Error setting database state:', error);
    throw error;
  }
}

// Expose db object with getState/setState methods
const db = { getState, setState, create, update };

/**
 * Test-mode helper: seed a collection with an array of rows.
 * Supports lowdb-style chaining: db.set('col', rows).set('col2', rows2).write()
 * Collection names are translated via CASE_MAP (e.g. 'sourceRecords' → 'source_records')
 * before seeding so they align with the table names used by getAll/getById.
 */
function dbSet(collection, data) {
  const pending = { [CASE_MAP[collection] || collection]: data };
  const chain = {
    set(col, d) {
      pending[CASE_MAP[col] || col] = d;
      return chain;
    },
    async write() {
      for (const [tbl, rows] of Object.entries(pending)) {
        seedTable(tbl, rows);
      }
      cachedState = null;
    }
  };
  return chain;
}

db.set = dbSet;

module.exports = {
  DEFAULT_CAMPAIGN_ID,
  db,
  getAll,
  getById,
  create,
  update,
  remove,
  getAllByType,
  getByIdentity,
  getState,
  setState,
  pool,
  validateCollection
};
