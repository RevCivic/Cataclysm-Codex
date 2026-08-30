'use strict';

const express = require('express');
const db = require('../database');

const router = express.Router();

function compareOrbit(a, b) {
  return (Number(a.orbital_position) || Number.MAX_SAFE_INTEGER) -
    (Number(b.orbital_position) || Number.MAX_SAFE_INTEGER) ||
    String(a.orbital_position).localeCompare(String(b.orbital_position));
}

router.get('/systems', (req, res) => {
  const worlds = db.getAll('worlds');
  res.json(db.getAll('starSystems').map(system => ({
    ...system,
    world_count: worlds.filter(world => world.star_system_id === system.id).length
  })));
});

router.get('/systems/:id', (req, res) => {
  const system = db.getById('starSystems', req.params.id);
  if (!system) return res.status(404).json({ error: 'Star system not found' });
  const worlds = db.getAll('worlds').filter(world => world.star_system_id === system.id).sort(compareOrbit);
  res.json({ ...system, worlds });
});

router.get('/planet-classes', (req, res) => res.json(db.getAll('planetClasses')));

module.exports = router;
