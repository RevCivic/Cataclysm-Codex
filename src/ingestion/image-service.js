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
 * Find the index of an image column in a header row
 * @param {string[]} headers - Array of header names
 * @returns {number} - Index of the image column, or -1 if not found
 */
function findImageColumnIndex(headers) {
  const imageColumnNames = ['image', 'portrait', 'picture', 'photo'];
  return headers.findIndex(h => {
    if (!h || typeof h !== 'string') return false;
    return imageColumnNames.some(name => h.toLowerCase().includes(name.toLowerCase()));
  });
}

/**
 * Extracts image URL from various cell formats (hyperlinks, text, formulas)
 */
function extractImageUrl(cellValue) {
  if (!cellValue) return null;
  
  // Handle ExcelJS hyperlink objects
  if (typeof cellValue === 'object' && cellValue.hyperlink !== undefined) {
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
 * @param {string} url - The image URL
 * @returns {string|null} - Filename with hash and extension, or null if URL is invalid
 */
function filenameForUrl(url) {
  if (!url) return null;
  const hash = crypto.createHash('sha256').update(url).digest('hex');
  
  try {
    const urlObj = new URL(url);
    const ext = path.extname(urlObj.pathname) || '.jpg';
    return `${hash}${ext}`;
  } catch (err) {
    // If URL parsing fails, return hash with default extension
    return `${hash}.jpg`;
  }
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
  findImageColumnIndex,
  extractImageUrl,
  filenameForUrl,
  createImageRef,
  getImagePath,
  getImageUrl,
  IMAGES_PATH
};
