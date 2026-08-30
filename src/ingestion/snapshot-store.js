'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { EnvHttpProxyAgent } = require('undici');
const { exportUrl } = require('./source-registry');

const DEFAULT_ROOT = path.join(__dirname, '..', '..', 'data', 'source-snapshots');

function snapshotRoot() {
  return process.env.SOURCE_SNAPSHOT_PATH || DEFAULT_ROOT;
}

async function writeExclusive(filePath, contents) {
  try {
    await fs.writeFile(filePath, contents, { flag: 'wx' });
    return true;
  } catch (error) {
    if (error.code === 'EEXIST') return false;
    throw error;
  }
}

async function fetchSnapshot(source, options = {}) {
  const fetchImpl = options.fetchImpl || global.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');

  const url = exportUrl(source);
  const useEnvironmentProxy = fetchImpl === global.fetch && (
    process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy
  );
  const dispatcher = useEnvironmentProxy ? new EnvHttpProxyAgent() : null;
  let response;
  let bytes;
  try {
    response = await fetchImpl(url, { redirect: 'follow', ...(dispatcher ? { dispatcher } : {}) });
    if (!response.ok) throw new Error(`Unable to fetch ${source.id}: HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
  } finally {
    if (dispatcher) await dispatcher.close();
  }
  if (bytes.length === 0) throw new Error(`Unable to fetch ${source.id}: empty response`);

  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const directory = path.join(options.root || snapshotRoot(), source.id, sha256);
  const dataFile = path.join(directory, `source.${source.format}`);
  const manifestFile = path.join(directory, 'manifest.json');
  await fs.mkdir(directory, { recursive: true });

  const created = await writeExclusive(dataFile, bytes);
  const manifest = {
    schemaVersion: 1,
    sourceId: source.id,
    googleFileId: source.googleFileId,
    kind: source.kind,
    format: source.format,
    parser: source.parser,
    sha256,
    byteLength: bytes.length,
    contentType: response.headers.get('content-type'),
    etag: response.headers.get('etag'),
    fetchedAt: new Date().toISOString()
  };

  if (created) await writeExclusive(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  else Object.assign(manifest, JSON.parse(await fs.readFile(manifestFile, 'utf8')));

  return { created, directory, dataFile, manifestFile, manifest };
}

async function listSnapshots(source, options = {}) {
  const sourceDirectory = path.join(options.root || snapshotRoot(), source.id);
  let entries;
  try {
    entries = await fs.readdir(sourceDirectory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const snapshots = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[a-f0-9]{64}$/.test(entry.name)) continue;
    const directory = path.join(sourceDirectory, entry.name);
    try {
      const manifest = JSON.parse(await fs.readFile(path.join(directory, 'manifest.json'), 'utf8'));
      snapshots.push({
        directory,
        dataFile: path.join(directory, `source.${source.format}`),
        manifestFile: path.join(directory, 'manifest.json'),
        manifest
      });
    } catch (error) {
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    }
  }
  return snapshots.sort((a, b) => b.manifest.fetchedAt.localeCompare(a.manifest.fetchedAt));
}

async function latestSnapshot(source, options = {}) {
  return (await listSnapshots(source, options))[0] || null;
}

module.exports = { fetchSnapshot, latestSnapshot, listSnapshots, snapshotRoot };
