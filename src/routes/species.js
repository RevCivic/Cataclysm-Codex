'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database');

const COLLECTION = 'species';

router.get('/', (req, res) => {
  res.json(db.getAll(COLLECTION));
});

router.get('/:id', (req, res) => {
  const record = db.getById(COLLECTION, req.params.id);
  if (!record) return res.status(404).json({ error: 'Species not found' });
  res.json(record);
});

router.post('/', (req, res) => {
  const { name, home_world, description, traits, attribute_bonuses, size, type, background, sociology, physiology, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const record = db.create(COLLECTION, { name, home_world, description, traits, attribute_bonuses, size, type, background, sociology, physiology, notes });
  res.status(201).json(record);
});

router.put('/:id', (req, res) => {
  const existing = db.getById(COLLECTION, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Species not found' });
  const { name, home_world, description, traits, attribute_bonuses, size, type, background, sociology, physiology, notes } = req.body;
  const record = db.update(COLLECTION, req.params.id, { name, home_world, description, traits, attribute_bonuses, size, type, background, sociology, physiology, notes });
  res.json(record);
});

router.delete('/:id', (req, res) => {
  const record = db.remove(COLLECTION, req.params.id);
  if (!record) return res.status(404).json({ error: 'Species not found' });
  res.json({ message: 'Deleted', record });
});

module.exports = router;
