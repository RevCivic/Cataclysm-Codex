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
Compose tags the locally built image as `cataclysm-codex:latest`, including when the stack
is built by Portainer. Set `CODEX_IMAGE` before deployment to publish or use a registry-qualified
name instead (for example, `CODEX_IMAGE=registry.example/cataclysm-codex:1.2.0`).

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

## Data-source architecture

The proposed domain model, Google Sheets/Docs ingestion pipeline, source inventory, and
phased migration plan are documented in
[docs/source-data-and-domain-plan.md](docs/source-data-and-domain-plan.md).

The ingestion pipeline provides a validated source registry, immutable checksummed snapshots,
parser-specific extraction, and a shared normalization/apply stage. It trims source values,
maps species fields to the same snake-case contract used by the API, validates source keys,
and uses collection-specific natural identities so similarly named records are not merged
across catalog kinds. Source exports are written beneath `data/source-snapshots` by default
and are intentionally ignored by Git.

### Image Support

The ingestion pipeline now supports extracting and storing images referenced in source spreadsheets
for both **Species** and **People** (crew) records:

- **Species images**: Extracted from spreadsheet columns with names like "Image", "Portrait", or "Picture"
- **Crew images**: Extracted from Main Crew and Other Crew spreadsheet columns
- **Image storage**: Images are stored in a dedicated Docker volume (`codex-images`) and served at `/api/images/<filename>`
- **Image references**: Image URLs from spreadsheets are captured and stored with records as `image_url` and `image_ref` fields
- **Immutable storage**: Images are deduplicated by SHA256 hash of their URL, enabling efficient storage and caching

### Crew Workbook (Nimbus Crew) Support

The new **crew-v1** parser provides comprehensive import of crew and organizational data:

- **Main Crew tab**: Active crew members with class, level, role, department, and assignments
- **Other Crew tab**: NPCs, supporting characters, and specialists
- **Departments tab**: Ship departments and organizational units with heads and descriptions
- **Stats tab**: Crew statistics and reference data
- **Extended data**: Optional tabs for Assets, Family, Kids, Equipment, Quarters, and special abilities/Supers

The crew parser automatically:
- Extracts images from crew portrait columns
- Creates department records with organizational structure
- Preserves all data fields for flexible schema extension
- Maintains source tracking and field-level provenance

### CLI and Admin UI

```bash
# Review configured sources without downloading campaign data
npm run sources:list

# Fetch one or more explicit sources (never fetches all sources implicitly)
npm run sources:fetch -- species equipment crew

# Validate and summarize any supported downloaded source without changing Codex data
npm run sources:inspect -- crew data/source-snapshots/crew/<sha256>/source.xlsx
```

All parsers (species, crew, equipment, ship-classes, campaign, lore documents, historical timeline) are now supported by the preview, preview-detail, and apply workflows in the admin UI at `/admin.html`.

Set `SOURCE_SNAPSHOT_PATH` to put immutable exports on a mounted data volume. Fetching and
inspection from the CLI do not import records into the database.

### Data Admin UI

Open <http://localhost:3000/admin.html> to operate the source workflow in the browser.
The page lists every configured source and its latest immutable snapshot. Fetch is available
for every source. All parsers support preview before applying:
- Species, equipment, ship classes, campaign workbook, Accord constitution, and historical timeline sources can preview creates/updates before applying
- **Crew workbook** now fully supported with preview, preview-detail, and apply workflows
- Applied records include source mappings, aliases where supplied, import runs, and field-level provenance
- Reapplying unchanged normalized data records an auditable no-change run without adding redundant field-provenance rows

| Parser | Target collections |
| --- | --- |
| Species | `species`, `entityAliases` (+ image_url, image_ref if available) |
| Crew | `people`, `departments` (+ image_url, image_ref if available) |
| Equipment | `items` (weapon and armor subtypes), `upgrades` |
| Ship classes | `shipDesigns` |
| Accord constitution | `loreDocuments`, hierarchical `loreSections` |
| Historical timeline | `events`, preserving year ranges and unparsed-date warnings |
| Campaign workbook | `sessions`, session `events`, `people`, `organizations`, `planetClasses`, `starSystems`, `worlds`, medical `items`, historical memberships, ship spaces, and reference entries |

Imported data is available in the main Codex through read-only **Item Catalog**,
**Upgrades**, **Ship Designs**, **World History**, and **Lore Library** sections. Keeping
these source-owned views read-only avoids bypassing provenance and conflict handling; edits
continue to happen in the source documents until an override workflow is implemented. An
imported record's detail view includes its latest source locator, parser version, mapped
fields, and retained provenance-history count.

Campaign-world imports are surfaced through **Episodes**, **Organizations**, and **Star
Atlas**. Star Atlas system details resolve worlds through stable source-key relationships and
display them in orbital order. Imported people also appear in the existing People section,
with source-owned records protected from local edit/delete controls.

Set `ADMIN_TOKEN` in production and enter it in the page's token field. Admin API routes
fail closed in production when no token is configured. The token is sent in the
`X-Admin-Token` header and kept only in browser session storage. Source snapshots and the
database share the persistent `/app/data` Docker volume, and container restarts no longer
re-run the destructive seed operation.

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

Imported reference material has read-only endpoints:

| Path | Description |
| --- | --- |
| `GET /api/reference/items` | Imported weapon and armor catalog; accepts `?kind=weapon` or `?kind=armor` |
| `GET /api/reference/upgrades` | Imported equipment upgrades |
| `GET /api/reference/ship-designs` | Reusable ship designs/classes |
| `GET /api/reference/events` | World-history events sorted chronologically |
| `GET /api/lore` | Lore document summaries |
| `GET /api/lore/:id` | A lore document with ordered sections |
| `GET /api/provenance/:entityType/:id` | Sanitized source evidence for an imported record |

The Data Admin page also shows the 25 most recent import runs with source, status, record
counts, and completion time. This audit feed uses the same production admin-token policy as
fetch, preview, and apply operations.
