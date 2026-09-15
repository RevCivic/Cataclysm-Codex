#!/usr/bin/env node
'use strict';

/**
 * Migration CLI - Manage database migrations
 * 
 * Usage:
 *   node migrate.js status      - Show migration status
 *   node migrate.js up          - Run pending migrations
 *   node migrate.js down [name] - Rollback a specific migration or all
 */

const { Pool } = require('pg');
const MigrationManager = require('./src/migration-manager');

const pool = new Pool({
  user: process.env.DB_USER || 'codex',
  password: process.env.DB_PASSWORD || 'codex',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cataclysm_codex'
});

async function main() {
  const command = process.argv[2] || 'status';
  const arg = process.argv[3];
  
  const client = await pool.connect();
  
  try {
    const manager = new MigrationManager(client);
    
    switch (command) {
      case 'up':
        await manager.runPendingMigrations();
        break;
      
      case 'down':
        if (arg) {
          await manager.rollback(arg);
        } else {
          await manager.rollbackAll();
        }
        break;
      
      case 'status':
      default:
        await manager.getStatus();
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
