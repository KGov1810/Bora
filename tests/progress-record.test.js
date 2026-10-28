import { test } from 'node:test';
import assert from 'node:assert/strict';
import { responseText, buildAttempt, createRecorder } from '../js/progress/record.js';

const CHOICE = { id: 'q1', type: 'choice', options: ['Café', 'Hospital'], answer: 0 };

test('responseText gives the chosen option text for choice', () => {
  assert.equal(responseText(CHOICE, 1), 'Hospital');
});

test('responseText gives true or false for true-false', () => {
  assert.equal(responseText({ type: 'true-false' }, false), 'false');
});

test('responseText trims a typed answer', () => {
  assert.equal(responseText({ type: 'fill-blank' }, '  finishs '), 'finishs');
});

test('responseText joins reordered words', () => {
  assert.equal(responseText({ type: 'reorder' }, ['She', 'walks', 'always']), 'She walks always');
});

test('responseText cuts answers to 200 characters', () => {
  assert.equal(responseText({ type: 'fill-blank' }, 'x'.repeat(300)).length, 200);
});

test('buildAttempt makes a complete attempt', () => {
  const attempt = buildAttempt({
    lessonId: 'a2-x',
    exercise: CHOICE,
    response: 1,
    result: { correct: false },
    sessionId: 's-1',
    now: new Date('2026-10-28T10:00:00.000Z'),
    makeId: () => 'id-1',
  });
  assert.deepEqual(attempt, {
    clientId: 'id-1',
    sessionId: 's-1',
    lessonId: 'a2-x',
    exerciseId: 'q1',
    correct: false,
    response: 'Hospital',
    answeredAt: '2026-10-28T10:00:00.000Z',
  });
});

/** In-memory queue and a client that resolves when told to. */
function fakes() {
  const items = [];
  const queue = {
    all: () => [...items],
    size: () => items.length,
    add: (attempt) => items.push(attempt),
    remove: (ids) => {
      for (const id of ids) {
        const index = items.findIndex((attempt) => attempt.clientId === id);
        if (index >= 0) items.splice(index, 1);
      }
    },
  };
  const posts = [];
  const client = {
    async postAttempts(code, attempts) {
      posts.push(attempts.length);
      return { status: 'ok', saved: attempts.length };
    },
  };
  return { queue, client, posts };
}

test('record adds the attempt to the queue before trying to send it', async () => {
  const { queue, client } = fakes();
  const recorder = createRecorder({ queue, client, getCode: () => null });
  await recorder.record({ clientId: 'a' });
  assert.equal(queue.size(), 1);
});

test('record sends the queue when a code is saved', async () => {
  const { queue, client } = fakes();
  const recorder = createRecorder({ queue, client, getCode: () => 'code' });
  const result = await recorder.record({ clientId: 'a' });
  assert.deepEqual(result, { status: 'ok', sent: 1 });
  assert.equal(queue.size(), 0);
});

test('two syncs at the same time send each attempt only once', async () => {
  const { queue, client, posts } = fakes();
  queue.add({ clientId: 'a' });
  const recorder = createRecorder({ queue, client, getCode: () => 'code' });
  await Promise.all([recorder.sync(), recorder.sync()]);
  assert.deepEqual(posts, [1]);
});
