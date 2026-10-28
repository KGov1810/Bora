import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeProgress, buildOwnerSummary, questionOf } from '../js/progress/summary.js';

const nine = Array.from({ length: 9 }, (_, i) => ({ id: `q${i + 1}`, type: 'choice', prompt: `Pergunta ${i + 1}?`, options: ['A', 'B'], answer: 0, explanation: '.' }));
nine[4] = { id: 'q5', type: 'fill-blank', prompt: 'Complete.', sentence: 'Maya ___ work at three.', answers: ['finishes'], explanation: '.' };

const COURSE = {
  path: { levels: [{ level: 'A2', units: [{ id: 'a2-u1', title: 'O dia a dia', lessons: ['a2-one', 'a2-two'] }] }] },
  lessons: {
    'a2-one': { id: 'a2-one', title: 'Lição um', exercises: nine },
    'a2-two': { id: 'a2-two', title: 'Lição dois', exercises: nine },
  },
};

const round = (lessonId, sessionId, correct, answered, at = '2026-10-28T10:00:00.000Z') => ({ lessonId, sessionId, correct, answered, at });

test('a full round with 6 of 9 does not make a lesson practiced', () => {
  const progress = computeProgress({ rounds: [round('a2-one', 's1', 6, 9)], exercises: [] }, COURSE);
  assert.equal(progress.practicedCount, 0);
  assert.equal(progress.lessons[0].best, 6);
  assert.equal(progress.lessons[0].practiced, false);
});

test('a full round with 7 of 9 makes a lesson practiced', () => {
  const progress = computeProgress({ rounds: [round('a2-one', 's1', 7, 9)], exercises: [] }, COURSE);
  assert.equal(progress.practicedCount, 1);
  assert.equal(progress.lessons[0].practiced, true);
  assert.equal(progress.totalLessons, 2);
});

test('a retry round never counts, even with every answer right', () => {
  const progress = computeProgress({ rounds: [round('a2-one', 's1', 3, 3)], exercises: [] }, COURSE);
  assert.equal(progress.practicedCount, 0);
  assert.equal(progress.lessons[0].best, null);
  assert.equal(progress.lessons[0].fullRounds, 0);
});

test('the best score is the best full round', () => {
  const progress = computeProgress({ rounds: [round('a2-one', 's1', 5, 9), round('a2-one', 's2', 8, 9), round('a2-one', 's3', 6, 9)], exercises: [] }, COURSE);
  assert.equal(progress.lessons[0].best, 8);
  assert.equal(progress.lessons[0].fullRounds, 3);
});

test('lessons follow the path order', () => {
  const progress = computeProgress({ rounds: [], exercises: [] }, COURSE);
  assert.deepEqual(progress.lessons.map((lesson) => lesson.id), ['a2-one', 'a2-two']);
});

test('Para revisar lists exercises whose last answer was wrong', () => {
  const progress = computeProgress({
    rounds: [],
    exercises: [
      { lessonId: 'a2-one', exerciseId: 'q5', attempts: 2, wrong: 2, lastCorrect: false, lastWrongResponse: 'finishs' },
      { lessonId: 'a2-one', exerciseId: 'q1', attempts: 2, wrong: 1, lastCorrect: true, lastWrongResponse: 'B' },
    ],
  }, COURSE);
  assert.deepEqual(progress.review.map((item) => `${item.lesson.id}#${item.exercise.id}`), ['a2-one#q5']);
  assert.equal(progress.review[0].question, 'Maya ___ work at three.');
  assert.equal(progress.review[0].expected, 'finishes');
});

test('Para revisar ignores exercises that no longer exist in the content', () => {
  const progress = computeProgress({
    rounds: [],
    exercises: [{ lessonId: 'a2-gone', exerciseId: 'q1', attempts: 1, wrong: 1, lastCorrect: false, lastWrongResponse: 'x' }],
  }, COURSE);
  assert.deepEqual(progress.review, []);
});

test('the owner summary lists lessons, scores and the most missed exercises', () => {
  const summary = {
    rounds: [round('a2-one', 's1', 7, 9), round('a2-two', 's2', 4, 9)],
    exercises: [
      { lessonId: 'a2-one', exerciseId: 'q5', attempts: 3, wrong: 2, lastCorrect: true, lastWrongResponse: 'finishs' },
      { lessonId: 'a2-two', exerciseId: 'q2', attempts: 1, wrong: 1, lastCorrect: false, lastWrongResponse: 'B' },
    ],
  };
  const text = buildOwnerSummary(summary, COURSE, new Date('2026-10-28T12:00:00.000Z'));
  assert.match(text, /Bora! progress summary \(2026-10-28\)/);
  assert.match(text, /Lessons practiced: 1 of 2/);
  assert.match(text, /a2-one .*best 7\/9.*practiced/);
  assert.match(text, /a2-two .*best 4\/9/);
  assert.match(text, /a2-one#q5 \(fill-blank\): "Maya ___ work at three\." expected "finishes", wrong 2 of 3, last wrong answer "finishs"/);
  assert.match(text, /To review now: 1/);
});

test('Para revisar follows the course order', () => {
  const progress = computeProgress({
    rounds: [],
    exercises: [
      { lessonId: 'a2-two', exerciseId: 'q1', attempts: 1, wrong: 1, lastCorrect: false, lastWrongResponse: 'B' },
      { lessonId: 'a2-one', exerciseId: 'q5', attempts: 1, wrong: 1, lastCorrect: false, lastWrongResponse: 'x' },
      { lessonId: 'a2-one', exerciseId: 'q2', attempts: 1, wrong: 1, lastCorrect: false, lastWrongResponse: 'B' },
    ],
  }, COURSE);
  assert.deepEqual(progress.review.map((item) => `${item.lesson.id}#${item.exercise.id}`), ['a2-one#q2', 'a2-one#q5', 'a2-two#q1']);
});

test('a reorder question shows its words in alphabetical order, not the answer', () => {
  assert.equal(questionOf({ type: 'reorder', prompt: 'Ordene.', words: ['She', 'always', 'walks', 'to', 'work'] }), 'always · She · to · walks · work');
});
