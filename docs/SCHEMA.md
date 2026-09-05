# Data Normalization and Unified Schema

## Overview

This document describes the normalized data schema implemented to consolidate fragmented collections and reduce duplication while maintaining backward compatibility and full import history.

## Phases Implemented

### Phase 1: Unified Entity Base Types

All domain entities now support a common base structure:

```javascript
{
  id: UUID,
  entity_type: string,           // "person", "organization", "item", "species", etc.
  campaign_id: UUID,             // Links to campaign context
  created_at: ISO8601,
  updated_at: ISO8601,
  notes: string                  // Optional shared notes field
}
```

### Phase 2: Organizations Consolidation

**Unified Collection: `organizations`**

The following legacy collections are consolidated into `organizations`:
- `parties` → `organization_type: "party"`
- `factions` → `organization_type: "faction"`  
- `organizations` → `organization_type: "other" | "corporation" | "government"`

**Schema:**

```javascript
{
  id: UUID,
  entity_type: "organization",
  organization_type: "party" | "faction" | "corporation" | "government" | "other",
  name: string,
  description: string,
  campaign_id: UUID,
  
  // Type-specific fields
  // For parties:
  members: [UUID],               // IDs of member people
  home_base: string,
  
  // For factions:
  alignment: string,
  goals: string,
  headquarters: string,
  leader: UUID,                  // ID of leader person
  
  // Unified fields
  organization_identity: string, // Normalized: lowercase name for deduplication
  created_at: ISO8601,
  updated_at: ISO8601,
  notes: string
}
```

**Access Patterns:**

- **Legacy route:** `/api/parties` → filters `organizations` where `organization_type = "party"`
- **Legacy route:** `/api/factions` → filters `organizations` where `organization_type = "faction"`
- **Unified route:** `/api/entities/organization` → all organizations
- **Unified route:** `/api/entities/party` → parties only
- **Unified route:** `/api/entities/faction` → factions only

### Phase 3: Equipment Consolidation

**Unified Collection: `items`**

The following legacy collections are consolidated into `items`:
- `weapons` → `item_type: "weapon"`
- `armors` → `item_type: "armor"`
- `upgrades` → `item_type: "upgrade"`
- `items` → `item_type: "equipment" | other`

**Schema:**

```javascript
{
  id: UUID,
  entity_type: "item",
  item_type: "weapon" | "armor" | "upgrade" | "equipment" | "consumable",
  name: string,
  description: string,
  campaign_id: UUID,
  
  // Common fields
  price: number,
  bulk: number | string,
  level: number,
  
  // Type-specific fields stored in properties
  properties: {
    // Weapon-specific
    damage: string,
    damage_type: string,
    critical: string,
    range: string,
    capacity: number,
    usage: string,
    category: string,
    
    // Armor-specific
    type: string,
    eac_bonus: number,
    kac_bonus: number,
    max_dex: number,
    armor_check_penalty: number,
    speed_adjustment: number,
    upgrade_slots: number,
    
    // Other fields as needed
    ...
  },
  
  // Unified identity for deduplication
  item_identity: string,         // Normalized: "type\u001fname" (lowercase)
  created_at: ISO8601,
  updated_at: ISO8601,
  notes: string
}
```

**Access Patterns:**

- **Legacy route:** `/api/weapons` → filters `items` where `item_type = "weapon"`
- **Legacy route:** `/api/armors` → filters `items` where `item_type = "armor"`
- **Legacy route:** `/api/reference/upgrades` → filters `items` where `item_type = "upgrade"`
- **Unified route:** `/api/entities/item` → all items
- **Unified route:** `/api/entities/weapon` → weapons only
- **Unified route:** `/api/entities/armor` → armors only
- **Unified route:** `/api/entities/upgrade` → upgrades only

### Phase 4: Relationships Consolidation

**Unified Collection: `relationships`**

All relationship tables are consolidated:
- `personRelationships` → `relationship_type: "knows" | custom`
- `crewAssignments` → `relationship_type: "crew_member_of"`
- `partyMemberships` → `relationship_type: "member_of"`
- `historicalMemberships` → `relationship_type: "historical_member_of"`

**Schema:**

```javascript
{
  id: UUID,
  source_entity_id: UUID,
  source_entity_type: string,    // "person", "organization", "item", etc.
  relationship_type: string,     // "member_of", "knows", "leads", "owns", etc.
  target_entity_id: UUID,
  target_entity_type: string,
  campaign_id: UUID,
  
  // Flexible metadata for type-specific data
  metadata: {
    role: string,                // for memberships
    position: string,            // for crew assignments
    status: string,              // various
    period: string,              // for historical relationships
    description: string,         // for generic relationships
    ...
  },
  
  created_at: ISO8601,
  updated_at: ISO8601
}
```

**Example Queries:**

```javascript
// Find all members of an organization
relationships.filter(r => 
  r.relationship_type === "member_of" && 
  r.target_entity_id === orgId
)

// Find all crew on a starship
relationships.filter(r =>
  r.relationship_type === "crew_member_of" &&
  r.target_entity_id === shipId
)

// Find all relationships involving a person
relationships.filter(r =>
  r.source_entity_id === personId ||
  r.target_entity_id === personId
)
```

