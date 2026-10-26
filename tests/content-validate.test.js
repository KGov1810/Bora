import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLesson, normalizeAnswer, isAcceptedAnswer } from '../js/content/validate.js';

const FILE = 'a2-past-simple-weekend.json';

/** Returns a fresh, valid lesson; each test breaks one rule on its own copy. */
function validLesson() {
  return {
    schemaVersion: 1,
    id: 'a2-past-simple-weekend',
    level: 'A2',
    title: 'Um fim de semana em Chicago',
    grammarPoint: 'Past simple',
    theme: 'travel',
    estimatedMinutes: 10,
    text: {
      title: 'A weekend in Chicago',
      paragraphs: [
        'Last weekend, Ana [[visited]] Chicago with her sister.',
        'They [[booked]] a small hotel and [[visited]] two museums.',
      ],
    },
    glossary: {
      visited: { pt: 'visitou' },
      booked: { pt: 'reservaram', note: 'to book = reservar' },
    },
    grammar: {
      title: 'Past simple',
      explanation: ['Usamos o past simple para ações terminadas.'],
      examples: [{ en: 'Ana visited Chicago.', pt: 'A Ana visitou Chicago.' }],
    },
    exercises: [
      { id: 'q1', type: 'choice', prompt: 'Com quem?', options: ['A irmã', 'Sozinha'], answer: 0, explanation: 'Com a irmã.' },
      { id: 'q2', type: 'true-false', statement: 'The hotel was big.', answer: false, explanation: 'Era pequeno.' },
      { id: 'q3', type: 'fill-blank', prompt: 'Complete.', sentence: 'We ___ Paris.', answers: ['visited'], explanation: 'visit + -ed.' },
    ],
  };
}

/** Asserts that exactly one error mentions the given fragment. */
function assertError(errors, fragment) {
  assert.ok(
    errors.some((error) => error.includes(fragment)),
    `expected an error containing "${fragment}", got: ${JSON.stringify(errors)}`,
  );
}

test('accepts a valid lesson', () => {
  assert.deepEqual(validateLesson(validLesson(), FILE), []);
});

test('prefixes every error with the file name', () => {
  const lesson = validLesson();
  lesson.level = 'C1';
  const errors = validateLesson(lesson, FILE);
  assert.ok(errors.length > 0 && errors.every((error) => error.startsWith(`${FILE}: `)));
});

test('rejects a value that is not an object', () => {
  assertError(validateLesson(null, FILE), 'lesson must be an object');
});

test('rejects an unknown schema version', () => {
  const lesson = validLesson();
  lesson.schemaVersion = 2;
  assertError(validateLesson(lesson, FILE), 'schemaVersion');
});

test('rejects an id that does not match the file name', () => {
  assertError(validateLesson(validLesson(), 'a2-other.json'), 'id "a2-past-simple-weekend" must match the file name');
});

test('rejects an id that is not kebab-case', () => {
  const lesson = validLesson();
  lesson.id = 'A2_Past';
  assertError(validateLesson(lesson, 'A2_Past.json'), 'id');
});

test('rejects an id that does not start with its level', () => {
  const lesson = validLesson();
  lesson.id = 'b1-past-simple-weekend';
  assertError(validateLesson(lesson, 'b1-past-simple-weekend.json'), 'must start with "a2-"');
});

test('rejects an unknown level', () => {
  const lesson = validLesson();
  lesson.level = 'C1';
  assertError(validateLesson(lesson, FILE), 'level');
});

test('rejects an empty title', () => {
  const lesson = validLesson();
  lesson.title = '  ';
  assertError(validateLesson(lesson, FILE), 'title');
});

test('rejects a missing grammar point', () => {
  const lesson = validLesson();
  delete lesson.grammarPoint;
  assertError(validateLesson(lesson, FILE), 'grammarPoint');
});

test('rejects a missing theme', () => {
  const lesson = validLesson();
  delete lesson.theme;
  assertError(validateLesson(lesson, FILE), 'theme');
});

test('rejects estimated minutes outside 3 to 20', () => {
  const lesson = validLesson();
  lesson.estimatedMinutes = 45;
  assertError(validateLesson(lesson, FILE), 'estimatedMinutes');
});

test('rejects estimated minutes that are not an integer', () => {
  const lesson = validLesson();
  lesson.estimatedMinutes = 7.5;
  assertError(validateLesson(lesson, FILE), 'estimatedMinutes');
});

