# Testing with PostgreSQL

This document explains how to run the test suite with PostgreSQL after the migration from lowdb.

## Test Status

The test suite (`src/tests/*.test.js`) requires updates to work with PostgreSQL:

### Current Issues
- **api.test.js**: Uses lowdb methods (`db.set()`, `db.write()`) which don't exist in the new PostgreSQL implementation
- Tests directly manipulate database state, which is incompatible with PostgreSQL's client/pool pattern
- Tests need database setup/teardown procedures for PostgreSQL

### Migration Path
Tests need to be refactored to:
1. Use async/await for database operations
2. Use the new `db.*` functions from `src/database.js`
3. Set up and tear down PostgreSQL test database per test run

## Running Tests (Current Status)

### Manual Testing Approach (Recommended for Now)

Until the test suite is refactored, use manual testing with Docker:

```bash
# Start the application with PostgreSQL
docker compose up -d

# Test endpoints using curl
curl -X GET http://localhost:3000/api/health
curl -X GET http://localhost:3000/api/people
curl -X POST http://localhost:3000/api/people \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Person", "race": "Human", "class": "Soldier", "level": 1}'

# Stop the application
docker compose down
```

### Endpoint Testing Quick Reference

```bash
# People API
curl http://localhost:3000/api/people                    # List people
curl http://localhost:3000/api/people/[id]              # Get one
curl -X POST http://localhost:3000/api/people \
  -H "Content-Type: application/json" \
  -d '{"name": "Name", "race": "Race", "class": "Class", "level": 1}'

# Species API
curl http://localhost:3000/api/species                   # List species
curl -X POST http://localhost:3000/api/species \
  -H "Content-Type: application/json" \
  -d '{"name": "Species Name", "home_world": "World", "size": "Medium"}'

# Weapons API
curl http://localhost:3000/api/weapons                   # List weapons
curl -X POST http://localhost:3000/api/weapons \
  -H "Content-Type: application/json" \
  -d '{"name": "Laser Rifle", "type": "Small Arms", "level": 1, "damage": "1d8 F"}'

# Armors API
curl http://localhost:3000/api/armors                    # List armors
curl -X POST http://localhost:3000/api/armors \
  -H "Content-Type: application/json" \
  -d '{"name": "Combat Suit", "type": "Heavy Armor", "level": 3}'

# Starships API
curl http://localhost:3000/api/starships                 # List starships
curl -X POST http://localhost:3000/api/starships \
  -H "Content-Type: application/json" \
  -d '{"name": "Pale Comet", "model": "Wanderer", "size": "Small"}'

# Timeline API
curl http://localhost:3000/api/timeline                  # List events
curl -X POST http://localhost:3000/api/timeline \
  -H "Content-Type: application/json" \
  -d '{"title": "Event Name", "year": 2800, "era": "Current", "significance": "Minor"}'

# Parties API
curl http://localhost:3000/api/parties                   # List parties
curl -X POST http://localhost:3000/api/parties \
  -H "Content-Type: application/json" \
  -d '{"name": "Party Name", "description": "A group of adventurers"}'

# Factions API
curl http://localhost:3000/api/factions                  # List factions
curl -X POST http://localhost:3000/api/factions \
  -H "Content-Type: application/json" \
  -d '{"name": "Faction Name", "alignment": "Neutral Good"}'
```

## Future: Refactoring Tests for PostgreSQL

When refactoring the test suite for PostgreSQL, follow these patterns:

### Test Database Setup

```javascript
// Use a test-specific database
process.env.DB_NAME = 'cataclysm_codex_test';
process.env.DB_USER = 'codex';
process.env.DB_PASSWORD = 'codex';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';

// Create test database
before(async () => {
  // Create fresh test database
  const adminPool = new pg.Pool({
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'postgres'
  });
  
  await adminPool.query('DROP DATABASE IF EXISTS cataclysm_codex_test');
  await adminPool.query('CREATE DATABASE cataclysm_codex_test');
  await adminPool.end();
  
  // Initialize schema
  const app = require('../server');
  await initializeDatabase();
});

// Clean up after tests
after(async () => {
  const adminPool = new pg.Pool({ /* admin connection */ });
  await adminPool.query('DROP DATABASE cataclysm_codex_test');
  await adminPool.end();
});
```

