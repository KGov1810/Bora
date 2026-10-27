import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradeExercise } from '../js/exercises/grade.js';

const CHOICE = { id: 'q1', type: 'choice', prompt: 'Onde?', options: ['Café', 'Hospital', 'Escola'], answer: 0, explanation: '.' };
const TRUE_FALSE = { id: 'q2', type: 'true-false', statement: 'It rained.', answer: false, explanation: '.' };
const FILL = { id: 'q3', type: 'fill-blank', prompt: 'Complete.', sentence: 'They ___ have time.', answers: ["don't", 'do not'], explanation: '.' };
const REORDER = { id: 'q4', type: 'reorder', prompt: 'Ordene.', words: ['She', 'always', 'walks', 'to', 'work'], explanation: '.' };

test('choice: the right option index is correct', () => {
  assert.deepEqual(gradeExercise(CHOICE, 0), { correct: true, expected: 'Café' });
});

test('choice: another option is wrong and expected is the right option text', () => {
  assert.deepEqual(gradeExercise(CHOICE, 2), { correct: false, expected: 'Café' });
});

test('true-false: the right boolean is correct', () => {
  assert.deepEqual(gradeExercise(TRUE_FALSE, false), { correct: true, expected: 'false' });
});

test('true-false: the wrong boolean is wrong', () => {
  assert.deepEqual(gradeExercise(TRUE_FALSE, true), { correct: false, expected: 'false' });
});

test('fill-blank: any accepted answer is correct after normalization', () => {
  assert.equal(gradeExercise(FILL, '  Don’t ').correct, true);
  assert.equal(gradeExercise(FILL, 'do  not').correct, true);
});

test('fill-blank: a wrong answer is wrong and expected is the first accepted answer', () => {
  assert.deepEqual(gradeExercise(FILL, 'doesn’t'), { correct: false, expected: "don't" });
});

test('reorder: the words in the right order are correct', () => {
  assert.deepEqual(gradeExercise(REORDER, ['She', 'always', 'walks', 'to', 'work']), {
    correct: true,
    expected: 'She always walks to work',
  });
});

test('reorder: the words in another order are wrong', () => {
  assert.equal(gradeExercise(REORDER, ['She', 'walks', 'always', 'to', 'work']).correct, false);
});

test('reorder: missing words are wrong', () => {
  assert.equal(gradeExercise(REORDER, ['She', 'always', 'walks']).correct, false);
});

test('an unknown type throws', () => {
  assert.throws(() => gradeExercise({ type: 'essay' }, 'x'), /Unsupported exercise type "essay"/);
});
