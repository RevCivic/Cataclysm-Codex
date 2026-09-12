'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const { IMAGES_PATH } = require('../ingestion/image-service');

const router = express.Router();

/**
 * GET /api/images/:filename
 * Serve stored images (with caching headers)
 */
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  
  // Validate filename to prevent path traversal
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  const filepath = path.join(IMAGES_PATH, filename);
  
  // Verify the file exists within IMAGES_PATH
  if (!filepath.startsWith(IMAGES_PATH)) {
    return res.status(400).json({ error: 'Invalid file path' });
  }
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  
  // Set cache headers - images are immutable by hash
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.set('ETag', `"${filename}"`);
  
  // Serve the file
  res.sendFile(filepath);
});

module.exports = router;
