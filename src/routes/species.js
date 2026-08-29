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

router.get('/', (req, res) => {
  res.json(db.getAll(COLLECTION));
});

router.get('/:id', (req, res) => {
  const record = db.getById(COLLECTION, req.params.id);
  if (!record) return res.status(404).json({ error: 'Species not found' });
  res.json(record);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const record = db.create(COLLECTION, speciesData(req.body));
  res.status(201).json(record);
});

router.put('/:id', (req, res) => {
  const existing = db.getById(COLLECTION, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Species not found' });
  const record = db.update(COLLECTION, req.params.id, speciesData(req.body));
  res.json(record);
});

router.delete('/:id', (req, res) => {
  const record = db.remove(COLLECTION, req.params.id);
  if (!record) return res.status(404).json({ error: 'Species not found' });
  res.json({ message: 'Deleted', record });
});

module.exports = router;
