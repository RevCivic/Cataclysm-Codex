'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Migration utilities for normalizing legacy collections to unified schema
 * Supports Phase 2 (organizations), Phase 3 (items), Phase 4 (relationships)
 */

/**
 * Migrate organizations, parties, and factions to unified organizations collection
 * Preserves all fields and adds organization_type discriminator
 */
function migrateOrganizations(state) {
  const allOrgs = [];
  const idMappings = new Map(); // old id -> new id mappings for source records

  // Migrate parties
  for (const party of state.parties || []) {
    const org = {
      id: party.id,
      entity_type: 'organization',
      organization_type: 'party',
      name: party.name,
      description: party.description,
      members: party.members,
      home_base: party.home_base,
      notes: party.notes,
      campaign_id: party.campaign_id || '00000000-0000-4000-8000-000000000001',
      created_at: party.created_at,
      updated_at: party.updated_at,
      // Normalized identity for deduplication
      organization_identity: String(party.name).trim().toLocaleLowerCase('en-US')
    };
    allOrgs.push(org);
    idMappings.set({ source: 'parties', id: party.id }, org.id);
  }

  // Migrate factions
  for (const faction of state.factions || []) {
    const org = {
      id: faction.id,
      entity_type: 'organization',
      organization_type: 'faction',
      name: faction.name,
      alignment: faction.alignment,
      description: faction.description,
      goals: faction.goals,
      headquarters: faction.headquarters,
      leader: faction.leader,
      notes: faction.notes,
      campaign_id: faction.campaign_id || '00000000-0000-4000-8000-000000000001',
      created_at: faction.created_at,
      updated_at: faction.updated_at,
      // Normalized identity for deduplication
      organization_identity: String(faction.name).trim().toLocaleLowerCase('en-US')
    };
    allOrgs.push(org);
    idMappings.set({ source: 'factions', id: faction.id }, org.id);
  }

  // Migrate existing organizations (already in correct format, just add entity_type)
  for (const org of state.organizations || []) {
    const normalized = {
      ...org,
      entity_type: 'organization',
      organization_type: org.organization_type || 'other',
      campaign_id: org.campaign_id || '00000000-0000-4000-8000-000000000001',
      // Normalized identity for deduplication
      organization_identity: String(org.name).trim().toLocaleLowerCase('en-US')
    };
    allOrgs.push(normalized);
    idMappings.set({ source: 'organizations', id: org.id }, org.id);
  }

  return { organizations: allOrgs, idMappings };
}

/**
 * Migrate weapons, armors, items, and upgrades to unified items collection
 */
function migrateItems(state) {
  const allItems = [];
  const idMappings = new Map();

  // Migrate weapons
  for (const weapon of state.weapons || []) {
    const item = {
      id: weapon.id,
      entity_type: 'item',
      item_type: 'weapon',
      name: weapon.name,
      description: weapon.description,
      // Common fields
      campaign_id: weapon.campaign_id || '00000000-0000-4000-8000-000000000001',
      created_at: weapon.created_at,
      updated_at: weapon.updated_at,
      // Weapon-specific fields in properties
      properties: {
        damage: weapon.damage,
        damage_type: weapon.damage_type,
        critical: weapon.critical,
        range: weapon.range,
        capacity: weapon.capacity,
        usage: weapon.usage,
        bulk: weapon.bulk,
        price: weapon.price,
        level: weapon.level,
        category: weapon.category
      },
      // Normalized identity for deduplication
      item_identity: ['weapon', weapon.name].filter(Boolean).join('\u001f').toLocaleLowerCase('en-US')
    };
    allItems.push(item);
    idMappings.set({ source: 'weapons', id: weapon.id }, item.id);
  }

  // Migrate armors
  for (const armor of state.armors || []) {
    const item = {
      id: armor.id,
      entity_type: 'item',
      item_type: 'armor',
      name: armor.name,
      description: armor.description,
      campaign_id: armor.campaign_id || '00000000-0000-4000-8000-000000000001',
      created_at: armor.created_at,
      updated_at: armor.updated_at,
      properties: {
        type: armor.type,
        level: armor.level,
        eac_bonus: armor.eac_bonus,
        kac_bonus: armor.kac_bonus,
        max_dex: armor.max_dex,
        armor_check_penalty: armor.armor_check_penalty,
        speed_adjustment: armor.speed_adjustment,
        upgrade_slots: armor.upgrade_slots,
        bulk: armor.bulk,
        price: armor.price
      },
      item_identity: ['armor', armor.name].filter(Boolean).join('\u001f').toLocaleLowerCase('en-US')
    };
    allItems.push(item);
    idMappings.set({ source: 'armors', id: armor.id }, item.id);
  }

  // Migrate upgrades
  for (const upgrade of state.upgrades || []) {
    const item = {
      id: upgrade.id,
      entity_type: 'item',
      item_type: 'upgrade',
      name: upgrade.name,
      description: upgrade.description,
      campaign_id: upgrade.campaign_id || '00000000-0000-4000-8000-000000000001',
      created_at: upgrade.created_at,
      updated_at: upgrade.updated_at,
      properties: {
        ...upgrade
      },
      item_identity: ['upgrade', upgrade.name].filter(Boolean).join('\u001f').toLocaleLowerCase('en-US')
    };
    allItems.push(item);
    idMappings.set({ source: 'upgrades', id: upgrade.id }, item.id);
  }

  // Existing items already have most of correct format, just add entity_type
  for (const existingItem of state.items || []) {
    if (!existingItem.entity_type) {
      existingItem.entity_type = 'item';
      existingItem.item_type = existingItem.item_type || 'equipment';
      existingItem.campaign_id = existingItem.campaign_id || '00000000-0000-4000-8000-000000000001';
      existingItem.item_identity = ['equipment', existingItem.name].filter(Boolean).join('\u001f').toLocaleLowerCase('en-US');
      allItems.push(existingItem);
      idMappings.set({ source: 'items', id: existingItem.id }, existingItem.id);
    }
  }

  return { items: allItems, idMappings };
}

