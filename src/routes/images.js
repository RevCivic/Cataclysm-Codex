'use strict';

const express = require('express');
const path = require('path');
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
  
  // Ensure IMAGES_PATH is absolute
  const absoluteImagesPath = path.resolve(IMAGES_PATH);
  const filepath = path.resolve(path.join(absoluteImagesPath, filename));
  
  // Verify the resolved path is within IMAGES_PATH to prevent directory traversal
  if (!filepath.startsWith(absoluteImagesPath + path.sep)) {
    return res.status(400).json({ error: 'Invalid file path' });
  }
  
  // Set cache headers - images are immutable by hash
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.set('ETag', `"${filename}"`);
  
  // Serve the file (filepath is already absolute from path.resolve)
  // Use callback to handle missing files and avoid TOCTOU race condition
  res.sendFile(filepath, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ error: 'Image not found' });
    }
  });
});

module.exports = router;
