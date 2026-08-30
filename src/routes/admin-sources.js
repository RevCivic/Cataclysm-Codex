'use strict';

const express = require('express');
const { getSource, listSources } = require('../ingestion/source-registry');
const { fetchSnapshot, latestSnapshot } = require('../ingestion/snapshot-store');
const { parseSourceSnapshot, supportsParser } = require('../ingestion/parser-registry');
const { applyImport, previewImport } = require('../ingestion/import-service');
const database = require('../database');

const router = express.Router();

function requireAdmin(req, res, next) {
  const configuredToken = process.env.ADMIN_TOKEN;
  if (!configuredToken && process.env.NODE_ENV === 'production') {
    return res.status(503).json({ error: 'Admin imports are disabled until ADMIN_TOKEN is configured' });
  }
  if (configuredToken) {
    const suppliedToken = req.get('x-admin-token') || (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (suppliedToken !== configuredToken) return res.status(401).json({ error: 'Invalid admin token' });
  }
  next();
}

function sourceForRequest(req, res) {
  try {
    return getSource(req.params.id);
  } catch {
    res.status(404).json({ error: 'Unknown source' });
    return null;
  }
}

router.use(requireAdmin);

router.get('/runs', (req, res) => {
  const runs = [...database.getAll('importRuns')]
    .sort((a, b) => String(b.completed_at || b.started_at).localeCompare(String(a.completed_at || a.started_at)))
    .slice(0, 25);
  res.json(runs);
});

router.get('/', async (req, res, next) => {
  try {
    const results = await Promise.all(listSources().map(async source => {
      const snapshot = await latestSnapshot(source);
      return {
        id: source.id,
        kind: source.kind,
        format: source.format,
        parser: source.parser,
        expectedTabs: source.expectedTabs,
        canPreview: supportsParser(source.parser),
        canApply: supportsParser(source.parser),
        latestSnapshot: snapshot ? snapshot.manifest : null
      };
    }));
    res.json(results);
  } catch (error) { next(error); }
});

router.post('/:id/fetch', async (req, res, next) => {
  const source = sourceForRequest(req, res);
  if (!source) return;
  try {
    const snapshot = await fetchSnapshot(source);
    res.status(snapshot.created ? 201 : 200).json({ created: snapshot.created, snapshot: snapshot.manifest });
  } catch (error) { next(error); }
});

router.get('/:id/preview', async (req, res, next) => {
  const source = sourceForRequest(req, res);
  if (!source) return;
  try {
    const snapshot = await latestSnapshot(source);
    if (!snapshot) return res.status(409).json({ error: 'Fetch this source before previewing it' });
    const parsed = await parseSourceSnapshot(source, snapshot);
    res.json({ snapshot: snapshot.manifest, preview: previewImport(parsed, source.id) });
  } catch (error) {
    if (/Preview is not implemented/.test(error.message)) return res.status(422).json({ error: error.message });
    next(error);
  }
});

router.post('/:id/apply', async (req, res, next) => {
  const source = sourceForRequest(req, res);
  if (!source) return;
  try {
    const snapshot = await latestSnapshot(source);
    if (!snapshot) return res.status(409).json({ error: 'Fetch this source before applying it' });
    if (req.body.snapshotSha256 !== snapshot.manifest.sha256) {
      return res.status(409).json({ error: 'Preview is stale; preview the latest snapshot before applying it' });
    }
    const parsed = await parseSourceSnapshot(source, snapshot);
    const preview = previewImport(parsed, source.id);
    if (preview.issues.some(issue => issue.severity === 'error')) {
      return res.status(422).json({ error: 'Import has blocking validation issues', preview });
    }
    res.json({ run: applyImport(parsed, source, snapshot) });
  } catch (error) {
    if (/Preview is not implemented/.test(error.message)) return res.status(422).json({ error: error.message });
    next(error);
  }
});

module.exports = router;
