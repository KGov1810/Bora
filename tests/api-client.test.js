import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../js/api/client.js';
import { createCodeStore } from '../js/api/storage.js';

const BASE = 'https://bora-api.example.workers.dev';

/** A fake fetch that records calls and answers with the given status. */
function fakeFetch(status) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    return new Response(null, { status });
  };
  return { impl, calls };
}

test('checkAccess sends the code as a Bearer token to /auth/check', async () => {
  const { impl, calls } = fakeFetch(204);
  await createApiClient({ baseUrl: BASE, fetchImpl: impl }).checkAccess('my-code');
  assert.equal(calls[0].url, `${BASE}/auth/check`);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer my-code');
});

test('checkAccess returns ok for 204', async () => {
  const { impl } = fakeFetch(204);
  assert.equal(await createApiClient({ baseUrl: BASE, fetchImpl: impl }).checkAccess('x'), 'ok');
});

test('checkAccess returns invalid_code for 401', async () => {
  const { impl } = fakeFetch(401);
  assert.equal(await createApiClient({ baseUrl: BASE, fetchImpl: impl }).checkAccess('x'), 'invalid_code');
});

test('checkAccess returns server_error for 503 and other errors', async () => {
  for (const status of [500, 503, 404]) {
    const { impl } = fakeFetch(status);
    assert.equal(await createApiClient({ baseUrl: BASE, fetchImpl: impl }).checkAccess('x'), 'server_error');
  }
});

test('checkAccess returns offline when the network fails', async () => {
  const impl = async () => {
    throw new TypeError('Failed to fetch');
  };
  assert.equal(await createApiClient({ baseUrl: BASE, fetchImpl: impl }).checkAccess('x'), 'offline');
});

test('checkAccess returns offline after the timeout', async () => {
  const impl = (url, init) => new Promise((resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  });
  const client = createApiClient({ baseUrl: BASE, fetchImpl: impl, timeoutMs: 20 });
  assert.equal(await client.checkAccess('x'), 'offline');
});

test('checkAccess returns invalid_code for an empty code without calling the server', async () => {
  const { impl, calls } = fakeFetch(204);
  assert.equal(await createApiClient({ baseUrl: BASE, fetchImpl: impl }).checkAccess('   '), 'invalid_code');
  assert.equal(calls.length, 0);
});

test('a trailing slash in the base URL is ignored', async () => {
  const { impl, calls } = fakeFetch(204);
  await createApiClient({ baseUrl: `${BASE}/`, fetchImpl: impl }).checkAccess('x');
  assert.equal(calls[0].url, `${BASE}/auth/check`);
});

// ---- Code storage ----

/** A minimal in-memory Storage. */
function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

/** A Storage whose every method throws, like Safari in some private contexts. */
const brokenStorage = {
  getItem() { throw new Error('denied'); },
  setItem() { throw new Error('denied'); },
  removeItem() { throw new Error('denied'); },
};

test('the code store saves, reads and clears the code', () => {
  const store = createCodeStore(memoryStorage());
  assert.equal(store.get(), null);
  assert.equal(store.set('my-code'), true);
  assert.equal(store.get(), 'my-code');
  store.clear();
  assert.equal(store.get(), null);
});

test('the code store never throws when storage fails', () => {
  const store = createCodeStore(brokenStorage);
  assert.equal(store.get(), null);
  assert.equal(store.set('my-code'), false);
  assert.doesNotThrow(() => store.clear());
});

test('the code store works without any storage', () => {
  const store = createCodeStore(undefined);
  assert.equal(store.get(), null);
  assert.equal(store.set('x'), false);
});
