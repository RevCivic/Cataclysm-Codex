# Cataclysm Codex

A campaign codex web application for a **Starfinder (1st Edition)** campaign, containerized with Docker.

![People section](https://github.com/user-attachments/assets/6767d9ce-b84f-4df8-8181-42a201add263)

## Features

The codex covers all eight categories of campaign reference material:

| Section | Description |
|---------|-------------|
| 👤 **People** | NPCs and key characters — race, class, level, affiliation |
| 🌌 **Species** | Alien races — home world, traits, size, type |
| ⚔ **Parties** | Adventuring groups — members, home base |
| 🏴 **Factions** | Organizations — alignment, goals, headquarters, leader |
| 🔫 **Weapons** | Armaments — damage, range, capacity, bulk, price |
| 🚀 **Starships** | Vessels — model, size, speed, shields, hull points, crew |
| 🛡 **Armors** | Protection — EAC/KAC bonuses, max DEX, upgrade slots |
| 📅 **Timeline** | Historical events — year, era, significance (sorted chronologically) |

All sections support full **Create / Read / Update / Delete** (CRUD) operations and live search.

![Timeline section](https://github.com/user-attachments/assets/21dc7f0a-5508-4548-a586-61e9ab8f0b82)

## Quick Start with Docker

The recommended way to run the codex is with Docker Compose:

```bash
# Build and start the container
docker compose up -d

# Open the codex in your browser
open http://localhost:3000

# Stop the container
docker compose down
```

Data is persisted in a named Docker volume (`codex-data`) so your entries survive container restarts.

To reset to the bundled seed data, remove the volume:

```bash
docker compose down -v
docker compose up -d
```

## Local Development

Requires **Node.js ≥ 18**.

```bash
# Install dependencies
npm install

# Seed the database with sample Starfinder campaign data
npm run seed

# Start the development server
npm start
```

The app will be available at <http://localhost:3000>.

### Running Tests

```bash
npm test
```

## Project Structure

```
.
├── Dockerfile
├── docker-compose.yml
├── package.json
├── public/               # Frontend (HTML / CSS / vanilla JS)
│   ├── index.html
│   ├── style.css
│   └── app.js
└── src/
    ├── server.js         # Express server entry point
    ├── database.js       # lowdb JSON database helpers
    ├── seed.js           # Sample campaign data
    ├── routes/           # REST API routes (one file per section)
    │   ├── people.js
    │   ├── species.js
    │   ├── parties.js
    │   ├── factions.js
    │   ├── weapons.js
    │   ├── starships.js
    │   ├── armors.js
    │   └── timeline.js
    └── tests/
        └── api.test.js   # Node built-in test runner
```

## API Reference

Every section exposes a standard REST API:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/<section>` | List all entries |
| `GET` | `/api/<section>/:id` | Get a single entry |
| `POST` | `/api/<section>` | Create a new entry |
| `PUT` | `/api/<section>/:id` | Update an existing entry |
| `DELETE` | `/api/<section>/:id` | Delete an entry |
| `GET` | `/api/health` | Health check |

Where `<section>` is one of: `people`, `species`, `parties`, `factions`, `weapons`, `starships`, `armors`, `timeline`.