/**
 * Migrate relationship collections to unified relationships table
 */
function migrateRelationships(state) {
  const relationships = [];
  const now = new Date().toISOString();

  // Migrate personRelationships
  for (const rel of state.personRelationships || []) {
    relationships.push({
      id: rel.id || uuidv4(),
      source_entity_id: rel.person_id_1 || rel.source_id,
      source_entity_type: 'person',
      relationship_type: rel.type || 'knows',
      target_entity_id: rel.person_id_2 || rel.target_id,
      target_entity_type: 'person',
      campaign_id: rel.campaign_id || '00000000-0000-4000-8000-000000000001',
      metadata: rel.metadata || { description: rel.description, notes: rel.notes },
      created_at: rel.created_at || now,
      updated_at: rel.updated_at
    });
  }

  // Migrate crewAssignments
  for (const assignment of state.crewAssignments || []) {
    relationships.push({
      id: assignment.id || uuidv4(),
      source_entity_id: assignment.person_id,
      source_entity_type: 'person',
      relationship_type: 'crew_member_of',
      target_entity_id: assignment.starship_id || assignment.ship_id,
      target_entity_type: 'starship',
      campaign_id: assignment.campaign_id || '00000000-0000-4000-8000-000000000001',
      metadata: assignment.metadata || { position: assignment.position, status: assignment.status },
      created_at: assignment.created_at || now,
      updated_at: assignment.updated_at
    });
  }

  // Migrate partyMemberships
  for (const membership of state.partyMemberships || []) {
    relationships.push({
      id: membership.id || uuidv4(),
      source_entity_id: membership.person_id || membership.member_id,
      source_entity_type: 'person',
      relationship_type: 'member_of',
      target_entity_id: membership.party_id,
      target_entity_type: 'organization',
      campaign_id: membership.campaign_id || '00000000-0000-4000-8000-000000000001',
      metadata: membership.metadata || { role: membership.role, status: membership.status },
      created_at: membership.created_at || now,
      updated_at: membership.updated_at
    });
  }

  // Migrate historicalMemberships
  for (const membership of state.historicalMemberships || []) {
    relationships.push({
      id: membership.id || uuidv4(),
      source_entity_id: membership.person_id || membership.member_id,
      source_entity_type: 'person',
      relationship_type: 'historical_member_of',
      target_entity_id: membership.organization_id,
      target_entity_type: 'organization',
      campaign_id: membership.campaign_id || '00000000-0000-4000-8000-000000000001',
      metadata: membership.metadata || { role: membership.role, period: membership.period },
      created_at: membership.created_at || now,
      updated_at: membership.updated_at
    });
  }

  return { relationships };
}

/**
 * Update sourceRecords to point to new entity_type values
 */
function updateSourceRecords(state, entityMappings) {
  const now = new Date().toISOString();
  for (const record of state.sourceRecords || []) {
    const oldType = record.entity_type;
    
    // Map old collection names to new entity_type values
    if (oldType === 'parties') {
      record.entity_type = 'organization';
    } else if (oldType === 'factions') {
      record.entity_type = 'organization';
    } else if (oldType === 'weapons') {
      record.entity_type = 'item';
    } else if (oldType === 'armors') {
      record.entity_type = 'item';
    } else if (oldType === 'upgrades') {
      record.entity_type = 'item';
    } else if (oldType === 'personRelationships') {
      record.entity_type = 'relationship';
    } else if (oldType === 'crewAssignments') {
      record.entity_type = 'relationship';
    } else if (oldType === 'partyMemberships') {
      record.entity_type = 'relationship';
    } else if (oldType === 'historicalMemberships') {
      record.entity_type = 'relationship';
    }
    record.updated_at = now;
  }
}

/**
 * Update fieldProvenance records with new entity_type values
 */
function updateFieldProvenance(state) {
  const now = new Date().toISOString();
  for (const prov of state.fieldProvenance || []) {
    const oldType = prov.entity_type;
    
    if (oldType === 'parties') {
      prov.entity_type = 'organization';
    } else if (oldType === 'factions') {
      prov.entity_type = 'organization';
    } else if (oldType === 'weapons') {
      prov.entity_type = 'item';
    } else if (oldType === 'armors') {
      prov.entity_type = 'item';
    } else if (oldType === 'upgrades') {
      prov.entity_type = 'item';
    }
    prov.updated_at = now;
  }
}

/**
 * Perform complete migration from legacy to unified schema
 * Returns new state with legacy collections preserved (for gradual transition)
 */
function performMigration(state) {
  const migrated = structuredClone(state);

  // Phase 2: Organizations
  const orgsResult = migrateOrganizations(migrated);
  migrated.organizations = orgsResult.organizations;

  // Phase 3: Items
  const itemsResult = migrateItems(migrated);
  migrated.items = itemsResult.items;

  // Phase 4: Relationships
  const relsResult = migrateRelationships(migrated);
  migrated.relationships = relsResult.relationships;

  // Phase 6: Update provenance
  updateSourceRecords(migrated, { ...orgsResult.idMappings, ...itemsResult.idMappings });
  updateFieldProvenance(migrated);

  return migrated;
}

module.exports = {
  migrateOrganizations,
  migrateItems,
  migrateRelationships,
  updateSourceRecords,
  updateFieldProvenance,
  performMigration
};
