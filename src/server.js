'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiter: max 300 requests per minute per IP (covers all routes including SPA fallback)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use(cors());
app.use(globalLimiter);
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/people', require('./routes/people'));
app.use('/api/species', require('./routes/species'));
app.use('/api/parties', require('./routes/parties'));
app.use('/api/factions', require('./routes/factions'));
app.use('/api/weapons', require('./routes/weapons'));
app.use('/api/starships', require('./routes/starships'));
app.use('/api/armors', require('./routes/armors'));
app.use('/api/timeline', require('./routes/timeline'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Cataclysm Codex', version: '1.0.0' });
});

// Serve frontend for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Only auto-listen when run directly (not when required in tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Cataclysm Codex running on http://localhost:${PORT}`);
  });
}

module.exports = app;
