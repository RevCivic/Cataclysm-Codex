# Database Migrations Guide

This guide explains how to use the database migration system for the Cataclysm Codex project.

## Overview

The migration system provides a way to manage database schema changes in a controlled, version-controlled manner. All migrations are tracked in the `schema_migrations` table, ensuring that each migration runs exactly once.

## Migration Files

Migration files are stored in `src/migrations/` directory. Each migration file has:
- A numerical prefix (e.g., `001`, `002`) for ordering
- A descriptive name (e.g., `add_created_at_to_all_tables`)
- Both `up()` and `down()` functions for applying and rolling back changes

### Example Migration Structure

```javascript
'use strict';

/**
 * Migration 001: Add created_at column to all tables
 */

async function up(client) {
  console.log('Running migration 001: Add created_at to all tables');
  // Apply changes here
  await client.query(`ALTER TABLE table_name ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  console.log('✓ Migration 001 completed');
}

async function down(client) {
  console.log('Rolling back migration 001');
  // Rollback changes here
  await client.query(`ALTER TABLE table_name DROP COLUMN created_at`);
  console.log('✓ Migration 001 rolled back');
}

module.exports = { up, down };
```

## Running Migrations

### Automatic (on Application Startup)

Migrations run automatically when the application starts. The `initializeDatabase()` function in `src/database-pool.js` will:
1. Initialize the database schema
2. Create the `schema_migrations` table (if not exists)
3. Run any pending migrations

### Manual Migration Management

You can also manage migrations manually using npm scripts:

#### Check Migration Status
```bash
npm run db:migrate:status
```

Output shows which migrations have been executed (✓) and which are pending (○):
```
Migration Status:

  ✓ 001_add_created_at_to_all_tables
```

#### Run Pending Migrations
```bash
npm run db:migrate:up
```

This will execute all migrations that haven't been run yet, in order.

#### Rollback Migrations
```bash
# Rollback a specific migration
npm run db:migrate:down 001_add_created_at_to_all_tables

# Rollback all migrations (in reverse order)
npm run db:migrate:down
```

## Using the Migration CLI

You can also use the migration CLI directly:

```bash
# Check status
node migrate.js status

# Run pending migrations
node migrate.js up

# Rollback all migrations
node migrate.js down

# Rollback specific migration
node migrate.js down 001_add_created_at_to_all_tables
```

## Current Migrations

### Migration 001: Add created_at to all tables

**Purpose**: Ensures all tables have a `created_at` TIMESTAMP column with a default value of `CURRENT_TIMESTAMP`.

**Affected Tables**:
- campaigns
- people
- species
- organizations
- items
- starships
- timeline
- departments
- sessions
- events
- star_systems
- worlds
- locations
- ship_designs
- lore_documents
- lore_sections
- relationships
- person_relationships
- crew_assignments
- party_memberships
- inventories
- entity_aliases
- source_snapshots
- source_records
- field_provenance
- import_runs
- planet_classes
- historical_memberships
- ship_spaces
- reference_entries

**Details**:
- Checks if each table already has a `created_at` column
- Adds the column only if it doesn't exist (idempotent)
- Uses `CURRENT_TIMESTAMP` as the default value for new columns
- Can be safely run multiple times without errors

## Creating New Migrations

To create a new migration:

1. Create a new file in `src/migrations/` with a descriptive name:
   ```
   src/migrations/002_your_migration_name.js
   ```

2. Implement the migration with `up()` and `down()` functions:
   ```javascript
   'use strict';

   async function up(client) {
     console.log('Running migration 002: Your migration name');
     // Your migration code here
     console.log('✓ Migration 002 completed');
   }

   async function down(client) {
     console.log('Rolling back migration 002');
     // Your rollback code here
     console.log('✓ Migration 002 rolled back');
   }

   module.exports = { up, down };
   ```

3. The migration will be automatically discovered and run on next application startup or when you run `npm run db:migrate:up`.

## Best Practices

1. **Make migrations idempotent**: Check if changes already exist before applying them
2. **Always provide a rollback**: Implement the `down()` function for every `up()` function
3. **Test migrations**: Test both `up()` and `down()` before committing
4. **Document changes**: Include comments explaining what the migration does and why
5. **Name migrations descriptively**: Use clear names that describe the schema change
6. **Use transactions carefully**: PostgreSQL transactions in the pool may behave differently for DDL statements

## Troubleshooting

### Migration failed - column already exists

This typically means the migration ran partially or the column was already added manually. The migration is designed to be idempotent, so running it again should be safe:
```bash
npm run db:migrate:up
```

### Schema migration table not found

The migration system will automatically create the `schema_migrations` table on first run. If you're getting errors about the table not existing, ensure your database user has DDL privileges.

### Connection errors

Make sure your database connection environment variables are set:
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=codex
export DB_PASSWORD=codex
export DB_NAME=cataclysm_codex
```

## Related Files

- `src/database-pool.js` - Database connection pool and initialization
- `src/migration-manager.js` - Migration tracking and execution
- `src/migrations/` - Directory containing migration files
- `migrate.js` - CLI script for manual migration management
- `package.json` - npm scripts for migration management