test('rejects a text without paragraphs', () => {
  const lesson = validLesson();
  lesson.text.paragraphs = [];
  assertError(validateLesson(lesson, FILE), 'text.paragraphs');
});

test('rejects a text without a title', () => {
  const lesson = validLesson();
  delete lesson.text.title;
  assertError(validateLesson(lesson, FILE), 'text.title');
});

test('rejects a glossary mark without an entry', () => {
  const lesson = validLesson();
  lesson.text.paragraphs.push('Then they [[walked]] home.');
  assertError(validateLesson(lesson, FILE), 'mark [[walked]] has no glossary entry');
});

test('matches glossary marks case-insensitively', () => {
  const lesson = validLesson();
  lesson.text.paragraphs.push('[[Booked]] early, the hotel was cheap.');
  assert.deepEqual(validateLesson(lesson, FILE), []);
});

test('rejects a glossary entry that is never marked', () => {
  const lesson = validLesson();
  lesson.glossary.museum = { pt: 'museu' };
  assertError(validateLesson(lesson, FILE), 'glossary key "museum" is never marked in the text');
});

test('rejects an empty glossary mark', () => {
  const lesson = validLesson();
  lesson.text.paragraphs.push('An empty [[]] mark.');
  assertError(validateLesson(lesson, FILE), 'empty glossary mark');
});

test('rejects a nested or unclosed glossary mark', () => {
  const lesson = validLesson();
  lesson.text.paragraphs.push('A [[broken [[mark]] here.');
  assertError(validateLesson(lesson, FILE), 'malformed glossary mark');
});

test('rejects a glossary entry without a translation', () => {
  const lesson = validLesson();
  lesson.glossary.booked = { note: 'to book' };
  assertError(validateLesson(lesson, FILE), 'glossary.booked.pt');
});

test('rejects a grammar section without explanation', () => {
  const lesson = validLesson();
  lesson.grammar.explanation = [];
  assertError(validateLesson(lesson, FILE), 'grammar.explanation');
});

test('rejects a grammar example without a translation', () => {
  const lesson = validLesson();
  lesson.grammar.examples = [{ en: 'Ana visited Chicago.' }];
  assertError(validateLesson(lesson, FILE), 'grammar.examples[0].pt');
});

test('rejects fewer than three exercises', () => {
  const lesson = validLesson();
  lesson.exercises = lesson.exercises.slice(0, 2);
  assertError(validateLesson(lesson, FILE), 'at least 3 exercises');
});

test('rejects duplicate exercise ids', () => {
  const lesson = validLesson();
  lesson.exercises[2].id = 'q1';
  assertError(validateLesson(lesson, FILE), 'duplicate exercise id "q1"');
});

test('rejects an exercise without an explanation', () => {
  const lesson = validLesson();
  delete lesson.exercises[0].explanation;
  assertError(validateLesson(lesson, FILE), 'exercises[0].explanation');
});

// ---- Exercise types (Task 3) ----

/** Returns a valid lesson whose first exercise is replaced by the given one. */
function lessonWithExercise(exercise) {
  const lesson = validLesson();
  lesson.exercises[0] = { id: 'q1', explanation: 'Explicação.', ...exercise };
  return lesson;
}

test('rejects an unknown exercise type', () => {
  const errors = validateLesson(lessonWithExercise({ type: 'essay', prompt: 'Escreva.' }), FILE);
  assertError(errors, 'exercises[0].type "essay" is not supported');
});

test('accepts a valid choice exercise', () => {
  const lesson = lessonWithExercise({ type: 'choice', prompt: 'Qual?', options: ['A', 'B', 'C'], answer: 2 });
  assert.deepEqual(validateLesson(lesson, FILE), []);
});

test('rejects a choice exercise with only one option', () => {
  const lesson = lessonWithExercise({ type: 'choice', prompt: 'Qual?', options: ['A'], answer: 0 });
  assertError(validateLesson(lesson, FILE), 'exercises[0].options must have 2 to 5');
});

test('rejects a choice exercise with more than five options', () => {
  const lesson = lessonWithExercise({ type: 'choice', prompt: 'Qual?', options: ['A', 'B', 'C', 'D', 'E', 'F'], answer: 0 });
  assertError(validateLesson(lesson, FILE), 'exercises[0].options must have 2 to 5');
});

test('rejects a choice answer outside the options', () => {
  const lesson = lessonWithExercise({ type: 'choice', prompt: 'Qual?', options: ['A', 'B'], answer: 2 });
  assertError(validateLesson(lesson, FILE), 'exercises[0].answer must be the index of an option');
});

