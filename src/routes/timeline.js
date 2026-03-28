'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database');

const COLLECTION = 'timeline';

router.get('/', (req, res) => {
  const events = db.getAll(COLLECTION).sort((a, b) => {
    const yearA = parseInt(a.year) || 0;
    const yearB = parseInt(b.year) || 0;
    return yearA - yearB;
  });
  res.json(events);
});

router.get('/:id', (req, res) => {
  const record = db.getById(COLLECTION, req.params.id);
  if (!record) return res.status(404).json({ error: 'Event not found' });
  res.json(record);
});

router.post('/', (req, res) => {
  const { year, era, title, description, significance, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const record = db.create(COLLECTION, { year, era, title, description, significance, notes });
  res.status(201).json(record);
});

router.put('/:id', (req, res) => {
  const existing = db.getById(COLLECTION, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });
  const { year, era, title, description, significance, notes } = req.body;
  const record = db.update(COLLECTION, req.params.id, { year, era, title, description, significance, notes });
  res.json(record);
});

router.delete('/:id', (req, res) => {
  const record = db.remove(COLLECTION, req.params.id);
  if (!record) return res.status(404).json({ error: 'Event not found' });
  res.json({ message: 'Deleted', record });
});

module.exports = router;
