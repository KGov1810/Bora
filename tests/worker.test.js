import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/src/index.js';
import { codesMatch } from '../worker/src/auth.js';

const BASE = 'https://bora-api.example.workers.dev';
const APP_ORIGIN = 'https://kgov1810.github.io';
const ENV = { ACCESS_CODE: 'blue-river-tiny-lamp' };

/** Sends a request to the Worker's fetch handler. */
function call(path, { method = 'GET', headers = {}, env = ENV } = {}) {
  return worker.fetch(new Request(`${BASE}${path}`, { method, headers }), env);
}

test('GET /health answers ok without a code', async () => {
  const response = await call('/health');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test('GET /auth/check accepts the right code', async () => {
  const response = await call('/auth/check', { headers: { Authorization: 'Bearer blue-river-tiny-lamp' } });
  assert.equal(response.status, 204);
});

test('GET /auth/check refuses a wrong code', async () => {
  const response = await call('/auth/check', { headers: { Authorization: 'Bearer blue-river-tiny-lam' } });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'invalid_code' });
});

test('GET /auth/check refuses a missing header', async () => {
  const response = await call('/auth/check');
  assert.equal(response.status, 401);
});

test('GET /auth/check refuses a header without Bearer', async () => {
  const response = await call('/auth/check', { headers: { Authorization: 'blue-river-tiny-lamp' } });
  assert.equal(response.status, 401);
});

test('protected routes answer 503 when ACCESS_CODE is not configured', async () => {
  const response = await call('/auth/check', { headers: { Authorization: 'Bearer anything' }, env: {} });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'not_configured' });
});

test('an empty ACCESS_CODE counts as not configured', async () => {
  const response = await call('/auth/check', { headers: { Authorization: 'Bearer ' }, env: { ACCESS_CODE: '' } });
  assert.equal(response.status, 503);
});

test('unknown routes answer 404', async () => {
  const response = await call('/nope');
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'not_found' });
});

test('the app origin gets CORS headers', async () => {
  const response = await call('/health', { headers: { Origin: APP_ORIGIN } });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), APP_ORIGIN);
  assert.equal(response.headers.get('Vary'), 'Origin');
});

test('localhost:8000 gets CORS headers for local testing', async () => {
  const response = await call('/health', { headers: { Origin: 'http://localhost:8000' } });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:8000');
});

test('another origin gets no CORS headers', async () => {
  const response = await call('/health', { headers: { Origin: 'https://evil.example.com' } });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
});

test('error responses also carry CORS headers for the app', async () => {
  const response = await call('/auth/check', { headers: { Origin: APP_ORIGIN } });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), APP_ORIGIN);
});

test('a preflight from the app origin is allowed', async () => {
  const response = await call('/auth/check', {
    method: 'OPTIONS',
    headers: { Origin: APP_ORIGIN, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization' },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), APP_ORIGIN);
  assert.match(response.headers.get('Access-Control-Allow-Headers'), /Authorization/);
  assert.match(response.headers.get('Access-Control-Allow-Methods'), /GET/);
});

test('a preflight from another origin gets no CORS headers', async () => {
  const response = await call('/auth/check', { method: 'OPTIONS', headers: { Origin: 'https://evil.example.com' } });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
});

test('codesMatch compares codes exactly', async () => {
  assert.equal(await codesMatch('abc', 'abc'), true);
  assert.equal(await codesMatch('abc', 'abd'), false);
  assert.equal(await codesMatch('abc', 'abcd'), false);
  assert.equal(await codesMatch('', 'abc'), false);
});
