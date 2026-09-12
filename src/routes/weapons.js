'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database');

const COLLECTION = 'weapons';

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
    if (!record) return res.status(404).json({ error: 'Weapon not found' });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, type, level, damage, critical, range, capacity, usage, bulk, special, price, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const record = await db.create(COLLECTION, { name, type, level, damage, critical, range, capacity, usage, bulk, special, price, description });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await db.getById(COLLECTION, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Weapon not found' });
    const { name, type, level, damage, critical, range, capacity, usage, bulk, special, price, description } = req.body;
    const record = await db.update(COLLECTION, req.params.id, { name, type, level, damage, critical, range, capacity, usage, bulk, special, price, description });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const record = await db.remove(COLLECTION, req.params.id);
    if (!record) return res.status(404).json({ error: 'Weapon not found' });
    res.json({ message: 'Deleted', record });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
