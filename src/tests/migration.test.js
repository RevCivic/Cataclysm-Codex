'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const {
  migrateOrganizations,
  migrateItems,
  migrateRelationships,
  updateSourceRecords,
  updateFieldProvenance,
  performMigration
} = require('../ingestion/migration');

test('Data migration', async (suite) => {
  await suite.test('migrateOrganizations consolidates parties, factions, and organizations', () => {
    const state = {
      parties: [
        { id: 'party-1', name: 'Heroes Guild', description: 'Main party', members: ['person-1'], home_base: 'Capital' }
      ],
      factions: [
        { id: 'faction-1', name: 'Shadow Circle', alignment: 'Chaotic Neutral', goals: 'Power', headquarters: 'Hidden' }
      ],
      organizations: [
        { id: 'org-1', name: 'Trade Company', organization_type: 'corporation' }
      ]
    };

    const result = migrateOrganizations(state);
    
    assert.equal(result.organizations.length, 3, 'Should have 3 organizations');
    
    const party = result.organizations.find(o => o.id === 'party-1');
    assert.equal(party.entity_type, 'organization', 'Party should have entity_type');
    assert.equal(party.organization_type, 'party', 'Should mark as party type');
    assert.equal(party.name, 'Heroes Guild', 'Should preserve name');
    
    const faction = result.organizations.find(o => o.id === 'faction-1');
    assert.equal(faction.organization_type, 'faction', 'Should mark as faction type');
    assert.equal(faction.alignment, 'Chaotic Neutral', 'Should preserve faction fields');
  });

  await suite.test('migrateItems consolidates weapons, armors, upgrades, and items', () => {
    const state = {
      weapons: [
        { id: 'wpn-1', name: 'Longsword', damage: '1d8', damage_type: 'slashing' }
      ],
      armors: [
        { id: 'arm-1', name: 'Plate Armor', level: 5, eac_bonus: 7, kac_bonus: 9 }
      ],
      upgrades: [
        { id: 'upg-1', name: 'Armor Enhancement', effect: 'Bonus' }
      ],
      items: [
        { id: 'itm-1', name: 'Healing Potion', item_type: 'consumable' }
      ]
    };

    const result = migrateItems(state);
    
    assert.equal(result.items.length, 4, 'Should have 4 items');
    
    const weapon = result.items.find(i => i.id === 'wpn-1');
    assert.equal(weapon.entity_type, 'item', 'Weapon should have entity_type');
    assert.equal(weapon.item_type, 'weapon', 'Should mark as weapon type');
    assert.equal(weapon.name, 'Longsword', 'Should preserve name');
    assert.equal(weapon.properties.damage, '1d8', 'Should store weapon properties');
    
    const armor = result.items.find(i => i.id === 'arm-1');
    assert.equal(armor.item_type, 'armor', 'Should mark as armor type');
    assert.equal(armor.properties.eac_bonus, 7, 'Should preserve armor properties');
  });

  await suite.test('migrateRelationships consolidates all relationship types', () => {
    const state = {
      personRelationships: [
        { id: 'rel-1', person_id_1: 'p1', person_id_2: 'p2', type: 'ally' }
      ],
      crewAssignments: [
        { id: 'crew-1', person_id: 'p3', starship_id: 'ship-1', position: 'Captain' }
      ],
      partyMemberships: [
        { id: 'party-1', person_id: 'p1', party_id: 'party-1', role: 'Leader' }
      ],
      historicalMemberships: [
        { id: 'hist-1', person_id: 'p4', organization_id: 'org-1', role: 'Member' }
      ]
    };

    const result = migrateRelationships(state);
    
    assert.equal(result.relationships.length, 4, 'Should have 4 relationships');
    
    const personRel = result.relationships.find(r => r.id === 'rel-1');
    assert.equal(personRel.relationship_type, 'ally', 'Personal relationship should preserve type');
    assert.equal(personRel.source_entity_type, 'person', 'Should set entity types');
    
    const crewRel = result.relationships.find(r => r.id === 'crew-1');
    assert.equal(crewRel.relationship_type, 'crew_member_of', 'Crew assignment should map correctly');
    assert.equal(crewRel.metadata.position, 'Captain', 'Should preserve position in metadata');
  });

  await suite.test('updateSourceRecords remaps entity_type values', () => {
    const state = {
      sourceRecords: [
        { id: 'sr-1', entity_type: 'parties', entity_id: 'party-1' },
        { id: 'sr-2', entity_type: 'weapons', entity_id: 'wpn-1' },
        { id: 'sr-3', entity_type: 'crewAssignments', entity_id: 'crew-1' }
      ]
    };

    updateSourceRecords(state, new Map());
    
    const partyRecord = state.sourceRecords.find(sr => sr.id === 'sr-1');
    assert.equal(partyRecord.entity_type, 'organization', 'Parties should map to organization');
    
    const weaponRecord = state.sourceRecords.find(sr => sr.id === 'sr-2');
    assert.equal(weaponRecord.entity_type, 'item', 'Weapons should map to item');
    
    const crewRecord = state.sourceRecords.find(sr => sr.id === 'sr-3');
    assert.equal(crewRecord.entity_type, 'relationship', 'CrewAssignments should map to relationship');
  });

  await suite.test('updateFieldProvenance remaps entity_type values', () => {
    const state = {
      fieldProvenance: [
        { id: 'fp-1', entity_type: 'parties', entity_id: 'party-1', field_path: 'name' },
        { id: 'fp-2', entity_type: 'armors', entity_id: 'arm-1', field_path: 'level' }
      ]
    };

    updateFieldProvenance(state);
    
    const partyProv = state.fieldProvenance.find(fp => fp.id === 'fp-1');
    assert.equal(partyProv.entity_type, 'organization', 'Party provenance should map to organization');
    
    const armorProv = state.fieldProvenance.find(fp => fp.id === 'fp-2');
    assert.equal(armorProv.entity_type, 'item', 'Armor provenance should map to item');
  });

  await suite.test('performMigration executes complete transformation', () => {
    const state = {
      parties: [{ id: 'party-1', name: 'Party', members: [] }],
      factions: [{ id: 'faction-1', name: 'Faction', alignment: 'Neutral' }],
      organizations: [],
      weapons: [{ id: 'wpn-1', name: 'Weapon' }],
      armors: [],
      upgrades: [],
      items: [],
      personRelationships: [],
      crewAssignments: [],
      partyMemberships: [],
      historicalMemberships: [],
      sourceRecords: [
        { id: 'sr-1', entity_type: 'parties', entity_id: 'party-1' },
        { id: 'sr-2', entity_type: 'weapons', entity_id: 'wpn-1' }
      ],
      fieldProvenance: [
        { id: 'fp-1', entity_type: 'parties', entity_id: 'party-1', field_path: 'name' }
      ]
    };

    const migrated = performMigration(state);
    
    assert.equal(migrated.organizations.length, 2, 'Should have 2 organizations');
    assert.equal(migrated.items.length, 1, 'Should have 1 item');
    assert.equal(migrated.relationships.length, 0, 'Should have 0 relationships (empty input)');
    
    // Verify sourceRecords were updated
    const srParty = migrated.sourceRecords.find(sr => sr.id === 'sr-1');
    assert.equal(srParty.entity_type, 'organization', 'SourceRecords should be updated');
    
    // Verify fieldProvenance were updated
    const fpParty = migrated.fieldProvenance.find(fp => fp.id === 'fp-1');
    assert.equal(fpParty.entity_type, 'organization', 'FieldProvenance should be updated');
  });

  await suite.test('migration preserves all entity IDs', () => {
    const originalIds = {
      parties: ['party-1', 'party-2'],
      factions: ['faction-1'],
      weapons: ['wpn-1', 'wpn-2'],
      armors: ['arm-1']
    };

    const state = {
      parties: originalIds.parties.map(id => ({ id, name: 'Test' })),
      factions: originalIds.factions.map(id => ({ id, name: 'Test', alignment: 'Neutral' })),
      organizations: [],
      weapons: originalIds.weapons.map(id => ({ id, name: 'Test' })),
      armors: originalIds.armors.map(id => ({ id, name: 'Test' })),
      upgrades: [],
      items: [],
      personRelationships: [],
      crewAssignments: [],
      partyMemberships: [],
      historicalMemberships: [],
      sourceRecords: [],
      fieldProvenance: []
    };

    const migrated = performMigration(state);
    const allIds = migrated.organizations.map(o => o.id).concat(migrated.items.map(i => i.id));
    const expectedIds = [...originalIds.parties, ...originalIds.factions, ...originalIds.weapons, ...originalIds.armors];
    
    for (const expectedId of expectedIds) {
      assert(allIds.includes(expectedId), `ID ${expectedId} should be preserved`);
    }
  });
});
