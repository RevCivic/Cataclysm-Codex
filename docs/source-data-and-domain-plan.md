# Source data and domain plan

## Purpose and recommendation

The supplied workbooks are not merely replacement seed files. Together they describe a
campaign setting, game rules, a ship and its crew, and an adventure log. The Codex should
therefore evolve from eight independent JSON arrays into a **campaign-scoped knowledge
base backed by PostgreSQL**, with an auditable import pipeline. Starfinder 1e remains the
rules baseline, while homebrew values are stored as first-class overrides rather than
being forced into Paizo-shaped columns.

This document records the source review performed on 2026-08-29. Counts below are
non-empty worksheet rows and include headings. They are inventory figures, not promised
import totals: several sheets contain multiple side-by-side tables, images, formula-driven
cells, and layout rows.

## What is in the sources

| Source | Observed content | Modeling consequence |
| --- | --- | --- |
| Crew workbook (`1XR…t0twE`) | Main Crew (42 rows), Other Crew (812), Departments (3,074), Stats (846), Assets (65), Family (341), Kids (274), Equipment (30), Quarters (263), Supers (211), and a generated List (891) | A person is the central entity. Posting, ship assignment, family relationship, quarters, abilities, pets, and inventory are relations—not comma-separated person fields. `Departments`, `Stats`, and `List` appear partly derived and must not all create people. |
| Species workbook (`14y…5P0k`) | Narrative Species Index (563), Species Stats (144), four explicit aliases, and three already-normalized `DB_*` tabs containing about 139–141 data rows | Use the curated `DB_Species_Table` as the initial import projection, retain the two raw representations for lineage, and treat alias rows as identity-resolution evidence. Species combines prose, physiology requirements, setting statistics, and rules traits. |
| Galactic Accord constitution (`1KFC…gWI`) | 35 non-empty paragraphs: preamble, citizen rights/obligations, member-world rights/obligations, and governmental provisions | Store as a hierarchical lore document with immutable source text and addressable sections; link it to the Accord faction. Do not flatten legal prose into the faction description. |
| Historical timeline (`1j7F…Qg_B`) | 143 non-empty paragraphs, beginning in 2020 and containing single years, ranges, wars, discoveries, first contacts, organizations, people, and places | Events need start/end precision, raw date text, description, and links to entities. Parsing must accept ranges and uncertain dates without inventing exact timestamps. |
| Ship classes workbook (`1oCi…cS-Q`) | Accord classes (23), enemy classes (11), species classes (4), plus a note tab | Separate reusable ship designs/classes from named vessels. Dimensions and decks belong to designs; faction, status, weapons, armor, and named examples need structured/linkable fields where confidence permits. |
| Campaign workbook (`1_wG…9Jic`) | Timeline/episodes (178), history membership lists (14), star chart (28), planet taxonomy (24), economy (8), medical reference (56), decks (31), encountered people (34), and setting notes/acronyms | Add sessions, session events, systems/worlds, organizations, products, reference entries, and ship spaces. The star chart encodes planets positionally and requires a custom transformer. History lists are memberships in eras/conflicts rather than narrative events. |
| Equipment workbook (`1md…k2Gra`) | Weapons (38), armor (22), and upgrades (19) using homebrew Starfinder-like statistics | Model a common item catalog plus subtype details and effects. Preserve dice expressions and special rules as text initially. Approval and rarity are campaign metadata, not intrinsic Starfinder fields. |

### Important observations

1. **The setting is broader than current navigation.** The current collections cover
   people, species, parties, factions, weapons, starships, armors, and timeline. The
   sources additionally require sessions, star systems/worlds, ship designs and spaces,
   relationships, assignments, abilities, organizations/companies, items/upgrades,
   inventory, pets/vehicles, and hierarchical lore documents.
2. **Names are not safe keys.** Spelling/plural aliases already exist for Kasatha(s),
   Murshrite(s), Shir/Shri'galin, and Sleneeth/Slenneeth. Person names also include numeric
   designations, quotes, apostrophes, ranks, and status appended to age. Every entity needs
   an internal UUID and a separate alias table.
3. **The sheets mix record data and presentation.** Image columns shift visible values;
   headings recur inside tables; several tabs place unrelated tables beside one another;
   `X`, `?`, `None`, blanks, and numbers have context-dependent meanings. Importing a
   worksheet as one rectangular table would silently corrupt data.
4. **Canon and homebrew cannot be a Boolean afterthought.** A species or item can use a
   Starfinder concept but override selected statistics. Store ruleset, source/canon
   classification, approval state, and field-level/raw source evidence.
