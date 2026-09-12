'use strict';

/**
 * Database schema initialization for PostgreSQL
 * This file contains SQL statements to create all necessary tables
 */

const schema = `
-- Campaigns (Base entity for multi-campaign support)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  ruleset VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- People (NPCs, characters)
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  race VARCHAR(255),
  class VARCHAR(255),
  level INTEGER,
  affiliation VARCHAR(255),
  description TEXT,
  notes TEXT,
  person_identity VARCHAR(255),
  campaign_id UUID REFERENCES campaigns(id),
  image_url VARCHAR(2048),
  image_ref VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_people_campaign_id ON people(campaign_id);

-- Species (Alien races)
CREATE TABLE IF NOT EXISTS species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  home_world VARCHAR(255),
  traits TEXT,
  size VARCHAR(50),
  type VARCHAR(100),
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  image_url VARCHAR(2048),
  image_ref VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_species_campaign_id ON species(campaign_id);

-- Organizations (Parties, Factions, etc.)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  organization_type VARCHAR(50),
  alignment VARCHAR(50),
  goals TEXT,
  headquarters VARCHAR(255),
  leader VARCHAR(255),
  description TEXT,
  organization_identity VARCHAR(255),
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_campaign_id ON organizations(campaign_id);

-- Items (Weapons, Armor, Upgrades)
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  item_type VARCHAR(50),
  item_identity VARCHAR(255),
  damage VARCHAR(100),
  range_val VARCHAR(100),
  capacity INTEGER,
  bulk VARCHAR(50),
  price DECIMAL(10, 2),
  eac_bonus INTEGER,
  kac_bonus INTEGER,
  max_dex INTEGER,
  upgrade_slots INTEGER,
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_campaign_id ON items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type);

-- Starships (Vessels)
CREATE TABLE IF NOT EXISTS starships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  model VARCHAR(255),
  size VARCHAR(50),
  speed DECIMAL(10, 2),
  shields INTEGER,
  hull_points INTEGER,
  crew_count INTEGER,
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_starships_campaign_id ON starships(campaign_id);

-- Timeline Events
CREATE TABLE IF NOT EXISTS timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  year VARCHAR(50),
  era VARCHAR(100),
  significance TEXT,
  description TEXT,
  notes TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timeline_campaign_id ON timeline(campaign_id);

-- Departments (Organizational units)
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  head_id UUID,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departments_campaign_id ON departments(campaign_id);

-- Sessions (Campaign sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER,
  name VARCHAR(255),
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_campaign_id ON sessions(campaign_id);

-- Events (World history, session events)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  description TEXT,
  event_date VARCHAR(100),
  significance TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_campaign_id ON events(campaign_id);

-- Star Systems
CREATE TABLE IF NOT EXISTS star_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_star_systems_campaign_id ON star_systems(campaign_id);

-- Worlds (Planets)
CREATE TABLE IF NOT EXISTS worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  system_id UUID REFERENCES star_systems(id),
  world_class VARCHAR(50),
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_worlds_campaign_id ON worlds(campaign_id);
CREATE INDEX IF NOT EXISTS idx_worlds_system_id ON worlds(system_id);

-- Locations (Places)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  world_id UUID REFERENCES worlds(id),
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locations_campaign_id ON locations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_locations_world_id ON locations(world_id);

-- Ship Designs (Reusable ship classes)
CREATE TABLE IF NOT EXISTS ship_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ship_designs_campaign_id ON ship_designs(campaign_id);

-- Lore Documents
CREATE TABLE IF NOT EXISTS lore_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lore_documents_campaign_id ON lore_documents(campaign_id);

-- Lore Sections (Hierarchical sections within documents)
CREATE TABLE IF NOT EXISTS lore_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES lore_documents(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES lore_sections(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT,
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lore_sections_document_id ON lore_sections(document_id);
CREATE INDEX IF NOT EXISTS idx_lore_sections_parent_id ON lore_sections(parent_id);

-- Relationships (Generic relationship tracking)
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL,
  target_id UUID NOT NULL,
  relationship_type VARCHAR(100),
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_relationships_campaign_id ON relationships(campaign_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source_id ON relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target_id ON relationships(target_id);

-- Person Relationships (Specific relationship types for people)
CREATE TABLE IF NOT EXISTS person_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id_1 UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  person_id_2 UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  relationship_type VARCHAR(100),
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_person_relationships_campaign_id ON person_relationships(campaign_id);
CREATE INDEX IF NOT EXISTS idx_person_relationships_person_id_1 ON person_relationships(person_id_1);
CREATE INDEX IF NOT EXISTS idx_person_relationships_person_id_2 ON person_relationships(person_id_2);

-- Crew Assignments
CREATE TABLE IF NOT EXISTS crew_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  ship_id UUID REFERENCES starships(id),
  role VARCHAR(255),
  department_id UUID REFERENCES departments(id),
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crew_assignments_campaign_id ON crew_assignments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_crew_assignments_person_id ON crew_assignments(person_id);
CREATE INDEX IF NOT EXISTS idx_crew_assignments_ship_id ON crew_assignments(ship_id);
CREATE INDEX IF NOT EXISTS idx_crew_assignments_department_id ON crew_assignments(department_id);

-- Party Memberships
CREATE TABLE IF NOT EXISTS party_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(255),
  joined_date VARCHAR(100),
  left_date VARCHAR(100),
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_party_memberships_campaign_id ON party_memberships(campaign_id);
CREATE INDEX IF NOT EXISTS idx_party_memberships_person_id ON party_memberships(person_id);
CREATE INDEX IF NOT EXISTS idx_party_memberships_organization_id ON party_memberships(organization_id);

-- Inventories (Item collections)
CREATE TABLE IF NOT EXISTS inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID,
  owner_type VARCHAR(50),
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventories_campaign_id ON inventories(campaign_id);
CREATE INDEX IF NOT EXISTS idx_inventories_owner ON inventories(owner_id, owner_type);

-- Entity Aliases (Alternative names for entities)
CREATE TABLE IF NOT EXISTS entity_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type VARCHAR(100),
  alias VARCHAR(255) NOT NULL,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entity_aliases_campaign_id ON entity_aliases(campaign_id);
CREATE INDEX IF NOT EXISTS idx_entity_aliases_entity ON entity_aliases(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_entity_aliases_alias ON entity_aliases(alias);

-- Source Snapshots (Immutable snapshots of imported data)
CREATE TABLE IF NOT EXISTS source_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name VARCHAR(255) NOT NULL,
  snapshot_hash VARCHAR(255) NOT NULL UNIQUE,
  file_path VARCHAR(2048),
  content_hash VARCHAR(255),
  imported BOOLEAN DEFAULT FALSE,
  import_run_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_source_snapshots_source_name ON source_snapshots(source_name);
CREATE INDEX IF NOT EXISTS idx_source_snapshots_imported ON source_snapshots(imported);

-- Source Records (Mapping of imported records to sources)
CREATE TABLE IF NOT EXISTS source_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  source_name VARCHAR(255) NOT NULL,
  source_key VARCHAR(255),
  snapshot_hash VARCHAR(255),
  import_run_id UUID,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_source_records_campaign_id ON source_records(campaign_id);
CREATE INDEX IF NOT EXISTS idx_source_records_entity ON source_records(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_source_records_source ON source_records(source_name, source_key);

-- Field Provenance (Track field-level changes)
CREATE TABLE IF NOT EXISTS field_provenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  field_name VARCHAR(255) NOT NULL,
  source_name VARCHAR(255),
  source_key VARCHAR(255),
  import_run_id UUID,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_field_provenance_campaign_id ON field_provenance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_field_provenance_entity ON field_provenance(entity_id, entity_type);

-- Import Runs (Audit trail of import operations)
CREATE TABLE IF NOT EXISTS import_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name VARCHAR(255) NOT NULL,
  snapshot_hash VARCHAR(255),
  status VARCHAR(50),
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  error_message TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_import_runs_campaign_id ON import_runs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_import_runs_source_name ON import_runs(source_name);
CREATE INDEX IF NOT EXISTS idx_import_runs_status ON import_runs(status);

-- Planet Classes (Reference data)
CREATE TABLE IF NOT EXISTS planet_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_planet_classes_campaign_id ON planet_classes(campaign_id);

-- Historical Memberships (Track historical organization memberships)
CREATE TABLE IF NOT EXISTS historical_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(255),
  start_date VARCHAR(100),
  end_date VARCHAR(100),
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historical_memberships_campaign_id ON historical_memberships(campaign_id);
CREATE INDEX IF NOT EXISTS idx_historical_memberships_person_id ON historical_memberships(person_id);
CREATE INDEX IF NOT EXISTS idx_historical_memberships_organization_id ON historical_memberships(organization_id);

-- Ship Spaces (Rooms/compartments in a starship)
CREATE TABLE IF NOT EXISTS ship_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id UUID NOT NULL REFERENCES starships(id) ON DELETE CASCADE,
  name VARCHAR(255),
  description TEXT,
  purpose VARCHAR(100),
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ship_spaces_campaign_id ON ship_spaces(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ship_spaces_ship_id ON ship_spaces(ship_id);

-- Reference Entries (Generic reference material)
CREATE TABLE IF NOT EXISTS reference_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  category VARCHAR(100),
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reference_entries_campaign_id ON reference_entries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_reference_entries_category ON reference_entries(category);

-- Legacy table names for backward compatibility views (optional)
DROP VIEW IF EXISTS parties CASCADE;
CREATE VIEW parties AS SELECT id, name, organization_type, description, goals, headquarters FROM organizations WHERE organization_type = 'party';
DROP VIEW IF EXISTS factions CASCADE;
CREATE VIEW factions AS SELECT id, name, organization_type, alignment, description, goals, headquarters, leader FROM organizations WHERE organization_type = 'faction';
DROP VIEW IF EXISTS weapons CASCADE;
CREATE VIEW weapons AS SELECT id, name, item_type, damage, range_val as range, capacity, bulk, price, description FROM items WHERE item_type = 'weapon';
DROP VIEW IF EXISTS armors CASCADE;
CREATE VIEW armors AS SELECT id, name, item_type, eac_bonus, kac_bonus, max_dex, upgrade_slots, bulk, price, description FROM items WHERE item_type = 'armor';
DROP VIEW IF EXISTS upgrades CASCADE;
CREATE VIEW upgrades AS SELECT id, name, item_type, description FROM items WHERE item_type = 'upgrade';
`;

module.exports = schema;
