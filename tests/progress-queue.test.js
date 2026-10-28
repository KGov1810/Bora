import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAttemptQueue } from '../js/progress/queue.js';
import { syncAttempts } from '../js/progress/sync.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

const brokenStorage = {
  getItem() { throw new Error('denied'); },
  setItem() { throw new Error('denied'); },
  removeItem() { throw new Error('denied'); },
};

const item = (n) => ({ clientId: `c-${n}`, sessionId: 's', lessonId: 'a2-x', exerciseId: 'q1', correct: true, response: 'r', answeredAt: '2026-10-28T10:00:00.000Z' });

// ---- Queue ----

test('the queue starts empty', () => {
  assert.deepEqual(createAttemptQueue(memoryStorage()).all(), []);
});

test('the queue keeps attempts in order across instances', () => {
  const storage = memoryStorage();
  createAttemptQueue(storage).add(item(1));
  createAttemptQueue(storage).add(item(2));
  assert.deepEqual(createAttemptQueue(storage).all().map((a) => a.clientId), ['c-1', 'c-2']);
});

test('the queue removes only the given client ids', () => {
  const queue = createAttemptQueue(memoryStorage());
  [1, 2, 3].forEach((n) => queue.add(item(n)));
  queue.remove(['c-1', 'c-3']);
  assert.deepEqual(queue.all().map((a) => a.clientId), ['c-2']);
  assert.equal(queue.size(), 1);
});

test('the queue ignores corrupted stored data', () => {
  const storage = memoryStorage();
  storage.setItem('bora.pendingAttempts', '{oops');
  assert.deepEqual(createAttemptQueue(storage).all(), []);
});

test('the queue never throws when storage fails', () => {
  const queue = createAttemptQueue(brokenStorage);
  assert.doesNotThrow(() => queue.add(item(1)));
  assert.deepEqual(queue.all(), []);
  assert.doesNotThrow(() => queue.remove(['c-1']));
});

// ---- Sync ----

/** A fake API client recording batches and answering with a given status. */
function fakeClient(statuses = []) {
  const batches = [];
  return {
    batches,
    async postAttempts(code, attempts) {
      batches.push({ code, attempts });
      const status = statuses.length > 0 ? statuses.shift() : 'ok';
      return status === 'ok' ? { status, saved: attempts.length } : { status };
    },
  };
}

test('sync without a code sends nothing and keeps the queue', async () => {
  const queue = createAttemptQueue(memoryStorage());
  queue.add(item(1));
  const client = fakeClient();
  assert.deepEqual(await syncAttempts({ queue, client, code: null }), { status: 'no_code', sent: 0 });
  assert.equal(client.batches.length, 0);
  assert.equal(queue.size(), 1);
});

test('sync with an empty queue does nothing', async () => {
  const client = fakeClient();
  assert.deepEqual(await syncAttempts({ queue: createAttemptQueue(memoryStorage()), client, code: 'x' }), { status: 'ok', sent: 0 });
  assert.equal(client.batches.length, 0);
});

test('sync sends the queue in batches of 100 and empties it', async () => {
  const queue = createAttemptQueue(memoryStorage());
  for (let n = 1; n <= 230; n += 1) queue.add(item(n));
  const client = fakeClient();
  assert.deepEqual(await syncAttempts({ queue, client, code: 'x' }), { status: 'ok', sent: 230 });
  assert.deepEqual(client.batches.map((b) => b.attempts.length), [100, 100, 30]);
  assert.equal(client.batches[0].code, 'x');
  assert.equal(queue.size(), 0);
});

test('sync stops at the first failed batch and keeps what was not confirmed', async () => {
  const queue = createAttemptQueue(memoryStorage());
  for (let n = 1; n <= 150; n += 1) queue.add(item(n));
  const client = fakeClient(['ok', 'offline']);
  assert.deepEqual(await syncAttempts({ queue, client, code: 'x' }), { status: 'offline', sent: 100 });
  assert.equal(queue.size(), 50);
  assert.equal(queue.all()[0].clientId, 'c-101');
});

test('sync reports an invalid code and keeps the queue', async () => {
  const queue = createAttemptQueue(memoryStorage());
  queue.add(item(1));
  assert.deepEqual(await syncAttempts({ queue, client: fakeClient(['invalid_code']), code: 'x' }), { status: 'invalid_code', sent: 0 });
  assert.equal(queue.size(), 1);
});