5. **Campaign chronology has two distinct layers.** The historical document is world
   history; the Timeline sheet is an episode/session log with an episode number, title,
   important event, in-world date, and sometimes a location. Both may appear on one UI
   timeline but should not share one lossy record shape.

## Bounded contexts

Build one application and database initially, but keep these module boundaries:

- **Catalog:** species, items, item variants, upgrades, abilities/traits, ship designs,
  planet classes, and reusable reference entries.
- **World:** people, organizations/factions, parties, systems, worlds, locations, named
  ships, companies, pets/vehicles, and relationships between them.
- **Campaign:** campaigns, sessions/episodes, events, encounters, party membership,
  character/crew assignments, inventories, quarters, and GM notes.
- **Lore:** documents, ordered sections, tags, and entity citations/mentions.
- **Ingestion:** sources, snapshots, raw records, import runs, mappings, conflicts, and
  provenance.

All domain records carry `campaign_id` even if the first deployment has only one campaign.
Catalog records can be global and exposed to campaigns through a campaign overlay. This
prevents this setting's altered Kasatha or weapon from overwriting a future canonical
Starfinder catalog entry.

## Proposed logical data model

### Shared record conventions

Every primary record should have:

- `id uuid`, `campaign_id uuid`, `name`, optional `summary` and `notes`;
- `ruleset` (`starfinder_1e`, `system_neutral`, or a future value), `content_origin`
  (`official`, `homebrew`, `adapted`, `unknown`), and `approval_status`;
- `extensions jsonb` for source-specific facts not yet promoted to stable columns;
- `created_at`, `updated_at`, and optional `archived_at` (imports archive; they do not
  hard-delete);
- aliases in `entity_alias(entity_type, entity_id, alias, normalized_alias, source_id)`;
- provenance in `field_provenance(entity_type, entity_id, field_path, snapshot_id,
  source_locator, raw_value, transform_version, imported_at)`.

`extensions` is an escape hatch, not the whole model. Fields used for filtering, joining,
validation, or game calculations should graduate to typed columns or child tables.

### Core entities and relationships

```text
campaign ──< session ──< event >── entity_ref
    │           │
    │           └──< encounter
    ├──< person ──< person_relationship >── person
    │       ├──< crew_assignment >── ship/department/role
    │       ├──< party_membership >── party
    │       ├──> species
    │       ├──< person_ability >── ability
    │       └──< inventory_entry >── item_variant
    ├──< organization ──< organization_membership >── person/species
    ├──< star_system ──< world ──< location
    ├──< ship >── ship_design ──< ship_space
    └──< lore_document ──< lore_section >── entity_ref

item ──1:1── weapon_detail / armor_detail / medical_detail / vehicle_detail
item ──< item_variant
item_variant ──< compatible_upgrade >── upgrade
species ──< species_trait >── ability
```

Use an explicit `entity_ref`/`entity_link` table only for cross-domain annotations such as
"event involves X" or "section mentions Y". Important business relations (crew, family,
inventory) should have dedicated typed join tables with dates, roles, quantities, and
source provenance.

### Type-specific fields

- **Person:** display name, species FK, age value/raw age, pronouns/sex as supplied,
  life/status, rank, occupation, allegiance, physical description. Skills and powers are
  repeatable `person_ability` records with rank/value and raw notation.
- **Species:** home world FK/text fallback, size, creature/substance type, atmosphere,
  sexes, locomotion, government/status, sleep/food/water requirements, attribute
  modifiers, background, sociology, physiology, and repeatable traits. Keep the original
  stat scale because its values are not demonstrably standard Starfinder ability scores.
- **Organization:** kind (government, faction, company, military, religion), leadership,
  goals, headquarters, and parent organization. The Accord is an organization linked to
  its constitution.
- **Ship design:** class/name, role/type, faction/species designer, tonnage, dimensions,
  deck count, arcs/weapons, status, and notes. **Ship** stores the proper name, design FK,
  current status, affiliation, and campaign-specific loadout.
- **Item:** category, rarity, manufacturer, description, approval state. Weapon detail
  stores handed size, category, attack modifier, dice expression, damage type, critical,
  capacity/clip, fire mode/rate, range, and special rule text. Armor detail stores class,
  EAC/KAC, max Dexterity, check/speed penalties, slots, and bulk. Upgrades have effects and
  compatibility rather than pretending to be armor or weapons.
- **Place:** systems use sector plus source system code; worlds use orbital position,
  planet class, habitability, and exploration status. Preserve `source_code` because
  values such as `001` must not become integer `1`.
