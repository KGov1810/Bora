import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../js/exercises/session.js';

const EXERCISES = [
  { id: 'q1', type: 'true-false', statement: 'A.', answer: true, explanation: '.' },
  { id: 'q2', type: 'true-false', statement: 'B.', answer: false, explanation: '.' },
  { id: 'q3', type: 'true-false', statement: 'C.', answer: true, explanation: '.' },
];

test('starts on the first exercise', () => {
  const session = createSession(EXERCISES);
  const current = session.current();
  assert.equal(current.exercise.id, 'q1');
  assert.equal(current.position, 1);
  assert.equal(current.total, 3);
  assert.equal(current.result, null);
});

test('answering grades the current exercise', () => {
  const session = createSession(EXERCISES);
  assert.deepEqual(session.answer(true), { correct: true, expected: 'true' });
  assert.deepEqual(session.current().result, { correct: true, expected: 'true' });
});

test('answering twice keeps the first answer', () => {
  const session = createSession(EXERCISES);
  session.answer(false);
  assert.deepEqual(session.answer(true), { correct: false, expected: 'true' });
});

test('next does not move before an answer', () => {
  const session = createSession(EXERCISES);
  session.next();
  assert.equal(session.current().exercise.id, 'q1');
});

test('next moves to the following exercise after an answer', () => {
  const session = createSession(EXERCISES);
  session.answer(true);
  session.next();
  assert.equal(session.current().exercise.id, 'q2');
  assert.equal(session.current().position, 2);
});

test('is finished after the last exercise is answered and next is called', () => {
  const session = createSession(EXERCISES);
  for (const answer of [true, false, true]) {
    assert.equal(session.isFinished(), false);
    session.answer(answer);
    session.next();
  }
  assert.equal(session.isFinished(), true);
  assert.equal(session.current(), null);
});

test('counts the score and lists the mistakes in order', () => {
  const session = createSession(EXERCISES);
  for (const answer of [false, false, false]) {
    session.answer(answer);
    session.next();
  }
  assert.deepEqual(session.score(), { correct: 1, total: 3 });
  assert.deepEqual(session.mistakes().map((item) => item.exercise.id), ['q1', 'q3']);
  assert.deepEqual(session.mistakes()[0].result, { correct: false, expected: 'true' });
});

test('a retry session contains only the mistakes', () => {
  const session = createSession(EXERCISES);
  for (const answer of [false, false, false]) {
    session.answer(answer);
    session.next();
  }
  const retry = session.retryMistakes();
  assert.equal(retry.current().total, 2);
  assert.equal(retry.current().exercise.id, 'q1');
  assert.equal(retry.current().result, null);
});

test('a session without exercises is finished at once', () => {
  const session = createSession([]);
  assert.equal(session.isFinished(), true);
  assert.deepEqual(session.score(), { correct: 0, total: 0 });
});
