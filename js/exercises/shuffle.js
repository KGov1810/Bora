// Shuffles options and words (see docs/specs/SPEC-exercises.md). Pure module: no DOM access.

/** True when both lists hold equal items in the same order. */
function sameOrder(a, b) {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

/**
 * Returns a shuffled copy of the items. When a different order exists, the
 * result is never the original order, so a reorder exercise is never shown
 * already solved and a right answer is not always in the same place.
 *
 * @template T
 * @param {T[]} items - The items to shuffle; not modified.
 * @param {() => number} [random=Math.random] - A source of numbers in [0, 1).
 * @returns {T[]} The shuffled copy.
 */
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  // Rotating by one only gives back the same order when every item is equal.
  if (result.length > 1 && sameOrder(result, items)) result.push(result.shift());
  return result;
}
