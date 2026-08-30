'use strict';

const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const sections = db.getAll('loreSections');
  res.json(db.getAll('loreDocuments').map(document => ({
    ...document,
    section_count: sections.filter(section => section.document_id === document.id).length
  })));
});

router.get('/:id', (req, res) => {
  const document = db.getById('loreDocuments', req.params.id);
  if (!document) return res.status(404).json({ error: 'Lore document not found' });
  const sections = db.getAll('loreSections')
    .filter(section => section.document_id === document.id)
    .sort((a, b) => a.position - b.position);
  res.json({ ...document, sections });
});

module.exports = router;
