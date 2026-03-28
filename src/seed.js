'use strict';

const { db, create } = require('./database');

console.log('Seeding Cataclysm Codex database...');

// Clear existing data
db.set('people', []).write();
db.set('species', []).write();
db.set('parties', []).write();
db.set('factions', []).write();
db.set('weapons', []).write();
db.set('starships', []).write();
db.set('armors', []).write();
db.set('timeline', []).write();

// ─── People ──────────────────────────────────────────────────────────────────
create('people', {
  name: 'Riven Ashcroft',
  race: 'Human',
  class: 'Soldier',
  level: '5',
  affiliation: 'The Iron Vanguard',
  description: 'A grizzled veteran who survived the Drift anomaly near Absalom Station. Riven wears his scars openly and leads with a blunt efficiency that masks a fierce loyalty to his crew.',
  notes: 'Carries a photon reaper and custom heavy armor engraved with the Iron Vanguard crest.'
});

create('people', {
  name: 'Sylara Voss',
  race: 'Kasatha',
  class: 'Mystic',
  level: '5',
  affiliation: 'The Drift Seekers',
  description: 'A four-armed mystic from the nomadic kasatha fleet who senses disturbances in the Drift as physical pain. She travels to understand the Cataclysm that shattered her people\'s star charts.',
  notes: 'Carries a mindlink crystal and communicates with the Akashic Record during long jumps.'
});

create('people', {
  name: 'Drex-9',
  race: 'Android',
  class: 'Mechanic',
  level: '4',
  affiliation: 'Starfinder Society',
  description: 'A fourth-generation android mechanic whose drone companion, TICK, operates as both recon unit and bomb disposal specialist. Drex-9 speaks in precise, clipped sentences.',
  notes: 'Attached to Absalom Station Chapter House. Specializes in Drift engine repair.'
});

create('people', {
  name: 'Governor Maren Solus',
  race: 'Human',
  class: 'Envoy',
  level: '8',
  affiliation: 'Pact Worlds Council',
  description: 'The governor of the Diaspora colony known as the Glassfield Reach. Solus negotiates with ruthless pragmatism and is suspected of being in contact with the Stellar Cabal.',
  notes: 'Key political figure. Knows more about the Cataclysm than she admits.'
});

create('people', {
  name: 'Krethix the Hollow',
  race: 'Vesk',
  class: 'Soldier',
  level: '10',
  affiliation: 'The Stellar Cabal',
  description: 'An infamous Vesk bounty hunter and enforcer for the Stellar Cabal. Missing his left horn, replaced by a crude metal spike. Feared across three star systems.',
  notes: 'Primary antagonist in Act I. Seeks the Resonance Shard.'
});

// ─── Species ─────────────────────────────────────────────────────────────────
create('species', {
  name: 'Human',
  home_world: 'Golarion (lost)',
  description: 'Adaptable and numerous, humans have spread across the Pact Worlds and beyond since the Gap. Their short lives drive remarkable ambition.',
  traits: 'Bonus feat, +2 to any ability score, skilled (one extra class skill)',
  size: 'Medium',
  type: 'Humanoid (human)',
  notes: 'Most common species in the Pact Worlds.'
});

create('species', {
  name: 'Kasatha',
  home_world: 'Kasath',
  description: 'Four-armed humanoids who migrated from a distant world aboard a generation ship. They maintain strict traditions while adapting to modern life.',
  traits: 'Four arms, desert stride, lifeblood, multi-armed, natural grace',
  size: 'Medium',
  type: 'Humanoid (kasatha)',
  notes: 'Revere their ancestors and the Akashic Record.'
});

create('species', {
  name: 'Vesk',
  home_world: 'Vesk Prime',
  description: 'Reptilian warriors from a militaristic empire that once warred with the Pact Worlds. Now uneasy allies, vesk serve as soldiers, mercenaries, and enforcers.',
  traits: 'Armor savant, fearless, low-light vision, natural weapons, sociable',
  size: 'Medium',
  type: 'Humanoid (vesk)',
  notes: 'The Veskarium remains a separate power aligned with the Pact Worlds.'
});

create('species', {
  name: 'Android',
  home_world: 'Absalom Station',
  description: 'Constructed beings with biological and synthetic components, androids possess full sentience. They were built by an unknown process rediscovered after the Gap.',
  traits: 'Constructed, exceptional vision, flat affect, upgrade slot, +2 DEX +2 INT -2 CHA',
  size: 'Medium',
  type: 'Humanoid (android)',
  notes: 'Have legal personhood in the Pact Worlds.'
});

