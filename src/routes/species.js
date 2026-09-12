'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database');

const COLLECTION = 'species';
const FIELDS = [
  'name', 'home_world', 'description', 'traits', 'attribute_bonuses', 'size', 'type',
  'background', 'sociology', 'physiology', 'notes', 'atmosphere', 'sexes',
  'hours_of_sleep', 'days_without_food', 'days_without_water', 'ruleset',
  'content_origin', 'approval_status', 'extensions'
];

function speciesData(body) {
  return Object.fromEntries(FIELDS.map(field => [field, body[field]]));
}

router.get('/', async (req, res, next) => {
  try {
    const records = await db.getAll(COLLECTION);
    res.json(records);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const record = await db.getById(COLLECTION, req.params.id);
    if (!record) return res.status(404).json({ error: 'Species not found' });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const record = await db.create(COLLECTION, speciesData(req.body));
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await db.getById(COLLECTION, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Species not found' });
    const record = await db.update(COLLECTION, req.params.id, speciesData(req.body));
    res.json(record);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const record = await db.remove(COLLECTION, req.params.id);
    if (!record) return res.status(404).json({ error: 'Species not found' });
    res.json({ message: 'Deleted', record });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
