// One round of exercises: current item, answers, score, mistakes (see docs/specs/SPEC-exercises.md).
// Pure module: no DOM access.

import { gradeExercise } from './grade.js';

/**
 * Creates an exercise session. Each exercise is answered once; its first
 * answer is kept.
 *
 * @param {object[]} exercises - Validated exercises, in the order to show them.
 */
export function createSession(exercises) {
  const items = exercises.map((exercise) => ({ exercise, result: null }));
  let index = 0;

  const isFinished = () => index >= items.length;

  return {
    /** The current exercise with its position, or null when the session is finished. */
    current() {
      if (isFinished()) return null;
      const { exercise, result } = items[index];
      return { exercise, result, position: index + 1, total: items.length };
    },

    /** Grades the current exercise once; later calls return the first result. */
    answer(response) {
      if (isFinished()) return null;
      const item = items[index];
      if (!item.result) item.result = gradeExercise(item.exercise, response);
      return item.result;
    },

    /** Moves to the next exercise, only once the current one is answered. */
    next() {
      if (!isFinished() && items[index].result) index += 1;
    },

    isFinished,

    /** The number of right answers out of the number of exercises. */
    score() {
      return { correct: items.filter((item) => item.result?.correct).length, total: items.length };
    },

    /** The answered exercises that were wrong, in order, with their result. */
    mistakes() {
      return items.filter((item) => item.result && !item.result.correct).map(({ exercise, result }) => ({ exercise, result }));
    },

    /** A new session with only the exercises answered wrongly. */
    retryMistakes() {
      return createSession(this.mistakes().map((item) => item.exercise));
    },
  };
}
