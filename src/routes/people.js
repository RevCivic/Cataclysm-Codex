'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database');

const COLLECTION = 'people';

// GET all people
router.get('/', (req, res) => {
  res.json(db.getAll(COLLECTION));
});

// GET single person
router.get('/:id', (req, res) => {
  const record = db.getById(COLLECTION, req.params.id);
  if (!record) return res.status(404).json({ error: 'Person not found' });
  res.json(record);
});

// POST create person
router.post('/', (req, res) => {
  const { name, race, class: cls, level, affiliation, description, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const record = db.create(COLLECTION, { name, race, class: cls, level, affiliation, description, notes });
  res.status(201).json(record);
});

// PUT update person
router.put('/:id', (req, res) => {
  const existing = db.getById(COLLECTION, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Person not found' });
  const { name, race, class: cls, level, affiliation, description, notes } = req.body;
  const record = db.update(COLLECTION, req.params.id, { name, race, class: cls, level, affiliation, description, notes });
  res.json(record);
});

// DELETE person
router.delete('/:id', (req, res) => {
  const record = db.remove(COLLECTION, req.params.id);
  if (!record) return res.status(404).json({ error: 'Person not found' });
  res.json({ message: 'Deleted', record });
});

module.exports = router;
