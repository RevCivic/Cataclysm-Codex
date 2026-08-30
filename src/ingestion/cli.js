#!/usr/bin/env node
'use strict';

const { getSource, listSources } = require('./source-registry');
const { fetchSnapshot } = require('./snapshot-store');
const { parseSourceSnapshot } = require('./parser-registry');

function usage() {
  console.log(`Usage:
  npm run sources:list
  npm run sources:fetch -- <source-id> [source-id ...]
  npm run sources:inspect -- <source-id> <path-to-export>

Fetching writes immutable, checksummed exports beneath SOURCE_SNAPSHOT_PATH (default:
data/source-snapshots). It does not modify domain data.`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'list') {
    for (const source of listSources()) console.log(`${source.id}\t${source.kind}\t${source.parser}`);
    return;
  }
  if (command === 'fetch') {
    if (args.length === 0) throw new Error('Provide at least one source id; refusing to fetch every source implicitly');
    for (const id of args) {
      const result = await fetchSnapshot(getSource(id));
      console.log(`${id}: ${result.created ? 'created' : 'reused'} ${result.manifest.sha256} (${result.manifest.byteLength} bytes)`);
    }
    return;
  }
  if (command === 'inspect' && args[0] && args[1]) {
    const source = getSource(args[0]);
    const result = await parseSourceSnapshot(source, { dataFile: args[1] });
    console.log(JSON.stringify({
      parser: result.parser,
      collections: Object.fromEntries(Object.entries(result.collections || {}).map(([name, records]) => [name, records.length])),
      aliases: (result.aliases || []).length,
      issues: result.issues
    }, null, 2));
    return;
  }
  usage();
  if (command) process.exitCode = 1;
}

main().catch(error => {
  console.error(error.cause ? `${error.message}: ${error.cause.message}` : error.message);
  process.exitCode = 1;
});
