// Runs the validators on the real content files, so every new lesson is checked
// automatically before it is pushed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { validateLesson, validatePath, findDraftLessons } from '../js/content/validate.js';

const CONTENT = new URL('../content/', import.meta.url).pathname;
const LESSONS_DIR = join(CONTENT, 'lessons');

/** Parses a JSON file, turning a syntax error into a readable message. */
function readJson(file, label) {
  try {
    return { value: JSON.parse(readFileSync(file, 'utf8')) };
  } catch (error) {
    return { error: `${label}: invalid JSON (${error.message})` };
  }
}

/** Loads every lesson file: parsed lessons by id, plus JSON errors. */
function loadLessons() {
  const lessons = {};
  const errors = [];
  const files = existsSync(LESSONS_DIR) ? readdirSync(LESSONS_DIR).filter((name) => name.endsWith('.json')) : [];
  for (const fileName of files) {
    const { value, error } = readJson(join(LESSONS_DIR, fileName), fileName);
    if (error) errors.push(error);
    else lessons[fileName.replace(/\.json$/, '')] = { fileName, lesson: value };
  }
  return { lessons, errors };
}

test('every lesson file is valid', () => {
  const { lessons, errors } = loadLessons();
  for (const { fileName, lesson } of Object.values(lessons)) {
    errors.push(...validateLesson(lesson, fileName));
  }
  assert.deepEqual(errors, []);
});

test('the learning path is valid', () => {
  const { value: path, error } = readJson(join(CONTENT, 'path.json'), 'path.json');
  assert.equal(error, undefined);
  const { lessons } = loadLessons();
  const levels = Object.fromEntries(Object.entries(lessons).map(([id, { lesson }]) => [id, { level: lesson.level }]));
  assert.deepEqual(validatePath(path, levels), []);
});

test('lists lessons that are not in the path yet (drafts)', (t) => {
  const { value: path } = readJson(join(CONTENT, 'path.json'), 'path.json');
  const { lessons } = loadLessons();
  const drafts = findDraftLessons(path, lessons);
  // Drafts are allowed: report them without failing.
  t.diagnostic(drafts.length === 0 ? 'no draft lessons' : `draft lessons: ${drafts.join(', ')}`);
});
