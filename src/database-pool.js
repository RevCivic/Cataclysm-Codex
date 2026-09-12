'use strict';

const { Pool } = require('pg');
const schema = require('./database-schema');

const DEFAULT_CAMPAIGN_ID = '00000000-0000-4000-8000-000000000001';

// Create connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'codex',
  password: process.env.DB_PASSWORD || 'codex',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cataclysm_codex'
});

// Initialize database schema
async function initializeDatabase() {
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

module.exports = { pool, DEFAULT_CAMPAIGN_ID, initializeDatabase };