create('species', {
  name: 'Shirren',
  home_world: 'The Swarm homeworld (destroyed)',
  description: 'Insectile humanoids who broke free of the Swarm hive mind. They value individuality fiercely, having won it through terrible sacrifice.',
  traits: 'Blindsense (vibration), communalism, cultural fascination, limited telepathy, +2 CON +2 WIS -2 CHA',
  size: 'Medium',
  type: 'Humanoid (shirren)',
  notes: 'Shirren gain rerolls when near allies due to Communalism trait.'
});

// ─── Parties ─────────────────────────────────────────────────────────────────
create('parties', {
  name: 'The Drift Seekers',
  description: 'A mixed crew of explorers and investigators united by a shared vision of a rift forming in the Drift. Their ship, the Pale Comet, carries them across the Pact Worlds in search of answers.',
  members: 'Riven Ashcroft, Sylara Voss, Drex-9, Kessa Orlen (Navigator)',
  home_base: 'Absalom Station, Docking Bay 12-C',
  notes: 'Current player characters. Hired by the Starfinder Society to investigate Drift anomalies.'
});

create('parties', {
  name: 'Red Horizon Company',
  description: 'A mercenary outfit operating out of Akiton. Rivals to the Drift Seekers who have taken contracts on the same targets more than once.',
  members: 'Vorak, Slim Jana, The Physician',
  home_base: 'Madelon\'s Landing, Akiton',
  notes: 'Antagonistic NPC party. May become allies if interests align.'
});

// ─── Factions ─────────────────────────────────────────────────────────────────
create('factions', {
  name: 'Starfinder Society',
  alignment: 'Neutral Good',
  description: 'An organization of explorers, archaeologists, and scholars dedicated to recovering lost knowledge from before and after the Gap. Operates out of Absalom Station.',
  goals: 'Recover pre-Gap artifacts, map the Drift, establish first contact with new species, preserve history',
  headquarters: 'Absalom Station, Lorespire Complex',
  leader: 'Venture-Captain Arvin Solaro',
  notes: 'Main employer of the party. Reliable if cautious ally.'
});

create('factions', {
  name: 'The Iron Vanguard',
  alignment: 'Lawful Neutral',
  description: 'A paramilitary organization that operates throughout the Pact Worlds as a security force and mercenary unit. Maintains strict codes of conduct and loyalty.',
  goals: 'Protect Pact World citizens, maintain order, profit from conflict',
  headquarters: 'Verces, Iron Ring Station',
  leader: 'Marshal Hela Dorn',
  notes: 'Riven Ashcroft\'s former unit. Generally trustworthy but politically inconvenient.'
});

create('factions', {
  name: 'The Stellar Cabal',
  alignment: 'Neutral Evil',
  description: 'A secretive order that believes the Gap was caused deliberately and seeks to control the force that created it. Recruits from all species and walks of life.',
  goals: 'Understand and weaponize the Cataclysm event, control the Drift, eliminate witnesses',
  headquarters: 'Unknown — suspected Drift station',
  leader: 'The Architrave (identity unknown)',
  notes: 'Primary antagonist faction. Seeks the Resonance Shards to re-trigger the Cataclysm.'
});

create('factions', {
  name: 'Pact Worlds Council',
  alignment: 'Lawful Neutral',
  description: 'The governing body of the Pact Worlds, composed of representatives from each member world and Absalom Station. Slow to act but holds considerable military power.',
  goals: 'Maintain peace among Pact Worlds, counter external threats, manage diplomatic relations with the Veskarium',
  headquarters: 'Absalom Station, Council Chambers',
  leader: 'High Councilor Yvaras (android)',
  notes: 'Official government. Aware of the Cataclysm threat but politically paralyzed.'
});

// ─── Weapons ─────────────────────────────────────────────────────────────────
create('weapons', {
  name: 'Azimuth Laser Pistol',
  type: 'Small Arms (Energy – Fire)',
  level: '1',
  damage: '1d4 F',
  critical: 'Burn 1d4',
  range: '30 ft.',
  capacity: '20 charges',
  usage: '1',
  bulk: 'L',
  special: '—',
  price: '350 credits',
  description: 'The standard-issue sidearm found throughout the Pact Worlds. Reliable, easy to maintain, and cheap to recharge.'
});

create('weapons', {
  name: 'Photon Reaper',
  type: 'Heavy Weapons (Energy – Fire & Force)',
  level: '10',
  damage: '3d8 F & E',
  critical: 'Wound',
  range: '60 ft.',
  capacity: '40 charges',
  usage: '4',
  bulk: '2',
  special: 'Penetrating',
  price: '18,200 credits',
  description: 'A high-output photonic discharger favored by Iron Vanguard heavy soldiers. The twin emitter array produces overlapping fire and force beams.'
});

