'use strict';

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const IMAGES_PATH = process.env.IMAGES_PATH || path.join(__dirname, '..', 'data', 'images');

/**
 * Ensures the images directory exists
 */
function ensureImagesDir() {
  if (!fs.existsSync(IMAGES_PATH)) {
    fs.mkdirSync(IMAGES_PATH, { recursive: true });
  }
}

/**
 * Extracts image URL from various cell formats (hyperlinks, text, formulas)
 */
function extractImageUrl(cellValue) {
  if (!cellValue) return null;
  
  // Handle ExcelJS hyperlink objects
  if (typeof cellValue === 'object' && cellValue.hyperlink) {
    return cellValue.hyperlink || cellValue.text || null;
  }
  
  // Handle plain URLs in text or formulas
  if (typeof cellValue === 'string') {
    const trimmed = cellValue.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
  }
  
  // Handle formula results with hyperlinks
  if (typeof cellValue === 'object' && cellValue.result) {
    return extractImageUrl(cellValue.result);
  }
  
  return null;
}

/**
 * Generates a consistent filename for an image URL
 */
function filenameForUrl(url) {
  if (!url) return null;
  const hash = crypto.createHash('sha256').update(url).digest('hex');
  const urlObj = new URL(url);
  const ext = path.extname(urlObj.pathname) || '.jpg';
  return `${hash}${ext}`;
}

/**
 * Creates a reference object for an image (doesn't actually download)
 * Downloads can be performed asynchronously by the import service
 */
function createImageRef(url, sourceLocator) {
  if (!url) return null;
  
  const filename = filenameForUrl(url);
  return {
    url,
    filename,
    sourceLocator,
    // Reference path for storing in database
    ref: `/api/images/${filename}`,
    // Full filesystem path
    localPath: path.join(IMAGES_PATH, filename)
  };
}

/**
 * Gets the path where an image should be stored
 */
function getImagePath(filename) {
  return path.join(IMAGES_PATH, filename);
}

/**
 * Returns the API URL for an image filename
 */
function getImageUrl(filename) {
  if (!filename) return null;
  return `/api/images/${filename}`;
}

module.exports = {
  ensureImagesDir,
  extractImageUrl,
  filenameForUrl,
  createImageRef,
  getImagePath,
  getImageUrl,
  IMAGES_PATH
};
