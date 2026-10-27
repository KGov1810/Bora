// Grades exercise answers (see SPEC-exercises.md). Pure module: no DOM access.

import { isAcceptedAnswer } from '../content/validate.js';

/** True when both lists hold the same strings in the same order. */
function sameWords(a, b) {
  return Array.isArray(b) && a.length === b.length && a.every((word, index) => word === b[index]);
}

/**
 * Grades one answer.
 * Responses: choice → option index; true-false → boolean; fill-blank → typed text;
 * reorder → list of words in the chosen order.
 *
 * @param {object} exercise - A validated exercise from a lesson file.
 * @param {number | boolean | string | string[]} response - The learner's answer.
 * @returns {{ correct: boolean, expected: string }} Whether it is right, and the
 *   right answer ready to display ("true" or "false" for true-false).
 * @throws {Error} For an unsupported exercise type.
 */
export function gradeExercise(exercise, response) {
  switch (exercise.type) {
    case 'choice':
      return { correct: response === exercise.answer, expected: exercise.options[exercise.answer] };
    case 'true-false':
      return { correct: response === exercise.answer, expected: String(exercise.answer) };
    case 'fill-blank':
      return {
        correct: typeof response === 'string' && isAcceptedAnswer(response, exercise.answers),
        expected: exercise.answers[0],
      };
    case 'reorder':
      return { correct: sameWords(exercise.words, response), expected: exercise.words.join(' ') };
    default:
      throw new Error(`Unsupported exercise type "${exercise.type}"`);
  }
}
