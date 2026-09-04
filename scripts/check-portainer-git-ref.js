'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

const branch = process.env.PORTAINER_GIT_BRANCH || 'main';
const reference = `refs/heads/${branch}`;
const repository = process.argv[2] || remoteUrl('origin');

if (!fs.existsSync('docker-compose.yml')) {
  fail('docker-compose.yml was not found at the repository root.');
}

if (!repository) {
  fail([
    'No repository URL was supplied and this checkout has no origin remote.',
    'Run: npm run portainer:check-ref -- https://github.com/OWNER/REPOSITORY.git'
  ].join('\n'));
}

try {
  const result = execFileSync('git', ['ls-remote', '--exit-code', '--heads', repository, reference], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
  const [commit] = result.split(/\s+/);
  console.log(`Found ${reference} at ${commit}.`);
  console.log('Portainer repository reference: ' + reference);
  console.log('Portainer Compose path: docker-compose.yml');
} catch (error) {
  const detail = error.stderr?.trim();
  fail([
    `The remote does not expose ${reference}, or it cannot be read with the current credentials.`,
    detail,
    `Verify with: git ls-remote --heads <repository-url> ${reference}`
  ].filter(Boolean).join('\n'));
}

function remoteUrl(name) {
  try {
    return execFileSync('git', ['remote', 'get-url', name], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return null;
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
