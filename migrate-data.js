#!/usr/bin/env node
'use strict';

/**
 * Data migration script: Normalizes legacy collections to unified schema
 * 
 * Usage: node src/migrate-data.js
 * 
 * This script performs the following transformations:
 * - Phase 2: Merges parties, factions, and organizations into unified organizations collection
 * - Phase 3: Merges weapons, armors, upgrades, and items into unified items collection
 * - Phase 4: Merges relationship tables into unified relationships collection
 * - Phase 6: Updates sourceRecords and fieldProvenance to reference new entity_type values
 * 
 * The script creates a backup of the original database before migration.
 */

const path = require('path');
const fs = require('fs');
const { performMigration } = require('./src/ingestion/migration');
const { db } = require('./src/database');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'db.json');
const BACKUP_PATH = `${DB_PATH}.backup.${Date.now()}.json`;

console.log('='.repeat(70));
console.log('Data Normalization Migration');
console.log('='.repeat(70));
console.log();

// Get current state
const currentState = db.getState();

console.log('Current database state:');
console.log(`  People: ${currentState.people?.length || 0}`);
console.log(`  Species: ${currentState.species?.length || 0}`);
console.log(`  Parties: ${currentState.parties?.length || 0}`);
console.log(`  Factions: ${currentState.factions?.length || 0}`);
console.log(`  Organizations: ${currentState.organizations?.length || 0}`);
console.log(`  Weapons: ${currentState.weapons?.length || 0}`);
console.log(`  Armors: ${currentState.armors?.length || 0}`);
console.log(`  Upgrades: ${currentState.upgrades?.length || 0}`);
console.log(`  Items: ${currentState.items?.length || 0}`);
console.log(`  PersonRelationships: ${currentState.personRelationships?.length || 0}`);
console.log(`  CrewAssignments: ${currentState.crewAssignments?.length || 0}`);
console.log(`  PartyMemberships: ${currentState.partyMemberships?.length || 0}`);
console.log(`  HistoricalMemberships: ${currentState.historicalMemberships?.length || 0}`);
console.log();

// Create backup
console.log(`Creating backup at: ${BACKUP_PATH}`);
fs.writeFileSync(BACKUP_PATH, JSON.stringify(currentState, null, 2));
console.log('✓ Backup created successfully');
console.log();

// Perform migration
try {
  console.log('Starting migration...');
  const migratedState = performMigration(currentState);
  
  console.log('Migration complete. New database state:');
  console.log(`  Organizations: ${migratedState.organizations?.length || 0}`);
  console.log(`  Items: ${migratedState.items?.length || 0}`);
  console.log(`  Relationships: ${migratedState.relationships?.length || 0}`);
  console.log(`  SourceRecords: ${migratedState.sourceRecords?.length || 0}`);
  console.log(`  FieldProvenance: ${migratedState.fieldProvenance?.length || 0}`);
  console.log();

  // Write migrated state back to database
  console.log('Writing migrated state to database...');
  db.setState(migratedState).write();
  console.log('✓ Migration applied successfully');
  console.log();

  console.log('='.repeat(70));
  console.log('Migration successful!');
  console.log('='.repeat(70));
  console.log();
  console.log('Next steps:');
  console.log('1. Test your application with the migrated data');
  console.log('2. Update frontend code to use new unified collections');
  console.log('3. Update API parsers to generate unified records');
  console.log();
  console.log(`Backup saved at: ${BACKUP_PATH}`);
  console.log('To rollback, run: cp ' + BACKUP_PATH + ' ' + DB_PATH);
  console.log();
} catch (error) {
  console.error('✗ Migration failed:');
  console.error(error);
  console.log();
  console.log('To rollback, run:');
  console.log(`  cp ${BACKUP_PATH} ${DB_PATH}`);
  process.exit(1);
}
