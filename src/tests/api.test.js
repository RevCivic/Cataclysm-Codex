'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('path');
const fs = require('fs');

// Use a temp DB for testing
const TEST_DB = path.join(require('os').tmpdir(), `codex-test-${Date.now()}.json`);
process.env.DB_PATH = TEST_DB;
process.env.PORT = '0'; // Random port

const app = require('../server');

let server;
let baseUrl;

function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: server.address().port,
      path: urlPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

before(() => {
  return new Promise(resolve => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
});

after(() => {
  server.close();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

// ─── Health ───────────────────────────────────────────────────────────────
describe('Health endpoint', () => {
  it('GET /api/health returns ok', async () => {
    const { status, body } = await request('GET', '/api/health');
    assert.equal(status, 200);
    assert.equal(body.status, 'ok');
  });
});

// ─── People ───────────────────────────────────────────────────────────────
describe('People CRUD', () => {
  let id;

  it('GET /api/people returns empty array initially', async () => {
    const { status, body } = await request('GET', '/api/people');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
  });

  it('POST /api/people creates a person', async () => {
    const { status, body } = await request('POST', '/api/people', {
      name: 'Test Person', race: 'Human', class: 'Soldier', level: '1'
    });
    assert.equal(status, 201);
    assert.equal(body.name, 'Test Person');
    assert.ok(body.id);
    id = body.id;
  });

  it('POST /api/people requires name', async () => {
    const { status } = await request('POST', '/api/people', { race: 'Vesk' });
    assert.equal(status, 400);
  });

  it('GET /api/people/:id returns the person', async () => {
    const { status, body } = await request('GET', `/api/people/${id}`);
    assert.equal(status, 200);
    assert.equal(body.id, id);
  });

  it('PUT /api/people/:id updates the person', async () => {
    const { status, body } = await request('PUT', `/api/people/${id}`, {
      name: 'Updated Person', race: 'Kasatha'
    });
    assert.equal(status, 200);
    assert.equal(body.name, 'Updated Person');
  });

  it('DELETE /api/people/:id removes the person', async () => {
    const { status } = await request('DELETE', `/api/people/${id}`);
    assert.equal(status, 200);
  });

  it('GET /api/people/:id returns 404 after delete', async () => {
    const { status } = await request('GET', `/api/people/${id}`);
    assert.equal(status, 404);
  });
});

// ─── Species ──────────────────────────────────────────────────────────────
describe('Species CRUD', () => {
  let id;

  it('POST /api/species creates a species', async () => {
    const { status, body } = await request('POST', '/api/species', {
      name: 'Shirren', home_world: 'Unknown', size: 'Medium'
    });
    assert.equal(status, 201);
    assert.equal(body.name, 'Shirren');
    id = body.id;
  });

  it('GET /api/species returns list with created species', async () => {
    const { status, body } = await request('GET', '/api/species');
    assert.equal(status, 200);
    assert.ok(body.some(s => s.id === id));
  });

  it('DELETE /api/species/:id removes the species', async () => {
    const { status } = await request('DELETE', `/api/species/${id}`);
    assert.equal(status, 200);
  });
});

// ─── Weapons ─────────────────────────────────────────────────────────────
describe('Weapons CRUD', () => {
  let id;

  it('POST /api/weapons creates a weapon', async () => {
    const { status, body } = await request('POST', '/api/weapons', {
      name: 'Laser Pistol', type: 'Small Arms', level: '1', damage: '1d4 F'
    });
    assert.equal(status, 201);
    assert.equal(body.name, 'Laser Pistol');
    id = body.id;
  });

  it('PUT /api/weapons/:id updates the weapon', async () => {
    const { status, body } = await request('PUT', `/api/weapons/${id}`, {
      name: 'Laser Pistol Mk2', damage: '1d6 F'
    });
    assert.equal(status, 200);
    assert.equal(body.name, 'Laser Pistol Mk2');
  });
});

// ─── Timeline ─────────────────────────────────────────────────────────────
describe('Timeline CRUD', () => {
  let id;

  it('POST /api/timeline creates an event', async () => {
    const { status, body } = await request('POST', '/api/timeline', {
      title: 'The Gap', year: '0', era: 'The Gap', significance: 'Critical'
    });
    assert.equal(status, 201);
    assert.equal(body.title, 'The Gap');
    id = body.id;
  });

  it('GET /api/timeline returns sorted events', async () => {
    await request('POST', '/api/timeline', { title: 'Before The Gap', year: '-500', era: 'Pre-Gap' });
    const { status, body } = await request('GET', '/api/timeline');
    assert.equal(status, 200);
    // Should be sorted by year ascending
    const years = body.map(e => parseInt(e.year) || 0);
    for (let i = 1; i < years.length; i++) {
      assert.ok(years[i] >= years[i - 1], 'Timeline should be sorted by year');
    }
  });

  it('POST /api/timeline requires title', async () => {
    const { status } = await request('POST', '/api/timeline', { year: '100' });
    assert.equal(status, 400);
  });
});

// ─── Starships ────────────────────────────────────────────────────────────
describe('Starships CRUD', () => {
  it('POST /api/starships creates a starship', async () => {
    const { status, body } = await request('POST', '/api/starships', {
      name: 'Pale Comet', model: 'Wanderer', size: 'Small'
    });
    assert.equal(status, 201);
    assert.equal(body.name, 'Pale Comet');
  });
});

// ─── Armors ──────────────────────────────────────────────────────────────
describe('Armors CRUD', () => {
  it('POST /api/armors creates armor', async () => {
    const { status, body } = await request('POST', '/api/armors', {
      name: 'Hardsuit', type: 'Heavy Armor', level: '5'
    });
    assert.equal(status, 201);
    assert.equal(body.name, 'Hardsuit');
  });
});

// ─── Parties ─────────────────────────────────────────────────────────────
describe('Parties CRUD', () => {
  it('POST /api/parties creates a party', async () => {
    const { status, body } = await request('POST', '/api/parties', {
      name: 'The Drift Seekers', description: 'Explorer crew'
    });
    assert.equal(status, 201);
    assert.equal(body.name, 'The Drift Seekers');
  });
});

// ─── Factions ─────────────────────────────────────────────────────────────
describe('Factions CRUD', () => {
  it('POST /api/factions creates a faction', async () => {
    const { status, body } = await request('POST', '/api/factions', {
      name: 'Starfinder Society', alignment: 'Neutral Good'
    });
    assert.equal(status, 201);
    assert.equal(body.name, 'Starfinder Society');
  });
});
