'use strict';

/**
 * Migration 001: Add created_at column to all tables that are missing it
 * This migration ensures all tables have a created_at timestamp column
 * with a default value of CURRENT_TIMESTAMP
 */

const TABLES = [
  'campaigns',
  'people',
  'species',
  'organizations',
  'items',
  'starships',
  'timeline',
  'departments',
  'sessions',
  'events',
  'star_systems',
  'worlds',
  'locations',
  'ship_designs',
  'lore_documents',
  'lore_sections',
  'relationships',
  'person_relationships',
  'crew_assignments',
  'party_memberships',
  'inventories',
  'entity_aliases',
  'source_snapshots',
  'source_records',
  'field_provenance',
  'import_runs',
  'planet_classes',
  'historical_memberships',
  'ship_spaces',
  'reference_entries'
];

/**
 * Check if a column exists in a table
 */
async function columnExists(client, tableName, columnName) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = $2
    )
  `, [tableName, columnName]);
  return result.rows[0].exists;
}

/**
 * Add created_at column to a table if it doesn't exist
 */
async function addCreatedAtToTable(client, tableName) {
  const hasColumn = await columnExists(client, tableName, 'created_at');
  
  if (!hasColumn) {
    console.log(`  Adding created_at to ${tableName}...`);
    await client.query(`
      ALTER TABLE ${tableName}
      ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log(`  ✓ created_at added to ${tableName}`);
  } else {
    console.log(`  ✓ ${tableName} already has created_at`);
  }
}

/**
 * Run the migration
 */
async function up(client) {
  console.log('Running migration 001: Add created_at to all tables');
  console.log('');
  
  for (const tableName of TABLES) {
    try {
      await addCreatedAtToTable(client, tableName);
    } catch (error) {
      console.error(`Error processing ${tableName}:`, error.message);
      throw error;
    }
  }
  
  console.log('');
  console.log('✓ Migration 001 completed successfully');
}

/**
 * Rollback the migration
 */
async function down(client) {
  console.log('Rolling back migration 001: Remove created_at from all tables');
  console.log('');
  
  for (const tableName of TABLES) {
    try {
      const hasColumn = await columnExists(client, tableName, 'created_at');
      
      if (hasColumn) {
        console.log(`  Removing created_at from ${tableName}...`);
        await client.query(`
          ALTER TABLE ${tableName}
          DROP COLUMN created_at
        `);
        console.log(`  ✓ created_at removed from ${tableName}`);
      } else {
        console.log(`  ✓ ${tableName} doesn't have created_at`);
      }
    } catch (error) {
      console.error(`Error rolling back ${tableName}:`, error.message);
      throw error;
    }
  }
  
  console.log('');
  console.log('✓ Migration 001 rollback completed');
}

module.exports = { up, down };
