# PostgreSQL Migration Guide

This guide covers the migration from lowdb (JSON file-based) to PostgreSQL for the Cataclysm Codex application.

## Overview

The application has been migrated from **lowdb** (in-memory JSON database) to **PostgreSQL** to improve:
- **Data stability** - ACID compliance ensures data integrity
- **Concurrency** - Multiple simultaneous requests are now properly supported
- **Reliability** - Built-in backup and recovery mechanisms
- **Scalability** - Better performance with larger datasets

## Quick Start with Docker Compose

The easiest way to run the application with PostgreSQL is using Docker Compose:

```bash
# Build and start both PostgreSQL and the application
docker compose up -d

# Open the codex in your browser
open http://localhost:3000

# Stop the application
docker compose down

# To reset the database (WARNING: deletes all data)
docker compose down -v
docker compose up -d
```

## Local Development Setup

If you want to run PostgreSQL locally for development:

### 1. Install PostgreSQL

#### macOS (with Homebrew):
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows:
Download and install from https://www.postgresql.org/download/windows/

### 2. Create the Database

```bash
# Create database and user
createuser codex
createdb -O codex cataclysm_codex

# Or connect to PostgreSQL and run:
# CREATE USER codex PASSWORD 'codex';
# CREATE DATABASE cataclysm_codex OWNER codex;
```

### 3. Set Environment Variables

Create a `.env` file or set these in your shell:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=codex
DB_PASSWORD=codex
DB_NAME=cataclysm_codex
NODE_ENV=development
PORT=3000
```

### 4. Install Dependencies and Run

```bash
npm install
npm start
```

The application will automatically initialize the database schema on startup.

## Database Schema

The new schema consists of the following main tables:

### Core Entities
- **campaigns** - Campaign records (ruleset, slug, etc.)
- **people** - NPCs, characters, and crew members
- **species** - Alien races and species information
- **organizations** - Parties, factions, and groups
- **items** - Weapons, armor, upgrades, and other equipment
- **starships** - Vessels and spacecraft
- **timeline** - Historical events

### Relationships & Associations
- **person_relationships** - Relationships between people
- **party_memberships** - People's membership in organizations
- **crew_assignments** - Crew assignments to ships
- **historical_memberships** - Historical organizational memberships

### Reference Data
- **departments** - Organizational departments
- **sessions** - Campaign sessions
- **events** - World history and campaign events
- **star_systems** - Star systems
- **worlds** - Planets and worlds
- **locations** - Places and locations
- **ship_designs** - Reusable ship designs/classes
- **lore_documents** - Lore and reference documents
- **lore_sections** - Hierarchical sections in lore documents

### Import & Provenance Tracking
- **source_snapshots** - Immutable snapshots of imported data
- **source_records** - Mapping of entities to source imports
- **field_provenance** - Field-level change tracking
- **import_runs** - Audit trail of import operations
- **entity_aliases** - Alternative names for entities

## Database Initialization

The database schema is automatically created when the application starts. This includes:

1. All table definitions with proper data types
2. Foreign key relationships and constraints
3. Indexes for optimal query performance
4. Default campaign record for the "Cataclysm" campaign

If you need to manually reinitialize the database:

```bash
npm run seed
```

## API Changes

The REST API remains largely the same, but all endpoints now use async/await internally:

```javascript
// Example: GET /api/people
GET http://localhost:3000/api/people

// Example: POST /api/people
POST http://localhost:3000/api/people
Content-Type: application/json

{
  "name": "Riven Ashcroft",
  "race": "Human",
  "class": "Soldier",
  "level": 5,
  "affiliation": "The Iron Vanguard",
  "description": "A grizzled veteran...",
  "notes": "Carries a photon reaper..."
}
```

All existing API endpoints work as before.

## Seeding with Sample Data

The application comes with sample Starfinder campaign data. To seed this data:

```bash
npm run seed
```

This creates:
- 5 sample people (NPCs)
- 5 sample species
- 6 sample organizations (parties and factions)
- 4 sample weapons
- 3 sample starships
- 4 sample armor types
- 8 sample timeline events

## Backup and Recovery

### Automated Backups
PostgreSQL maintains write-ahead logs that enable point-in-time recovery. Docker volumes ensure persistence across container restarts.

### Manual Backup
```bash
# Backup using pg_dump
pg_dump -U codex -h localhost cataclysm_codex > backup.sql

# Or with Docker:
docker exec cataclysm-codex-db pg_dump -U codex cataclysm_codex > backup.sql
```

### Restore from Backup
```bash
# Restore using psql
psql -U codex -h localhost cataclysm_codex < backup.sql

# Or with Docker:
docker exec -i cataclysm-codex-db psql -U codex cataclysm_codex < backup.sql
```

## Performance Tuning

### Indexes
The schema includes strategic indexes on:
- Foreign key columns (campaign_id, organization_id, ship_id, etc.)
- Entity type columns (item_type, organization_type)
- Frequently searched columns (name, category)

### Query Optimization
- All list endpoints use `ORDER BY created_at DESC` for consistent pagination
- Foreign key constraints ensure referential integrity
- JSONB columns can be added for flexible nested data if needed

## Troubleshooting

### Connection Issues
If you see connection errors:

1. Verify PostgreSQL is running:
   ```bash
   docker ps  # for Docker
   pg_isready -h localhost  # for local PostgreSQL
   ```

2. Check environment variables:
   ```bash
   env | grep DB_
   ```

3. Test the connection:
   ```bash
   psql -U codex -h localhost -d cataclysm_codex -c "SELECT 1;"
   ```

### Database Already Exists
If you get an error that the database already exists:

```bash
# With Docker, just reset:
docker compose down -v
docker compose up -d

# Or drop and recreate locally:
dropdb -U codex cataclysm_codex
createdb -U codex cataclysm_codex
```

### Permission Denied
If you get permission errors with Docker:

```bash
# Check database user permissions
docker exec cataclysm-codex-db psql -U codex -d cataclysm_codex -c "\du"

# Grant permissions if needed
docker exec cataclysm-codex-db psql -U postgres -d cataclysm_codex \
  -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO codex;"
```

## Migration from lowdb

If you had data in the previous lowdb-based system, you can manually export and import it:

1. Export from old system (if available):
   ```bash
   node -e "const db = require('./src/database'); console.log(JSON.stringify(db.getState(), null, 2));" > old_data.json
   ```

2. Import into new system:
   ```bash
   # Update src/seed.js to include your data
   # Then run: npm run seed
   ```

Or manually insert data using the API:

```bash
# Example: Add a person
curl -X POST http://localhost:3000/api/people \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Character",
    "race": "Human",
    "class": "Soldier",
    "level": 5
  }'
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | localhost | PostgreSQL server hostname |
| `DB_PORT` | 5432 | PostgreSQL server port |
| `DB_USER` | codex | PostgreSQL user |
| `DB_PASSWORD` | codex | PostgreSQL password |
| `DB_NAME` | cataclysm_codex | Database name |
| `NODE_ENV` | development | Node.js environment |
| `PORT` | 3000 | Application port |
| `ADMIN_TOKEN` | (empty) | Token for admin API endpoints |
| `SOURCE_SNAPSHOT_PATH` | /app/data/source-snapshots | Path for source snapshots |
| `IMAGES_PATH` | /app/images | Path for stored images |

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js pg Module](https://node-postgres.com/)

## Support

For issues or questions about the PostgreSQL migration, please refer to the application's issue tracker or documentation.
