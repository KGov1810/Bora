import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/src/index.js';
import { createFakeD1 } from './fake-d1.js';

const BASE = 'https://bora-api.example.workers.dev';
const CODE = 'blue-river-tiny-lamp';

function envWithDb() {
  return { ACCESS_CODE: CODE, DB: createFakeD1() };
}

function call(env, path, { method = 'GET', body, code = CODE } = {}) {
  const headers = { Authorization: `Bearer ${code}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return worker.fetch(new Request(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
  }), env);
}

let counter = 0;
/** A valid attempt; fields can be overridden. */
function attempt(overrides = {}) {
  counter += 1;
  return {
    clientId: `c-${counter}`,
    sessionId: 's-1',
    lessonId: 'a2-present-simple-routine',
    exerciseId: 'q1',
    correct: true,
    response: 'Em uma cafeteria perto de casa',
    answeredAt: `2026-10-28T10:00:${String(counter % 60).padStart(2, '0')}.000Z`,
    ...overrides,
  };
}

test('progress routes require the access code', async () => {
  const env = envWithDb();
  assert.equal((await call(env, '/progress/summary', { code: 'wrong-code' })).status, 401);
  assert.equal((await call(env, '/progress/attempts', { method: 'POST', body: { attempts: [attempt()] }, code: 'nope' })).status, 401);
});

test('progress routes answer 503 when the database is not bound', async () => {
  const response = await call({ ACCESS_CODE: CODE }, '/progress/summary');
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'database_not_configured' });
});

test('an empty database gives an empty summary', async () => {
  const response = await call(envWithDb(), '/progress/summary');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { rounds: [], exercises: [] });
});

test('POST /progress/attempts saves attempts', async () => {
  const env = envWithDb();
  const response = await call(env, '/progress/attempts', { method: 'POST', body: { attempts: [attempt(), attempt({ exerciseId: 'q2' })] } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { saved: 2 });
});

test('sending the same attempts twice stores them once', async () => {
  const env = envWithDb();
  const batch = [attempt(), attempt({ exerciseId: 'q2' })];
  await call(env, '/progress/attempts', { method: 'POST', body: { attempts: batch } });
  const again = await call(env, '/progress/attempts', { method: 'POST', body: { attempts: batch } });
  assert.deepEqual(await again.json(), { saved: 0 });
  const summary = await (await call(env, '/progress/summary')).json();
  assert.equal(summary.rounds[0].answered, 2);
});

for (const [name, body] of [
  ['invalid JSON', '{not json'],
  ['no attempts list', { foo: 1 }],
  ['an empty list', { attempts: [] }],
  ['more than 100 attempts', { attempts: Array.from({ length: 101 }, () => attempt()) }],
  ['a response over 200 characters', { attempts: [attempt({ response: 'x'.repeat(201) })] }],
  ['a non-boolean correct', { attempts: [attempt({ correct: 'yes' })] }],
  ['a bad lesson id', { attempts: [attempt({ lessonId: 'A2 Lesson!' })] }],
  ['a bad client id', { attempts: [attempt({ clientId: '' })] }],
  ['an invalid date', { attempts: [attempt({ answeredAt: 'yesterday' })] }],
]) {
  test(`POST /progress/attempts refuses ${name} and stores nothing`, async () => {
    const env = envWithDb();
    const response = await call(env, '/progress/attempts', { method: 'POST', body });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'invalid_body' });
    const summary = await (await call(env, '/progress/summary')).json();
    assert.deepEqual(summary, { rounds: [], exercises: [] });
  });
}

test('the summary groups rounds by session with right answers and answers given', async () => {
  const env = envWithDb();
  await call(env, '/progress/attempts', {
    method: 'POST',
    body: {
      attempts: [
        attempt({ sessionId: 's-1', exerciseId: 'q1', correct: true, answeredAt: '2026-10-28T10:00:00.000Z' }),
        attempt({ sessionId: 's-1', exerciseId: 'q2', correct: false, answeredAt: '2026-10-28T10:01:00.000Z' }),
        attempt({ sessionId: 's-2', exerciseId: 'q2', correct: true, answeredAt: '2026-10-28T11:00:00.000Z' }),
      ],
    },
  });
  const { rounds } = await (await call(env, '/progress/summary')).json();
  assert.deepEqual(rounds, [
    { lessonId: 'a2-present-simple-routine', sessionId: 's-1', correct: 1, answered: 2, at: '2026-10-28T10:01:00.000Z' },
    { lessonId: 'a2-present-simple-routine', sessionId: 's-2', correct: 1, answered: 1, at: '2026-10-28T11:00:00.000Z' },
  ]);
});

test('the summary gives per-exercise stats with the last answer and last wrong response', async () => {
  const env = envWithDb();
  await call(env, '/progress/attempts', {
    method: 'POST',
    body: {
      attempts: [
        attempt({ exerciseId: 'q5', correct: false, response: 'finishs', answeredAt: '2026-10-28T10:00:00.000Z' }),
        attempt({ exerciseId: 'q5', correct: false, response: 'finish', answeredAt: '2026-10-28T10:05:00.000Z' }),
        attempt({ exerciseId: 'q5', correct: true, response: 'finishes', answeredAt: '2026-10-28T10:10:00.000Z' }),
        attempt({ exerciseId: 'q6', correct: false, response: 'doesnt', answeredAt: '2026-10-28T10:02:00.000Z' }),
      ],
    },
  });
  const { exercises } = await (await call(env, '/progress/summary')).json();
  assert.deepEqual(exercises, [
    { lessonId: 'a2-present-simple-routine', exerciseId: 'q5', attempts: 3, wrong: 2, lastCorrect: true, lastWrongResponse: 'finish' },
    { lessonId: 'a2-present-simple-routine', exerciseId: 'q6', attempts: 1, wrong: 1, lastCorrect: false, lastWrongResponse: 'doesnt' },
  ]);
});

test('a preflight for POST is allowed from the app', async () => {
  const response = await worker.fetch(new Request(`${BASE}/progress/attempts`, {
    method: 'OPTIONS',
    headers: { Origin: 'https://kgov1810.github.io', 'Access-Control-Request-Method': 'POST' },
  }), envWithDb());
  assert.equal(response.status, 204);
  assert.match(response.headers.get('Access-Control-Allow-Methods'), /POST/);
});
