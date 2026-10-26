import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute } from '../js/router.js';

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