### Test Patterns with Async Database Calls

```javascript
// Instead of: db.set('people', [...]).write()
// Use:
it('lists people', async () => {
  await db.create('people', {
    name: 'Test Person',
    race: 'Human',
    class: 'Soldier',
    level: 1
  });
  
  const people = await db.getAll('people');
  assert.ok(people.length > 0);
});

// Instead of: db.set('items', [...]).write()
// Use:
it('filters items by type', async () => {
  await db.create('items', {
    name: 'Laser Rifle',
    item_type: 'weapon',
    // ...
  });
  
  const weapons = await db.getAllByType('items', 'weapon');
  assert.ok(weapons.some(w => w.name === 'Laser Rifle'));
});
```

### Admin Data Manipulation in Tests

```javascript
// For tests that need to set up specific data states
it('handles import runs', async () => {
  // Insert test data
  const pool = require('../database-pool').pool;
  await pool.query(
    'INSERT INTO import_runs (id, source_id, status, completed_at) VALUES ($1, $2, $3, $4)',
    ['test-run-1', 'species', 'completed', new Date()]
  );
  
  const response = await request('GET', '/api/admin/sources/runs');
  assert.equal(response.status, 200);
});
```

## Test Requirements

Before running PostgreSQL tests:

1. **PostgreSQL Server**: Running on localhost:5432
2. **Admin User**: `postgres` with password `postgres` (for test database creation)
3. **Application User**: `codex` with password `codex`

### Docker Setup for Testing

```bash
# Run PostgreSQL in Docker for testing
docker run -d \
  --name codex-postgres-test \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cataclysm_codex_test \
  -p 5432:5432 \
  postgres:16-alpine

# Run tests
npm test

# Clean up
docker stop codex-postgres-test
docker rm codex-postgres-test
```

## Key Differences from lowdb

The test suite will need to adapt to these PostgreSQL differences:

| lowdb | PostgreSQL |
|-------|-----------|
| `db.set(key, data).write()` | `await pool.query(...)` or `await db.create(...)` |
| Synchronous operations | Asynchronous/Promise-based |
| In-memory data manipulation | Database queries with network roundtrips |
| Direct object modification | Structured queries with prepared statements |
| No transactions | ACID transactions available |

## Debugging Tests

When tests fail with PostgreSQL:

1. **Check connection**: `psql -U codex -h localhost -d cataclysm_codex_test`
2. **View logs**: `docker logs cataclysm-codex-db`
3. **Check schema**: `\dt` in psql to list tables
4. **Review async errors**: Ensure all database calls use `await`
5. **Connection pool**: Verify pool isn't exhausted; check `pool.idleCount` in tests

## CI/CD Considerations

For continuous integration:

1. Use Docker Compose to spin up test PostgreSQL instance
2. Run database initialization before tests
3. Ensure proper cleanup between test runs
4. Consider using GitHub Actions PostgreSQL service containers:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: cataclysm_codex_test
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432
```

## Tracking Progress

- [ ] Refactor api.test.js to use PostgreSQL
- [ ] Refactor ingestion.test.js to use PostgreSQL
- [ ] Refactor migration.test.js to use PostgreSQL
- [ ] Set up Docker test environment
- [ ] Add CI/CD test configuration
- [ ] Achieve 100% test pass rate with PostgreSQL

## References

- [Node.js pg Documentation](https://node-postgres.com/)
- [PostgreSQL Testing Best Practices](https://www.postgresql.org/docs/)
- [Jest PostgreSQL Setup](https://jestjs.io/)
