'use strict';

const path = require('path');
const fs = require('fs');

/**
 * Database migration manager
 * Tracks which migrations have been run and executes pending migrations
 */

class MigrationManager {
  constructor(client) {
    this.client = client;
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  /**
   * Initialize the migrations table if it doesn't exist
   */
  async initMigrationsTable() {
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Get list of executed migrations
   */
  async getExecutedMigrations() {
    const result = await this.client.query(`
      SELECT name FROM schema_migrations ORDER BY executed_at
    `);
    return result.rows.map(row => row.name);
  }

  /**
   * Get list of migration files in the migrations directory
   */
  getMigrationFiles() {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }
    
    const files = fs.readdirSync(this.migrationsDir);
    return files
      .filter(file => file.endsWith('.js'))
      .sort()
      .map(file => file.replace('.js', ''));
  }

  /**
   * Record that a migration has been executed
   */
  async recordMigration(name) {
    await this.client.query(`
      INSERT INTO schema_migrations (name) VALUES ($1)
    `, [name]);
  }

  /**
   * Remove migration record
   */
  async removeMigrationRecord(name) {
    await this.client.query(`
      DELETE FROM schema_migrations WHERE name = $1
    `, [name]);
  }

  /**
   * Run all pending migrations
   */
  async runPendingMigrations() {
    console.log('Checking for pending migrations...');
    
    await this.initMigrationsTable();
    
    const executed = await this.getExecutedMigrations();
    const available = this.getMigrationFiles();
    
    const pending = available.filter(name => !executed.includes(name));
    
    if (pending.length === 0) {
      console.log('✓ No pending migrations');
      return;
    }
    
    console.log(`Found ${pending.length} pending migration(s)`);
    console.log('');
    
    for (const migrationName of pending) {
      console.log(`Running migration: ${migrationName}`);
      
      try {
        const migrationPath = path.join(this.migrationsDir, migrationName + '.js');
        const migration = require(migrationPath);
        
        await migration.up(this.client);
        await this.recordMigration(migrationName);
        
        console.log(`✓ Migration ${migrationName} completed and recorded`);
        console.log('');
      } catch (error) {
        console.error(`✗ Migration ${migrationName} failed:`, error.message);
        throw error;
      }
    }
    
    console.log('✓ All pending migrations completed successfully');
  }

  /**
   * Rollback a specific migration
   */
  async rollback(migrationName) {
    console.log(`Rolling back migration: ${migrationName}`);
    
    try {
      const migrationPath = path.join(this.migrationsDir, migrationName + '.js');
      const migration = require(migrationPath);
      
      await migration.down(this.client);
      await this.removeMigrationRecord(migrationName);
      
      console.log(`✓ Migration ${migrationName} rolled back`);
    } catch (error) {
      console.error(`✗ Rollback of ${migrationName} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Rollback all executed migrations in reverse order
   */
  async rollbackAll() {
    const executed = await this.getExecutedMigrations();
    
    if (executed.length === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    console.log(`Rolling back ${executed.length} migration(s)`);
    
    // Rollback in reverse order
    for (let i = executed.length - 1; i >= 0; i--) {
      await this.rollback(executed[i]);
    }
    
    console.log('✓ All migrations rolled back');
  }

  /**
   * Get migration status
   */
  async getStatus() {
    await this.initMigrationsTable();
    
    const executed = await this.getExecutedMigrations();
    const available = this.getMigrationFiles();
    
    console.log('Migration Status:');
    console.log('');
    
    for (const migrationName of available) {
      const status = executed.includes(migrationName) ? '✓' : '○';
      console.log(`  ${status} ${migrationName}`);
    }
  }
}

module.exports = MigrationManager;