create('weapons', {
  name: 'Tactical Spear',
  type: 'Advanced Melee (Piercing)',
  level: '1',
  damage: '1d6 P',
  critical: '—',
  range: '—',
  capacity: '—',
  usage: '—',
  bulk: '1',
  special: 'Analog',
  price: '275 credits',
  description: 'A modern take on the ancient spear. Collapsed for easy storage, extended for combat. Popular with kasatha warriors who appreciate its balance across four hands.'
});

create('weapons', {
  name: 'Incendiary Grenade II',
  type: 'Grenade (Fire)',
  level: '6',
  damage: '1d6 F (1d6 F ongoing)',
  critical: '—',
  range: '20 ft.',
  capacity: 'Drawn',
  usage: '—',
  bulk: 'L',
  special: 'Explode (10 ft., 1d6 F, DC 14)',
  price: '685 credits',
  description: 'Military-grade incendiary grenade that spreads burning thermite gel on detonation. Highly effective against unshielded infantry and vehicle tires.'
});

// ─── Starships ───────────────────────────────────────────────────────────────
create('starships', {
  name: 'Pale Comet',
  model: 'Ringworks Wanderer (modified)',
  size: 'Small',
  speed: '10',
  maneuverability: 'Good (turn 1)',
  shields: 'Light Shields 60 (forward 15, port 15, starboard 15, aft 15)',
  hull_points: '35 (DT —; CT 7)',
  crew: 'Captain, Pilot, Engineer, Gunner/Science Officer',
  weapons: 'Forward: Light Laser Cannon; Aft: Light Torpedo Launcher',
  affiliation: 'The Drift Seekers',
  description: 'The Drift Seekers\' vessel. A heavily modified survey frigate with upgraded Drift engines and expanded cargo hold for archaeological equipment.',
  notes: 'Tier 3. Has a Tier 1 Drift engine. Drex-9\'s workshop takes up half the engineering bay.'
});

create('starships', {
  name: 'Obsidian Fang',
  model: 'Vindicas Tyrant (Vesk warship)',
  size: 'Medium',
  speed: '8',
  maneuverability: 'Average (turn 2)',
  shields: 'Medium Shields 120 (forward 40, port 25, starboard 25, aft 30)',
  hull_points: '85 (DT —; CT 17)',
  crew: 'Captain, Pilot, 2 Gunners, Engineer, Science Officer',
  weapons: 'Forward: Heavy Laser Array; Port/Starboard: Light Particle Beams; Aft: Gyrolaser',
  affiliation: 'The Stellar Cabal',
  description: 'Krethix the Hollow\'s command vessel. A repainted Vesk military frigate with cabal sigils etched into the hull plating.',
  notes: 'Tier 8. Players should avoid direct combat with this ship until late game.'
});

create('starships', {
  name: 'Sunspire Station',
  model: 'Custom Station (Absalom design)',
  size: 'Colossal',
  speed: '—',
  maneuverability: 'Clumsy (immobile)',
  shields: 'Heavy Shields 400 (100 per arc)',
  hull_points: '300 (DT 15; CT 60)',
  crew: 'Several thousand permanent crew and civilians',
  weapons: 'Multiple Linked Coilguns; Point Defense Systems',
  affiliation: 'Pact Worlds Council',
  description: 'A refueling and resupply station at the edge of the Drift approach corridor near Absalom. Acts as the last safe harbor before long Drift jumps.',
  notes: 'Tier 20 station. Not intended for combat. Used as a base of operations hub.'
});

// ─── Armors ──────────────────────────────────────────────────────────────────
create('armors', {
  name: 'Iridishell, Basic',
  type: 'Light Armor',
  level: '2',
  eac_bonus: '+3',
  kac_bonus: '+4',
  max_dex: '+4',
  armor_check_penalty: '0',
  speed_adjustment: '—',
  upgrade_slots: '1',
  bulk: 'L',
  price: '755 credits',
  description: 'Lightweight chitin-composite plating based on shirren carapace biology. Popular with scouts and envoys who need protection without sacrificing mobility.'
});

create('armors', {
  name: 'Lashunta Ringwear II',
  type: 'Light Armor',
  level: '5',
  eac_bonus: '+5',
  kac_bonus: '+7',
  max_dex: '+4',
  armor_check_penalty: '0',
  speed_adjustment: '—',
  upgrade_slots: '2',
  bulk: 'L',
  price: '2,980 credits',
  description: 'Elegant interlocking energy-deflecting rings developed by lashunta military engineers. Favored by operatives for its light weight and respectable protection.'
});

