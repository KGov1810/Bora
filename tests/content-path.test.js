import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePath, findDraftLessons } from '../js/content/validate.js';

// Lessons known on disk, by id, with their level.
const LESSONS = {
  'a2-present-simple-routine': { level: 'A2' },
  'a2-past-simple-weekend': { level: 'A2' },
  'b1-first-conditional': { level: 'B1' },
};

/** Returns a fresh, valid path; each test breaks one rule on its own copy. */
function validPath() {
  return {
    schemaVersion: 1,
    levels: [
      {
        level: 'A2',
        units: [
          { id: 'a2-u1', title: 'O dia a dia', lessons: ['a2-present-simple-routine'] },
          { id: 'a2-u2', title: 'Falar do passado', lessons: ['a2-past-simple-weekend'] },
        ],
      },
    ],
  };
}

function assertError(errors, fragment) {
  assert.ok(
    errors.some((error) => error.includes(fragment)),
    `expected an error containing "${fragment}", got: ${JSON.stringify(errors)}`,
  );
}

test('accepts a valid path', () => {
  assert.deepEqual(validatePath(validPath(), LESSONS), []);
});

test('prefixes every error with path.json', () => {
  const path = validPath();
  path.schemaVersion = 9;
  const errors = validatePath(path, LESSONS);
  assert.ok(errors.length > 0 && errors.every((error) => error.startsWith('path.json: ')));
});

test('rejects an unknown schema version', () => {
  const path = validPath();
  path.schemaVersion = 2;
  assertError(validatePath(path, LESSONS), 'schemaVersion');
});

test('rejects an unknown level', () => {
  const path = validPath();
  path.levels[0].level = 'C1';
  assertError(validatePath(path, LESSONS), 'levels[0].level');
});

test('rejects a level listed twice', () => {
  const path = validPath();
  path.levels.push({ level: 'A2', units: [] });
  assertError(validatePath(path, LESSONS), 'level "A2" is listed twice');
});

test('rejects a unit without a title', () => {
  const path = validPath();
  path.levels[0].units[0].title = '';
  assertError(validatePath(path, LESSONS), 'a2-u1: title');
});

test('rejects a duplicate unit id', () => {
  const path = validPath();
  path.levels[0].units[1].id = 'a2-u1';
  assertError(validatePath(path, LESSONS), 'duplicate unit id "a2-u1"');
});

test('rejects a lesson that has no file', () => {
  const path = validPath();
  path.levels[0].units[0].lessons.push('a2-missing-lesson');
  assertError(validatePath(path, LESSONS), 'lesson "a2-missing-lesson" has no file');
});

test('rejects a lesson listed twice', () => {
  const path = validPath();
  path.levels[0].units[1].lessons.push('a2-present-simple-routine');
  assertError(validatePath(path, LESSONS), 'lesson "a2-present-simple-routine" is listed twice');
});

test('rejects a lesson listed under another level', () => {
  const path = validPath();
  path.levels[0].units[0].lessons.push('b1-first-conditional');
  assertError(validatePath(path, LESSONS), 'lesson "b1-first-conditional" is B1 but listed under A2');
});

test('accepts an empty path while no lesson is written', () => {
  assert.deepEqual(validatePath({ schemaVersion: 1, levels: [] }, {}), []);
});

test('findDraftLessons lists lesson files missing from the path', () => {
  assert.deepEqual(findDraftLessons(validPath(), LESSONS), ['b1-first-conditional']);
});
