import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute, parseRoute } from '../js/router.js';

const ROUTES = ['home', 'lessons', 'exercises', 'progress'];

test('resolves a known route', () => {
  assert.equal(resolveRoute('#/lessons', ROUTES), 'lessons');
});

test('resolves a known route written without a slash', () => {
  assert.equal(resolveRoute('#progress', ROUTES), 'progress');
});

test('falls back to the default route for an unknown route', () => {
  assert.equal(resolveRoute('#/unknown', ROUTES), 'home');
});

test('falls back to the default route for an empty hash', () => {
  assert.equal(resolveRoute('', ROUTES), 'home');
});

test('falls back to the default route for a bare hash', () => {
  assert.equal(resolveRoute('#/', ROUTES), 'home');
});

test('keeps only the first segment of a nested route', () => {
  assert.equal(resolveRoute('#/lessons/12', ROUTES), 'lessons');
});

test('uses a custom default route when one is given', () => {
  assert.equal(resolveRoute('#/unknown', ROUTES, 'progress'), 'progress');
});

// ---- parseRoute ----

test('parseRoute returns a bare tab without parameter', () => {
  assert.deepEqual(parseRoute('#/lessons', ROUTES), { name: 'lessons', param: null });
});

test('parseRoute returns the parameter after the tab', () => {
  assert.deepEqual(parseRoute('#/lessons/a2-present-simple-routine', ROUTES), {
    name: 'lessons',
    param: 'a2-present-simple-routine',
  });
});

test('parseRoute ignores segments after the parameter', () => {
  assert.deepEqual(parseRoute('#/lessons/a2-x/extra', ROUTES), { name: 'lessons', param: 'a2-x' });
});

test('parseRoute treats an empty parameter as none', () => {
  assert.deepEqual(parseRoute('#/lessons/', ROUTES), { name: 'lessons', param: null });
});

test('parseRoute decodes an encoded parameter', () => {
  assert.deepEqual(parseRoute('#/lessons/a2%2Dx', ROUTES), { name: 'lessons', param: 'a2-x' });
});

test('parseRoute falls back to the default route, without parameter, for an unknown tab', () => {
  assert.deepEqual(parseRoute('#/unknown/a2-x', ROUTES), { name: 'home', param: null });
});

test('parseRoute falls back to the default route for an empty hash', () => {
  assert.deepEqual(parseRoute('', ROUTES), { name: 'home', param: null });
});
