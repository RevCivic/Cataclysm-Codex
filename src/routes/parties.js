'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database');

const COLLECTION = 'parties';

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
    if (!record) return res.status(404).json({ error: 'Party not found' });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description, members, home_base, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const record = await db.create(COLLECTION, { name, description, members, home_base, notes });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await db.getById(COLLECTION, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Party not found' });
    const { name, description, members, home_base, notes } = req.body;
    const record = await db.update(COLLECTION, req.params.id, { name, description, members, home_base, notes });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const record = await db.remove(COLLECTION, req.params.id);
    if (!record) return res.status(404).json({ error: 'Party not found' });
    res.json({ message: 'Deleted', record });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