- **Event:** `kind`, `title`, narrative, `start_date`, `end_date`, `date_precision`,
  `raw_date`, significance, and linked entities/locations. Dates should use a campaign
  calendar abstraction; do not assume all future data maps cleanly to JavaScript/ISO
  timestamps.
- **Session:** episode number, title, played-at (real world), in-world start/end, summary,
  and status. A session has many events, allowing multiple important events later.
- **Lore document/section:** title, document kind, edition/version, ordered hierarchical
  sections, heading/anchor, body, and visibility. This preserves the constitution's
  articles and sections and supports deep links.

## Import and synchronization architecture

### Source registry

Do not bake shared URLs into route code. Configure a `source_definition` with Google file
ID, kind (`sheet`/`doc`), expected tabs, parser name/version, sync mode, and credential
reference. A `source_snapshot` records export time, Google revision/ETag when available,
SHA-256, local object key, and import status. Credentials belong in environment/secret
storage and never in the database or repository.

Recommended production access is the Google Drive/Sheets APIs with a read-only service
account granted access to a dedicated source folder. Public XLSX/DOCX export is acceptable
for the prototype, but gives weaker revision metadata and makes accidental public sharing
part of the system's security model. Poll on demand plus a scheduled job; Google remains
the authoring source until Codex editing and conflict policy are deliberately introduced.

### Staged flow

```text
fetch -> immutable snapshot -> parser-specific raw rows/paragraphs
      -> normalize -> validate -> resolve identities -> preview diff
      -> approve/apply transaction -> provenance + import report
```

1. **Extract without interpretation.** Save the original export and a lossless raw form
   with file ID, tab/paragraph, row/column or cell range, formula/display value, and image
   reference where available.
2. **Transform per logical table, not per worksheet.** Examples: split pets from vehicles
   in Assets, split three inventory tables in Equipment, parse repeated species blocks,
   and unpivot star-system orbital columns.
3. **Normalize conservatively.** Trim incidental whitespace and normalize lookup keys,
   while retaining punctuation/case in display values. Map aliases explicitly. Never turn
   `?`, blank, or `X` into zero/false without a column-specific rule.
4. **Validate into quarantine.** Required key missing, duplicate candidate, invalid date,
   shifted columns, unknown reference, and destructive changes become reviewable issues.
   Warnings may import; errors remain staged.
5. **Resolve identity.** Match stable external key first, then approved alias, then a
   carefully scoped normalized-name candidate. Never auto-merge ambiguous people.
6. **Preview and apply idempotently.** Upsert by `(source_definition, source_record_key)`,
   show creates/updates/archives/conflicts, and apply the approved set in one transaction.
   Re-importing the same snapshot must make no domain changes.

### Ownership and conflict policy

Start with **source-owned imported fields**: spreadsheet changes may update fields whose
latest provenance is that source, while Codex-only notes live in separate overlay fields.
If a user edits an imported field in Codex, mark it locally overridden and surface later
source differences as conflicts. Missing source rows should be proposed for archival, not
deleted automatically. This avoids both silent loss and a fragile two-way sync.

## Source mapping order

1. Species `DB_Species_Table` -> `species`, narrative columns, survival requirements, and
   source-stat `extensions`; `DB_AliasMap` -> aliases. Compare against both normalized tabs
   and report unmatched records rather than importing all three as duplicates.
2. Equipment Weapons/Armor/Upgrades -> item catalog and subtype tables. Manually verify
   column alignment where images or empty size columns shift values.
3. Ship class tabs -> ship designs; split comma-separated notable ships into candidate
   named vessels only after review.
4. Campaign People Met -> people plus encounter/context text; Timeline -> sessions and
   events; Economy -> organizations; Type Planets -> reference taxonomy.
5. Historical document -> events using a date grammar for `YYYY`, `YYYY-YYYY`, and raw
   exceptions. Entity extraction should only propose links for human review.
6. Constitution -> one lore document with ordered article/section hierarchy and Accord
   organization link.
7. Crew workbook last: first create a canonical person registry from Main/Other Crew, then
   attach departments, stats, family, children, quarters, assets, inventory, and powers.
   This is the largest and most layout-dependent import and should not be the pilot.

## Migration from the current application

The existing lowdb layer gives every category a schemaless JSON array and generic CRUD.
That is useful for a demo but cannot enforce foreign keys, stage imports transactionally,
retain provenance, or safely resolve thousands of cross-sheet references. Migrate through
an API-compatible seam rather than rewriting everything at once:

1. Introduce repository interfaces behind existing `/api/*` routes and characterize the
   current API with tests.
2. Add PostgreSQL migrations and the campaign/source/provenance foundation. Seed one
   default campaign and migrate existing lowdb records as `content_origin=unknown`.
