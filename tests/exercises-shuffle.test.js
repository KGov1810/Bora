import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shuffle } from '../js/exercises/shuffle.js';

/** A seeded pseudo-random generator, so tests are deterministic. */
function seeded(seed) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

test('keeps the same items', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];
  assert.deepEqual([...shuffle(items, seeded(1))].sort(), [...items].sort());
});

test('does not change the input array', () => {
  const items = ['a', 'b', 'c'];
  shuffle(items, seeded(2));
  assert.deepEqual(items, ['a', 'b', 'c']);
});

test('is deterministic with the same random source', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f'];
  assert.deepEqual(shuffle(items, seeded(42)), shuffle(items, seeded(42)));
});

test('never returns the original order for two or more distinct items', () => {
  for (let seed = 0; seed < 200; seed += 1) {
    assert.notDeepEqual(shuffle(['a', 'b'], seeded(seed)), ['a', 'b']);
    assert.notDeepEqual(shuffle(['the', 'shop', 'is', 'the', 'best'], seeded(seed)), ['the', 'shop', 'is', 'the', 'best']);
  }
});

test('never returns the original order even when random always gives 0.999', () => {
  assert.notDeepEqual(shuffle([1, 2, 3], () => 0.999), [1, 2, 3]);
});

test('returns a copy when items cannot differ', () => {
  assert.deepEqual(shuffle(['x'], seeded(3)), ['x']);
  assert.deepEqual(shuffle(['x', 'x'], seeded(3)), ['x', 'x']);
  assert.deepEqual(shuffle([], seeded(3)), []);
});