### Phase 5: Unified Navigation Routes

A new unified route structure supports querying entities and relationships consistently:

**Unified Routes:**

```
GET  /api/entities/:entity_type              # List entities of type
GET  /api/entities/:entity_type/:id          # Get specific entity
GET  /api/entities/:entity_type?filter=...   # List with filters

# Examples:
GET  /api/entities/organization              # All organizations
GET  /api/entities/person                    # All people
GET  /api/entities/item                      # All items
GET  /api/entities/weapon                    # Filtered to weapons only
GET  /api/entities/party                     # Filtered to parties only
```

**Backward Compatibility:**

Legacy routes continue to work as filtered views of unified collections:

```
GET  /api/people        → /api/entities/person
GET  /api/species       → /api/entities/species
GET  /api/parties       → /api/entities/party
GET  /api/factions      → /api/entities/faction
GET  /api/weapons       → /api/entities/weapon
GET  /api/armors        → /api/entities/armor
```

### Phase 6: Import System Updates

The import system maintains full compatibility:

**Changes:**
- Parser output target collections map to unified entity_type values
- `sourceRecords` updated to reference `entity_type` instead of collection name
- Identity matching works across unified collections
- `fieldProvenance` tracking continues unchanged
- Alias system enhanced to support entity_type + name combinations

**Example Parser Configuration:**

```javascript
// Old (collection-based):
collections: { weapons: [...], armors: [...] }

// New (entity_type-based):
collections: { items: [
  { entity_type: "item", item_type: "weapon", ... },
  { entity_type: "item", item_type: "armor", ... }
]}
```

### Phase 7: Data Migration

**Migration Script:** `migrate-data.js`

Performs complete transformation:

```bash
node migrate-data.js
```

**Process:**
1. Creates backup: `data/db.json.backup.{timestamp}.json`
2. Consolidates parties, factions → organizations
3. Consolidates weapons, armors, upgrades → items
4. Consolidates relationship tables → relationships
5. Updates sourceRecords entity_type mappings
6. Updates fieldProvenance entity_type values
7. Preserves all entity IDs (no data loss)
8. Maintains complete import history

**Rollback:**
```bash
cp data/db.json.backup.{timestamp}.json data/db.json
```

## Benefits

✓ **Single Source of Truth** - Each logical entity has one canonical record

✓ **Extensibility** - Easy to add new entity types

✓ **Simplified Relationships** - Query relationships between any entity types

✓ **Reduced Code Duplication** - Generic handlers for all entities

✓ **Backward Compatible** - Legacy routes work via filtering

✓ **Import Integrity** - Complete history preserved

✓ **Better Deduplication** - Identity fields enable smart merging

## Query Examples

### Organizations with Members

```javascript
// Get all members of a party
const party = organizations.find(o => o.id === partyId);
const members = relationships.filter(r =>
  r.relationship_type === "member_of" &&
  r.target_entity_id === partyId &&
  r.source_entity_type === "person"
).map(r => people.find(p => p.id === r.source_entity_id));
```

### Equipment Organization

```javascript
// Get all weapons in campaign
const weapons = items.filter(i =>
  i.entity_type === "item" &&
  i.item_type === "weapon" &&
  i.campaign_id === campaignId
);

// Get high-level armor
const highLevelArmor = items.filter(i =>
  i.entity_type === "item" &&
  i.item_type === "armor" &&
  i.properties.level >= 10
);
```

### Crew Assignment

```javascript
// Get all crew on a ship
const crew = relationships
  .filter(r =>
    r.relationship_type === "crew_member_of" &&
    r.target_entity_id === shipId
  )
  .map(r => people.find(p => p.id === r.source_entity_id))
  .map(person => ({
    ...person,
    position: relationships.find(r =>
      r.source_entity_id === person.id &&
      r.target_entity_id === shipId
    )?.metadata?.position
  }));
```

## Implementation Timeline

The normalization is implemented as a non-breaking change:

1. **Unified collections added** to database schema (entities, relationships)
2. **Migration utility created** to transform existing data
3. **New unified routes** available alongside legacy routes
4. **Legacy routes continue working** as filtered views
5. **Migration script** allows opt-in conversion
6. **Gradual adoption** - update frontend/parsers at own pace
7. **Full backward compatibility** maintained throughout

## Next Steps

### For Frontend Developers
- Update components to use `/api/entities/:type` when appropriate
- Leverage new filtering capabilities (item_type, organization_type)
- Use relationships API for complex entity connections

### For Backend/Parser Developers
- Update import parsers to generate unified schemas
- Leverage migration utility for data transformation
- Test with both legacy and unified schemas
- Add entity_type field to generated records

### For DevOps/Database Managers
- Run migration script when ready: `node migrate-data.js`
- Keep backup for rollback capability
- Monitor import system during transition
- Update any external integrations

## See Also

- `src/ingestion/migration.js` - Migration utilities
- `migrate-data.js` - Migration script
- `src/routes/entities.js` - Unified entities route
- `src/database.js` - Database schema
- `src/ingestion/normalization.js` - Import normalization
