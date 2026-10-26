import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

/** Extracts the quoted entries of the SHELL_FILES array from sw.js. */
function readShellFiles() {
  const source = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  const block = source.match(/const SHELL_FILES = \[([\s\S]*?)\];/);
  assert.ok(block, 'sw.js must declare a SHELL_FILES array');
  return [...block[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

/** Lists every file under a folder, as paths relative to the repository root. */
function listFiles(folder) {
  return readdirSync(join(ROOT, folder), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(ROOT, join(entry.parentPath, entry.name)));
}

test('every shell file listed in sw.js exists on disk', () => {
  // cache.addAll() fails as a whole if a single file is missing.
  const missing = readShellFiles()
    .filter((entry) => entry !== './')
    .map((entry) => entry.split('?')[0])
    .filter((path) => !existsSync(join(ROOT, path)));
  assert.deepEqual(missing, []);
});

test('every script, stylesheet and locale is listed in sw.js', () => {
  const listed = new Set(readShellFiles().map((entry) => entry.split('?')[0]));
  const unlisted = [...listFiles('js'), ...listFiles('css'), ...listFiles('locales')]
    .filter((path) => !listed.has(path));
  assert.deepEqual(unlisted, []);
});

test('icon and manifest entries use the same cache-busting version as index.html', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const versioned = readShellFiles().filter((entry) => entry.includes('?'));
  const missingFromHtml = versioned
    .filter((entry) => entry.startsWith('manifest') || entry.includes('apple-touch-icon'))
    .filter((entry) => !html.includes(`"${entry}"`));
  assert.deepEqual(missingFromHtml, []);
});

test('the cache name includes a version', () => {
  const source = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  assert.match(source, /const CACHE_VERSION = '[^']+';/);
});