create('armors', {
  name: 'Vesk Overplate I',
  type: 'Heavy Armor',
  level: '1',
  eac_bonus: '+3',
  kac_bonus: '+6',
  max_dex: '+1',
  armor_check_penalty: '-3',
  speed_adjustment: '-5 ft.',
  upgrade_slots: '0',
  bulk: '3',
  price: '250 credits',
  description: 'Thick slabs of carbon-ceramic plating designed to fit vesk physiology. Restricts movement significantly but can stop most small arms fire at low levels.'
});

create('armors', {
  name: 'Defiance Series Hardsuit',
  type: 'Heavy Armor',
  level: '9',
  eac_bonus: '+14',
  kac_bonus: '+16',
  max_dex: '+3',
  armor_check_penalty: '-3',
  speed_adjustment: '—',
  upgrade_slots: '4',
  bulk: '3',
  price: '13,300 credits',
  description: 'Full-body hardsuit with powered assist servos that offset movement penalties. Standard heavy kit for Iron Vanguard line infantry.'
});

// ─── Timeline ─────────────────────────────────────────────────────────────────
create('timeline', {
  year: '-10000',
  era: 'Pre-Gap',
  title: 'The Age of Exploration Begins',
  description: 'Golarion\'s greatest empires establish the first spelljamming routes through the solar system. Trade and conflict expand across the planets.',
  significance: 'High',
  notes: 'Most records from this period were lost in the Gap.'
});

create('timeline', {
  year: '0',
  era: 'The Gap',
  title: 'The Gap Begins',
  description: 'All records and memories of an unspecified number of years simply cease to exist. No one knows what happened, how long it lasted, or why.',
  significance: 'Critical',
  notes: 'The central mystery of the Starfinder setting. The Cataclysm may be connected.'
});

create('timeline', {
  year: '1',
  era: 'Post-Gap (AG)',
  title: 'The Gap Ends — The Pact Worlds Awaken',
  description: 'Sentient beings across the solar system wake with no memory of the intervening years. Golarion is gone from its orbit, replaced by the Pact Worlds configuration.',
  significance: 'Critical',
  notes: 'Year 1 AG (After Gap). Absalom Station exists without explanation at the solar center.'
});

create('timeline', {
  year: '12',
  era: 'Post-Gap',
  title: 'The Pact of Absalom Ratified',
  description: 'The surviving worlds form the Pact Worlds alliance. Absalom Station becomes a neutral ground and seat of the Pact Worlds Council.',
  significance: 'High',
  notes: 'Established legal framework that governs most of the campaign\'s political backdrop.'
});

create('timeline', {
  year: '150',
  era: 'Post-Gap',
  title: 'The Drift Discovered',
  description: 'Triune, the newly emerged god of the Drift, gifts the Drift engine to all sapient races simultaneously. Interstellar travel becomes accessible within decades.',
  significance: 'Critical',
  notes: 'Changed everything. Enabled the current political landscape.'
});

create('timeline', {
  year: '280',
  era: 'Post-Gap',
  title: 'The Veskarium War',
  description: 'The Vesk empire launches a massive invasion of the Pact Worlds. Years of brutal war end in an uneasy truce when both sides face a larger external threat from the Swarm.',
  significance: 'High',
  notes: 'Explains current vesk-pact relations and military infrastructure.'
});

create('timeline', {
  year: '295',
  era: 'Post-Gap',
  title: 'The Swarm Invasion',
  description: 'The insectile Swarm attacks the outer systems. The Pact Worlds and Veskarium ally to drive them back, at tremendous cost.',
  significance: 'High',
  notes: 'Led to the Shirren exodus from the Swarm and the founding of the Starfinder Society.'
});

create('timeline', {
  year: '310',
  era: 'Post-Gap (Campaign Present)',
  title: 'The Cataclysm Rift Event',
  description: 'An unexplained gravitational anomaly tears through three Drift lanes simultaneously. Seven ships are lost. The Stellar Cabal emerges from the shadows, and the Resonance Shards are detected for the first time.',
  significance: 'Critical',
  notes: 'Campaign starting event. The party was present near Absalom Station when this occurred.'
});

create('timeline', {
  year: '310',
  era: 'Post-Gap (Campaign Present)',
  title: 'Session 1 — First Contact',
  description: 'The Drift Seekers are hired by Venture-Captain Solaro to investigate the Cataclysm Rift. They depart Absalom Station and make first contact with a damaged Stellar Cabal scout ship.',
  significance: 'Medium',
  notes: 'Players recovered a partial star map from the wreck pointing toward the Glassfield Reach.'
});

console.log('Database seeded successfully.');
