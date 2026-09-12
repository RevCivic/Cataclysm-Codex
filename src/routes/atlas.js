'use strict';

const express = require('express');
const db = require('../database');

const router = express.Router();

function compareOrbit(a, b) {
  return (Number(a.orbital_position) || Number.MAX_SAFE_INTEGER) -
    (Number(b.orbital_position) || Number.MAX_SAFE_INTEGER) ||
    String(a.orbital_position).localeCompare(String(b.orbital_position));
}

router.get('/systems', async (req, res, next) => {
  try {
    const worlds = await db.getAll('worlds');
    const systems = await db.getAll('starSystems');
    const result = systems.map(system => ({
      ...system,
      world_count: worlds.filter(world => world.star_system_id === system.id).length
    }));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/systems/:id', async (req, res, next) => {
  try {
    const system = await db.getById('starSystems', req.params.id);
    if (!system) return res.status(404).json({ error: 'Star system not found' });
    const worlds = await db.getAll('worlds');
    const filtered = worlds.filter(world => world.system_id === system.id).sort(compareOrbit);
    res.json({ ...system, worlds: filtered });
  } catch (error) {
    next(error);
  }
});

router.get('/planet-classes', async (req, res, next) => {
  try {
    const records = await db.getAll('planetClasses');
    res.json(records);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
