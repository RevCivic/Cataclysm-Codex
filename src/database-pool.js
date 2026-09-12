'use strict';

const { Pool } = require('pg');
const schema = require('./database-schema');

const DEFAULT_CAMPAIGN_ID = '00000000-0000-4000-8000-000000000001';

/**
 * In-memory pool implementation used when DB_PATH is set (test mode).
 * Supports the subset of SQL queries issued by database.js.
 */
class InMemoryPool {
  constructor() {
    this._tables = new Map();
  }

  _table(name) {
    if (!this._tables.has(name)) this._tables.set(name, []);
    return this._tables.get(name);
  }

  seedTable(name, rows) {
    this._tables.set(name, Array.isArray(rows) ? [...rows] : []);
  }

  async query(sql, params = []) {
    const s = sql.trim().replace(/\s+/g, ' ');

    // Skip DDL statements (schema init)
    if (/^(CREATE|DROP|ALTER)/i.test(s)) return { rows: [] };

    // TRUNCATE TABLE tableName CASCADE
    const truncMatch = s.match(/^TRUNCATE TABLE (\w+)/i);
    if (truncMatch) {
      this._tables.set(truncMatch[1], []);
      return { rows: [] };
    }

    // INSERT INTO tableName (...) VALUES (...) [RETURNING *]
    const insertMatch = s.match(/^INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (insertMatch) {
      const tableName = insertMatch[1];
      const cols = insertMatch[2].split(',').map(c => c.trim().replace(/"/g, ''));
      const row = {};
      cols.forEach((col, i) => { row[col] = params[i] !== undefined ? params[i] : null; });
      const table = this._table(tableName);
      table.push(row);
      return { rows: [row] };
    }

    // UPDATE tableName SET ... WHERE id = $N [RETURNING *]
    const updateMatch = s.match(/^UPDATE (\w+)\s+SET (.+?) WHERE id = \$(\d+)/i);
    if (updateMatch) {
      const tableName = updateMatch[1];
      const setClause = updateMatch[2];
      const idParamIdx = parseInt(updateMatch[3]) - 1;
      const id = params[idParamIdx];
      const table = this._table(tableName);
      const idx = table.findIndex(r => String(r.id) === String(id));
      if (idx === -1) return { rows: [] };
      const setParts = setClause.match(/"?(\w+)"?\s*=\s*\$(\d+)/g) || [];
      for (const part of setParts) {
        const m = part.match(/"?(\w+)"?\s*=\s*\$(\d+)/);
        if (m) table[idx][m[1]] = params[parseInt(m[2]) - 1];
      }
      return { rows: [table[idx]] };
    }

    // DELETE FROM tableName WHERE id = $1
    const deleteMatch = s.match(/^DELETE FROM (\w+)\s+WHERE id = \$1/i);
    if (deleteMatch) {
      const tableName = deleteMatch[1];
      const existing = this._table(tableName);
      this._tables.set(tableName, existing.filter(r => String(r.id) !== String(params[0])));
      return { rows: [] };
    }

    // SELECT * FROM tableName [WHERE ...] [ORDER BY ...] [LIMIT n]
    const selectMatch = s.match(/^SELECT \* FROM (\w+)/i);
    if (selectMatch) {
      const tableName = selectMatch[1];
      let rows = [...this._table(tableName)];

      if (s.match(/WHERE id = \$1/i)) {
        rows = rows.filter(r => String(r.id) === String(params[0]));
      } else if (s.match(/WHERE entity_type = \$1/i)) {
        rows = rows.filter(r => r.entity_type === params[0]);
      } else if (s.match(/WHERE organization_identity/i)) {
        rows = rows.filter(r =>
          r.organization_identity === params[0] ||
          r.item_identity === params[0] ||
          r.person_identity === params[0]);
      }

      if (s.match(/ORDER BY created_at DESC/i)) {
        rows.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
      }

      if (s.match(/LIMIT 1/i)) rows = rows.slice(0, 1);

      return { rows };
    }

    return { rows: [] };
  }

  async connect() {
    const self = this;
    return {
      query: (sql, params) => self.query(sql, params),
      release: () => {}
    };
  }
}

// Use in-memory pool when DB_PATH is set (test mode), otherwise use real PostgreSQL pool
const isTestMode = !!process.env.DB_PATH;
let pool;

if (isTestMode) {
  pool = new InMemoryPool();
} else {
  pool = new Pool({
    user: process.env.DB_USER || 'codex',
    password: process.env.DB_PASSWORD || 'codex',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'cataclysm_codex'
  });
}

/**
 * Seed a table with rows directly (test mode only).
 */
function seedTable(tableName, rows) {
  if (!(pool instanceof InMemoryPool)) throw new Error('seedTable is only available in test mode');
  pool.seedTable(tableName, rows);
}

// Initialize database schema
async function initializeDatabase() {
  if (isTestMode) {
    // Seed default campaign in memory
    pool.seedTable('campaigns', [{
      id: DEFAULT_CAMPAIGN_ID, slug: 'cataclysm', name: 'Cataclysm', ruleset: 'starfinder_1e',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }]);
    return;
  }

  const client = await pool.connect();
  try {
    console.log('Initializing database schema...');
    
    // Split schema into individual statements and execute
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      await client.query(statement);
    }
    
    // Ensure default campaign exists
    const campaignResult = await client.query(
      'SELECT id FROM campaigns WHERE id = $1',
      [DEFAULT_CAMPAIGN_ID]
    );
    
    if (campaignResult.rows.length === 0) {
      await client.query(
        'INSERT INTO campaigns (id, slug, name, ruleset) VALUES ($1, $2, $3, $4)',
        [DEFAULT_CAMPAIGN_ID, 'cataclysm', 'Cataclysm', 'starfinder_1e']
      );
      console.log('Default campaign created');
    }
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, DEFAULT_CAMPAIGN_ID, initializeDatabase, seedTable, isTestMode };
