#!/usr/bin/env node
'use strict';

const { DEFAULT_CAMPAIGN_ID, create, pool } = require('./database');
const { initializeDatabase } = require('./database-pool');

async function seed() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    console.log('Seeding Cataclysm Codex database...');

    // ─── People ──────────────────────────────────────────────────────────────────
    await create('people', {
      name: 'Riven Ashcroft',
      race: 'Human',
      class: 'Soldier',
      level: '5',
      affiliation: 'The Iron Vanguard',
      description: 'A grizzled veteran who survived the Drift anomaly near Absalom Station. Riven wears his scars openly and leads with a blunt efficiency that masks a fierce loyalty to his crew.',
      notes: 'Carries a photon reaper and custom heavy armor engraved with the Iron Vanguard crest.'
    });

    await create('people', {
      name: 'Sylara Voss',
      race: 'Kasatha',
      class: 'Mystic',
      level: '5',
      affiliation: 'The Drift Seekers',
      description: 'A four-armed mystic from the nomadic kasatha fleet who senses disturbances in the Drift as physical pain. She travels to understand the Cataclysm that shattered her people\'s star charts.',
      notes: 'Carries a mindlink crystal and communicates with the Akashic Record during long jumps.'
    });

    await create('people', {
      name: 'Drex-9',
      race: 'Android',
      class: 'Mechanic',
      level: '4',
      affiliation: 'Starfinder Society',
      description: 'A fourth-generation android mechanic whose drone companion, TICK, operates as both recon unit and bomb disposal specialist. Drex-9 speaks in precise, clipped sentences.',
      notes: 'Attached to Absalom Station Chapter House. Specializes in Drift engine repair.'
    });

    await create('people', {
      name: 'Governor Maren Solus',
      race: 'Human',
      class: 'Envoy',
      level: '8',
      affiliation: 'Pact Worlds Council',
      description: 'The governor of the Diaspora colony known as the Glassfield Reach. Solus negotiates with ruthless pragmatism and is suspected of being in contact with the Stellar Cabal.',
      notes: 'Key political figure. Knows more about the Cataclysm than she admits.'
    });

    await create('people', {
      name: 'Krethix the Hollow',
      race: 'Vesk',
      class: 'Soldier',
      level: '10',
      affiliation: 'The Stellar Cabal',
      description: 'An infamous Vesk bounty hunter and enforcer for the Stellar Cabal. Missing his left horn, replaced by a crude metal spike. Feared across three star systems.',
      notes: 'Primary antagonist in Act I. Seeks the Resonance Shard.'
    });

    // ─── Species ─────────────────────────────────────────────────────────────────
    await create('species', {
      name: 'Human',
      home_world: 'Golarion (lost)',
      description: 'Adaptable and numerous, humans have spread across the Pact Worlds and beyond since the Gap. Their short lives drive remarkable ambition.',
      traits: 'Bonus feat, +2 to any ability score, skilled (one extra class skill)',
      size: 'Medium',
      type: 'Humanoid (human)',
      background: 'Humans originally hailed from the lost world of Golarion, though their home world\'s disappearance during the Gap remains unexplained. Since then, they have become the most widespread species in the Pact Worlds, settling on nearly every inhabited world and station.',
      sociology: 'Human society is remarkably diverse, with no single cultural tradition dominating. They form governments ranging from democracies to theocracies to corporate oligarchies. Their relatively short lifespans push them toward ambition, rapid adaptation, and a drive to leave a lasting mark.',
      physiology: 'Humans are bipedal mammals averaging 5–6 feet tall and 125–250 pounds. They have two arms, two legs, and are visually indistinguishable from their Golarion ancestors. They require standard atmospheric conditions and are susceptible to environmental extremes without technological aid.',
      notes: 'Most common species in the Pact Worlds.'
    });

    await create('species', {
      name: 'Kasatha',
      home_world: 'Kasath',
      description: 'Four-armed humanoids who migrated from a distant world aboard a generation ship. They maintain strict traditions while adapting to modern life.',
      traits: 'Four arms, desert stride, lifeblood, multi-armed, natural grace',
      size: 'Medium',
      type: 'Humanoid (kasatha)',
      background: 'The kasatha evolved on the arid world of Kasath and traveled to the Pact Worlds aboard a massive generation ship over thousands of years. Their long journey is a defining element of their cultural identity, and they maintain deep reverence for the Akashic Record and their ancestral heritage.',
      sociology: 'Kasatha society is deeply traditional and clan-based. Elders hold tremendous authority, and coming-of-age rituals called the Tempering are viewed as essential to adulthood. Despite being newcomers to the Pact Worlds, kasatha have integrated widely, particularly as warriors, mystics, and advisors.',
      physiology: 'Kasatha are tall, four-armed humanoids with grey skin and large dark eyes adapted to desert starlight. All four arms are fully functional and of equal dexterity. They cannot consume food or drink in the presence of non-kasatha and are biologically adapted to hot, arid environments.',
      notes: 'Revere their ancestors and the Akashic Record.'
    });

    await create('species', {
      name: 'Vesk',
      home_world: 'Vesk Prime',
      description: 'Reptilian warriors from a militaristic empire that once warred with the Pact Worlds. Now uneasy allies, vesk serve as soldiers, mercenaries, and enforcers.',
      traits: 'Armor savant, fearless, low-light vision, natural weapons, sociable',
      size: 'Medium',
      type: 'Humanoid (vesk)',
      background: 'The vesk come from Vesk Prime, capital of the Veskarium—a powerful empire of militaristic reptilian humanoids. They waged war against the Pact Worlds before a mutual threat from the Swarm forced an uneasy alliance. Vesk now live throughout the Pact Worlds, often as soldiers, bodyguards, or mercenaries.',
      sociology: 'Vesk society values martial prowess, honor in combat, and strict loyalty to hierarchy. Military service is expected of most citizens, and weakness is met with contempt. That said, vesk deeply respect those who demonstrate courage regardless of species, and they communicate with blunt, direct honesty.',
      physiology: 'Vesk are large, reptilian humanoids covered in tough overlapping scales that grant natural armor (Armor savant). They stand 6–7 feet tall and are heavily muscled. Their natural weapons include claws, and they possess low-light vision and enhanced olfactory senses. Their physiology grants them immunity to the shaken condition.',
      notes: 'The Veskarium remains a separate power aligned with the Pact Worlds.'
    });

    await create('species', {
      name: 'Android',
      home_world: 'Absalom Station',
      description: 'Constructed beings with biological and synthetic components, androids possess full sentience. They were built by an unknown process rediscovered after the Gap.',
      traits: 'Constructed, exceptional vision, flat affect, upgrade slot',
      size: 'Medium',
      type: 'Humanoid (android)',
      background: 'Androids are constructed beings that emerged after the Gap with no record of their own origin or creators. They have full sentience and legal personhood in the Pact Worlds. Absalom Station is considered their cultural home, though androids are manufactured and found throughout the system.',
      sociology: 'Android culture is heavily shaped by their unique relationship with identity and continuity. Each android generation is considered a new person, making legacy a complex philosophical challenge. Many androids pursue careers in engineering, medicine, or exploration where their precise, analytical nature is an asset.',
      physiology: 'Androids have humanlike physical forms with organic and synthetic components deeply intertwined. Their skin and musculature are biological, but enhanced with embedded circuitry and sub-dermal plating. They experience a muted emotional range (Flat Affect) and can slot technological upgrades directly into their bodies. Their constructed nature grants immunity to many biological afflictions.',
      notes: 'Have legal personhood in the Pact Worlds.'
    });

    await create('species', {
      name: 'Shirren',
      home_world: 'The Swarm homeworld (destroyed)',
      description: 'Insectile humanoids who broke free of the Swarm hive mind. They value individuality fiercely, having won it through terrible sacrifice.',
      traits: 'Blindsense (vibration), communalism, cultural fascination, limited telepathy',
      size: 'Medium',
      type: 'Humanoid (shirren)',
      background: 'The shirren were once part of the Swarm, a terrifying collective consciousness that consumes entire worlds. A portion of the Swarm broke free of the hive mind, achieving individual consciousness at enormous cost. These shirren now exist as their own species and are fiercely protective of their hard-won individuality.',
      sociology: 'Shirren society is built around the sanctity of personal freedom and individual choice, having fought to escape a life of total collectivism. Paradoxically, they work exceptionally well in teams and retain a vestigial attunement to nearby allies (Communalism). They value cultural exchange as a means of defining their own evolving identity.',
      physiology: 'Shirren are insectile humanoids with chitinous exoskeletons, compound eyes, and antennae capable of detecting nearby vibrations (Blindsense 30 ft.). They stand roughly 5–6 feet tall with two legs and four limb-like appendages. They are capable of limited telepathy with willing creatures within 30 feet and communicate clearly across multiple frequencies.',
      notes: 'Shirren gain rerolls when near allies due to Communalism trait.'
    });

    // ─── Factions ─────────────────────────────────────────────────────────────────
    await create('organizations', {
      name: 'The Drift Seekers',
      organization_type: 'party',
      description: 'A mixed crew of explorers and investigators united by a shared vision of a rift forming in the Drift. Their ship, the Pale Comet, carries them across the Pact Worlds in search of answers.',
      goals: 'Investigate Drift anomalies and recover pre-Gap artifacts.',
      headquarters: 'Absalom Station, Docking Bay 12-C',
      notes: 'Current player characters. Hired by the Starfinder Society to investigate Drift anomalies.'
    });

    await create('organizations', {
      name: 'Red Horizon Company',
      organization_type: 'party',
      description: 'A mercenary outfit operating out of Akiton. Rivals to the Drift Seekers who have taken contracts on the same targets more than once.',
      goals: 'Profit from contract work and adventuring.',
      headquarters: 'Madelon\'s Landing, Akiton',
      notes: 'Antagonistic NPC party. May become allies if interests align.'
    });

    await create('organizations', {
      name: 'Starfinder Society',
      organization_type: 'faction',
      alignment: 'Neutral Good',
      description: 'An organization of explorers, archaeologists, and scholars dedicated to recovering lost knowledge from before and after the Gap. Operates out of Absalom Station.',
      goals: 'Recover pre-Gap artifacts, map the Drift, establish first contact with new species, preserve history',
      headquarters: 'Absalom Station, Lorespire Complex',
      leader: 'Venture-Captain Arvin Solaro',
      notes: 'Main employer of the party. Reliable if cautious ally.'
    });

    await create('organizations', {
      name: 'The Iron Vanguard',
      organization_type: 'faction',
      alignment: 'Lawful Neutral',
      description: 'A paramilitary organization that operates throughout the Pact Worlds as a security force and mercenary unit. Maintains strict codes of conduct and loyalty.',
      goals: 'Protect Pact World citizens, maintain order, profit from conflict',
      headquarters: 'Verces, Iron Ring Station',
      leader: 'Marshal Hela Dorn',
      notes: 'Riven Ashcroft\'s former unit. Generally trustworthy but politically inconvenient.'
    });

    await create('organizations', {
      name: 'The Stellar Cabal',
      organization_type: 'faction',
      alignment: 'Neutral Evil',
      description: 'A secretive order that believes the Gap was caused deliberately and seeks to control the force that created it. Recruits from all species and walks of life.',
      goals: 'Understand and weaponize the Cataclysm event, control the Drift, eliminate witnesses',
      headquarters: 'Unknown — suspected Drift station',
      leader: 'The Architrave (identity unknown)',
      notes: 'Primary antagonist faction. Seeks the Resonance Shards to re-trigger the Cataclysm.'
    });

    await create('organizations', {
      name: 'Pact Worlds Council',
      organization_type: 'faction',
      alignment: 'Lawful Neutral',
      description: 'The governing body of the Pact Worlds, composed of representatives from each member world and Absalom Station. Slow to act but holds considerable military power.',
      goals: 'Maintain peace among Pact Worlds, counter external threats, manage diplomatic relations with the Veskarium',
      headquarters: 'Absalom Station, Council Chambers',
      leader: 'High Councilor Yvaras (android)',
      notes: 'Official government. Aware of the Cataclysm threat but politically paralyzed.'
    });

    // ─── Weapons ─────────────────────────────────────────────────────────────────
    await create('items', {
      name: 'Azimuth Laser Pistol',
      item_type: 'weapon',
      damage: '1d4 F',
      range_val: '30 ft.',
      capacity: 20,
      bulk: 'L',
      price: 350,
      description: 'The standard-issue sidearm found throughout the Pact Worlds. Reliable, easy to maintain, and cheap to recharge.'
    });

    await create('items', {
      name: 'Photon Reaper',
      item_type: 'weapon',
      damage: '3d8 F & E',
      range_val: '60 ft.',
      capacity: 40,
      bulk: '2',
      price: 18200,
      description: 'A high-output photonic discharger favored by Iron Vanguard heavy soldiers. The twin emitter array produces overlapping fire and force beams.'
    });

    await create('items', {
      name: 'Tactical Spear',
      item_type: 'weapon',
      damage: '1d6 P',
      bulk: '1',
      price: 275,
      description: 'A modern take on the ancient spear. Collapsed for easy storage, extended for combat. Popular with kasatha warriors who appreciate its balance across four hands.'
    });

    await create('items', {
      name: 'Incendiary Grenade II',
      item_type: 'weapon',
      damage: '1d6 F (1d6 F ongoing)',
      range_val: '20 ft.',
      bulk: 'L',
      price: 685,
      description: 'Military-grade incendiary grenade that spreads burning thermite gel on detonation. Highly effective against unshielded infantry and vehicle tires.'
    });

    // ─── Armors ──────────────────────────────────────────────────────────────────
    await create('items', {
      name: 'Iridishell, Basic',
      item_type: 'armor',
      eac_bonus: 3,
      kac_bonus: 4,
      max_dex: 4,
      upgrade_slots: 1,
      bulk: 'L',
      price: 755,
      description: 'Lightweight chitin-composite plating based on shirren carapace biology. Popular with scouts and envoys who need protection without sacrificing mobility.'
    });

    await create('items', {
      name: 'Lashunta Ringwear II',
      item_type: 'armor',
      eac_bonus: 5,
      kac_bonus: 7,
      max_dex: 4,
      upgrade_slots: 2,
      bulk: 'L',
      price: 2980,
      description: 'Elegant interlocking energy-deflecting rings developed by lashunta military engineers. Favored by operatives for its light weight and respectable protection.'
    });

    await create('items', {
      name: 'Vesk Overplate I',
      item_type: 'armor',
      eac_bonus: 3,
      kac_bonus: 6,
      max_dex: 1,
      upgrade_slots: 0,
      bulk: '3',
      price: 250,
      description: 'Thick slabs of carbon-ceramic plating designed to fit vesk physiology. Restricts movement significantly but can stop most small arms fire at low levels.'
    });

    await create('items', {
      name: 'Defiance Series Hardsuit',
      item_type: 'armor',
      eac_bonus: 14,
      kac_bonus: 16,
      max_dex: 3,
      upgrade_slots: 4,
      bulk: '3',
      price: 13300,
      description: 'Full-body hardsuit with powered assist servos that offset movement penalties. Standard heavy kit for Iron Vanguard line infantry.'
    });

    // ─── Starships ───────────────────────────────────────────────────────────────
    await create('starships', {
      name: 'Pale Comet',
      model: 'Ringworks Wanderer (modified)',
      size: 'Small',
      speed: 10,
      shields: 60,
      hull_points: 35,
      crew_count: 4,
      description: 'The Drift Seekers\' vessel. A heavily modified survey frigate with upgraded Drift engines and expanded cargo hold for archaeological equipment.',
      notes: 'Tier 3. Has a Tier 1 Drift engine. Drex-9\'s workshop takes up half the engineering bay.'
    });

    await create('starships', {
      name: 'Obsidian Fang',
      model: 'Vindicas Tyrant (Vesk warship)',
      size: 'Medium',
      speed: 8,
      shields: 120,
      hull_points: 85,
      crew_count: 6,
      description: 'Krethix the Hollow\'s command vessel. A repainted Vesk military frigate with cabal sigils etched into the hull plating.',
      notes: 'Tier 8. Players should avoid direct combat with this ship until late game.'
    });

    await create('starships', {
      name: 'Sunspire Station',
      model: 'Custom Station (Absalom design)',
      size: 'Colossal',
      shields: 400,
      hull_points: 300,
      crew_count: 1000,
      description: 'A refueling and resupply station at the edge of the Drift approach corridor near Absalom. Acts as the last safe harbor before long Drift jumps.',
      notes: 'Tier 20 station. Not intended for combat. Used as a base of operations hub.'
    });

    // ─── Timeline ─────────────────────────────────────────────────────────────────
    await create('timeline', {
      title: 'The Age of Exploration Begins',
      year: '-10000',
      era: 'Pre-Gap',
      description: 'Golarion\'s greatest empires establish the first spelljamming routes through the solar system. Trade and conflict expand across the planets.',
      significance: 'High',
      notes: 'Most records from this period were lost in the Gap.'
    });

    await create('timeline', {
      title: 'The Gap',
      year: '0',
      era: 'The Gap',
      description: 'All records and memories of an unspecified number of years simply cease to exist. No one knows what happened, how long it lasted, or why.',
      significance: 'Critical',
      notes: 'The central mystery of the Starfinder setting. The Cataclysm may be connected.'
    });

    await create('timeline', {
      title: 'The Awakening',
      year: '1',
      era: 'Post-Gap (AG)',
      description: 'Sentient beings across the solar system wake with no memory of the intervening years. Golarion is gone from its orbit, replaced by the Pact Worlds configuration.',
      significance: 'Critical',
      notes: 'Year 1 AG (After Gap). Absalom Station exists without explanation at the solar center.'
    });

    await create('timeline', {
      title: 'The Pact Worlds Alliance',
      year: '12',
      era: 'Post-Gap',
      description: 'The surviving worlds form the Pact Worlds alliance. Absalom Station becomes a neutral ground and seat of the Pact Worlds Council.',
      significance: 'High',
      notes: 'Established legal framework that governs most of the campaign\'s political backdrop.'
    });

    await create('timeline', {
      title: 'The Gift of the Drift',
      year: '150',
      era: 'Post-Gap',
      description: 'Triune, the newly emerged god of the Drift, gifts the Drift engine to all sapient races simultaneously. Interstellar travel becomes accessible within decades.',
      significance: 'Critical',
      notes: 'Changed everything. Enabled the current political landscape.'
    });

    await create('timeline', {
      title: 'The Vesk Invasion',
      year: '280',
      era: 'Post-Gap',
      description: 'The Vesk empire launches a massive invasion of the Pact Worlds. Years of brutal war end in an uneasy truce when both sides face a larger external threat from the Swarm.',
      significance: 'High',
      notes: 'Explains current vesk-pact relations and military infrastructure.'
    });

    await create('timeline', {
      title: 'The Swarm Attacks',
      year: '295',
      era: 'Post-Gap',
      description: 'The insectile Swarm attacks the outer systems. The Pact Worlds and Veskarium ally to drive them back, at tremendous cost.',
      significance: 'High',
      notes: 'Led to the Shirren exodus from the Swarm and the founding of the Starfinder Society.'
    });

    await create('timeline', {
      title: 'The Cataclysm Rift',
      year: '310',
      era: 'Post-Gap (Campaign Present)',
      description: 'An unexplained gravitational anomaly tears through three Drift lanes simultaneously. Seven ships are lost. The Stellar Cabal emerges from the shadows, and the Resonance Shards are detected for the first time.',
      significance: 'Critical',
      notes: 'Campaign starting event. The party was present near Absalom Station when this occurred.'
    });

    await create('timeline', {
      title: 'The Drift Seekers Depart',
      year: '310',
      era: 'Post-Gap (Campaign Present)',
      description: 'The Drift Seekers are hired by Venture-Captain Solaro to investigate the Cataclysm Rift. They depart Absalom Station and make first contact with a damaged Stellar Cabal scout ship.',
      significance: 'Medium',
      notes: 'Players recovered a partial star map from the wreck pointing toward the Glassfield Reach.'
    });

    console.log('✓ Database seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
