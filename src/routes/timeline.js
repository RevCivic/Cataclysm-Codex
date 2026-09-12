'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database');

const COLLECTION = 'timeline';

router.get('/', async (req, res, next) => {
  try {
    const records = await db.getAll(COLLECTION);
    const events = records.sort((a, b) => {
      const yearA = parseInt(a.year) || 0;
      const yearB = parseInt(b.year) || 0;
      return yearA - yearB;
    });
    res.json(events);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const record = await db.getById(COLLECTION, req.params.id);
    if (!record) return res.status(404).json({ error: 'Event not found' });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { year, era, title, description, significance, notes } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const record = await db.create(COLLECTION, { year, era, title, description, significance, notes });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await db.getById(COLLECTION, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Event not found' });
    const { year, era, title, description, significance, notes } = req.body;
    const record = await db.update(COLLECTION, req.params.id, { year, era, title, description, significance, notes });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const record = await db.remove(COLLECTION, req.params.id);
    if (!record) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Deleted', record });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