test('rejects a choice exercise without a prompt', () => {
  const lesson = lessonWithExercise({ type: 'choice', options: ['A', 'B'], answer: 0 });
  assertError(validateLesson(lesson, FILE), 'exercises[0].prompt');
});

test('accepts a valid true-false exercise', () => {
  const lesson = lessonWithExercise({ type: 'true-false', statement: 'It rained.', answer: true });
  assert.deepEqual(validateLesson(lesson, FILE), []);
});

test('rejects a true-false answer that is not a boolean', () => {
  const lesson = lessonWithExercise({ type: 'true-false', statement: 'It rained.', answer: 'true' });
  assertError(validateLesson(lesson, FILE), 'exercises[0].answer must be true or false');
});

test('rejects a true-false exercise without a statement', () => {
  const lesson = lessonWithExercise({ type: 'true-false', answer: true });
  assertError(validateLesson(lesson, FILE), 'exercises[0].statement');
});

test('accepts a valid fill-blank exercise with a hint', () => {
  const lesson = lessonWithExercise({ type: 'fill-blank', prompt: 'Complete.', sentence: 'I ___ tired.', answers: ['was'], hint: 'be' });
  assert.deepEqual(validateLesson(lesson, FILE), []);
});

test('rejects a fill-blank sentence without a blank', () => {
  const lesson = lessonWithExercise({ type: 'fill-blank', prompt: 'Complete.', sentence: 'I was tired.', answers: ['was'] });
  assertError(validateLesson(lesson, FILE), 'exactly one ___');
});

test('rejects a fill-blank sentence with two blanks', () => {
  const lesson = lessonWithExercise({ type: 'fill-blank', prompt: 'Complete.', sentence: 'I ___ very ___.', answers: ['was'] });
  assertError(validateLesson(lesson, FILE), 'exactly one ___');
});

test('rejects a fill-blank exercise without accepted answers', () => {
  const lesson = lessonWithExercise({ type: 'fill-blank', prompt: 'Complete.', sentence: 'I ___ tired.', answers: [] });
  assertError(validateLesson(lesson, FILE), 'exercises[0].answers');
});

test('rejects an empty fill-blank hint', () => {
  const lesson = lessonWithExercise({ type: 'fill-blank', prompt: 'Complete.', sentence: 'I ___ tired.', answers: ['was'], hint: '' });
  assertError(validateLesson(lesson, FILE), 'exercises[0].hint');
});

test('accepts a valid reorder exercise', () => {
  const lesson = lessonWithExercise({ type: 'reorder', prompt: 'Ordene.', words: ['They', 'walked', 'a', 'lot'] });
  assert.deepEqual(validateLesson(lesson, FILE), []);
});

test('rejects a reorder exercise with one word', () => {
  const lesson = lessonWithExercise({ type: 'reorder', prompt: 'Ordene.', words: ['Hello'] });
  assertError(validateLesson(lesson, FILE), 'exercises[0].words must have 2 to 12');
});

test('rejects a reorder exercise with more than twelve words', () => {
  const words = 'one two three four five six seven eight nine ten eleven twelve thirteen'.split(' ');
  const lesson = lessonWithExercise({ type: 'reorder', prompt: 'Ordene.', words });
  assertError(validateLesson(lesson, FILE), 'exercises[0].words must have 2 to 12');
});

// ---- Answer normalization ----

test('normalizeAnswer ignores case', () => {
  assert.equal(normalizeAnswer('Visited'), 'visited');
});

test('normalizeAnswer trims outer spaces', () => {
  assert.equal(normalizeAnswer('  visited '), 'visited');
});

test('normalizeAnswer collapses inner spaces', () => {
  assert.equal(normalizeAnswer('did   not'), 'did not');
});

test('normalizeAnswer turns curly apostrophes into straight ones', () => {
  assert.equal(normalizeAnswer('didn’t'), "didn't");
});

test('isAcceptedAnswer accepts any listed answer after normalization', () => {
  assert.equal(isAcceptedAnswer(' Didn’t ', ["didn't", 'did not']), true);
  assert.equal(isAcceptedAnswer('did not', ["didn't", 'did not']), true);
});

test('isAcceptedAnswer rejects an answer that is not listed', () => {
  assert.equal(isAcceptedAnswer('visit', ['visited']), false);
});
