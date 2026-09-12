'use strict';

const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const sections = await db.getAll('loreSections');
    const documents = await db.getAll('loreDocuments');
    const result = documents.map(document => ({
      ...document,
      section_count: sections.filter(section => section.document_id === document.id).length
    }));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const document = await db.getById('loreDocuments', req.params.id);
    if (!document) return res.status(404).json({ error: 'Lore document not found' });
    const sections = await db.getAll('loreSections');
    const filtered = sections
      .filter(section => section.document_id === document.id)
      .sort((a, b) => a.position - b.position);
    res.json({ ...document, sections: filtered });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