3. Ship read-only source registry, snapshot, parser, validation, preview, and import-run
   endpoints/jobs. Do not let browser requests perform long imports synchronously.
4. Pilot species and equipment, compare counts and sampled records, then enable them in
   the UI with provenance and import warnings.
5. Add world/campaign modules (organizations, places, sessions/events, ship designs), then
   import the campaign workbook and documents.
6. Import the crew graph after a dedicated identity-review screen exists.
7. Replace legacy string fields (`affiliation`, party `members`, ship `crew`) with typed
   relations while keeping compatibility projections until the frontend migrates.

For a small deployment, PostgreSQL plus an in-process job runner is sufficient. Add a
durable queue only when imports run across replicas or exceed operational time limits.
Store exported binaries in an object store or mounted data directory, not PostgreSQL rows.

## Delivery milestones and acceptance gates

### Implementation status

The ingestion foundation now includes a validated registry for all supplied sources,
explicit CLI and admin-UI fetching into immutable SHA-256-addressed snapshots, and parsers
for species, equipment, ship classes, the Accord constitution, and historical chronology.
Equipment is separated into the common item catalog and upgrades; vessel rows become ship
designs rather than named ships; constitutional paragraphs retain article/section hierarchy;
and dated history becomes events while undated paragraphs are reviewable warnings. The
admin UI previews collection-level creates/updates against the reviewed checksum before a
single lowdb state write records mappings, import runs, snapshot metadata, and field-level
provenance. Crew and campaign spreadsheets remain pending because their mixed tables need
additional layout-specific transforms (and the campaign workbook's `History` tab exposes an
ExcelJS compatibility limitation). PostgreSQL remains the production target for actual
database transactions, constraints, and concurrent imports.

### Milestone 0 — source contract and fixtures

- Confirm file ownership, sharing model, authoritative tabs, sync frequency, and whether
  Codex is read-only or may edit imported facts.
- Capture consented, redacted test fixtures; do not commit the full private campaign data.
- Define column dictionaries, especially the unlabeled crew/stat columns and ship sheets.
- **Gate:** each logical table has an owner, stable record-key strategy, and fixture.

### Milestone 1 — persistence and ingestion spine

- PostgreSQL schema/migrations, campaign scoping, repositories, source/snapshot/import
  tables, provenance, job locking, checksums, and preview reports.
- **Gate:** same snapshot imported twice yields zero changes; failed apply rolls back; an
  imported field can be traced to a source cell/paragraph.

### Milestone 2 — species and equipment pilot

- Parsers, validators, alias resolution, item subtypes, review UI/API, and regression
  fixtures for punctuation, `X/?/blank`, dice, bulk `L`, and shifted image columns.
- **Gate:** expected source records reconcile; every skipped/quarantined row has a reason;
  no duplicate species arise from `DB_*` tabs.

### Milestone 3 — world, lore, and chronology

- Organizations, systems/worlds, ship designs/vessels, sessions/events, lore hierarchy,
  and campaign-calendar-safe date parsing.
- **Gate:** an episode, a historical range, a star-chart system, a ship design, and a
  constitutional section all deep-link to their source evidence.

### Milestone 4 — people and crew graph

- Person registry, assignments, departments, relationships, quarters, abilities, assets,
  inventory, and guided duplicate/alias review.
- **Gate:** department/quarters/stats never create phantom people; ambiguous matches await
  review; current and historical crew assignments remain distinguishable.

### Milestone 5 — operations and cutover

- Scheduled sync, backups, restore drill, metrics, stale-source alert, import audit log,
  role-based GM/player visibility, and compatibility-route retirement.
- **Gate:** restore succeeds, unauthorized users cannot fetch GM/private sources, and a
  changed or missing upstream tab fails safely without corrupting published data.

## Decisions needed before implementation

1. Which workbook tabs are authoritative versus formulas, scratch work, or generated
   views (especially Departments, Stats, List, and the three species `DB_*` tabs)?
2. Should Google remain the single editor, or is eventual two-way editing required?
3. Which facts are GM-only, player-visible, or spoiler-gated by session/event?
4. What do the crew letter columns and species numeric stat scales mean, and which values
   are mechanics versus descriptive ratings?
5. Are names borrowed from other published settings intentional homebrew canon? This
   affects attribution, visibility, and whether external content can be redistributed.
6. What calendar rules apply before/after year 2548, and are all dates in one era?
7. Should current sample data be discarded, retained in a demo campaign, or reconciled
   with the imported setting?

Until these are answered, the safest useful implementation is the ingestion foundation
and a read-only species/equipment pilot—not a bulk import directly into production.
