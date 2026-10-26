// Validators for lesson and path content files (see SPEC-content-format.md).
// Pure functions: no DOM, no file access. They return readable errors instead of throwing.

const LEVELS = ['A2', 'B1', 'B2'];
const SCHEMA_VERSION = 1;
const MIN_EXERCISES = 3;
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const GLOSSARY_MARK = /\[\[([^[\]]*)\]\]/g;

/** True when the value is a string with visible characters. */
function isFilledString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/** True when the value is a non-empty array whose items are all filled strings. */
function isFilledStringList(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isFilledString);
}

/** True when the value is a plain object (not null, not an array). */
function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Collects glossary marks from the paragraphs and reports malformed ones.
 * @returns {{ keys: Set<string>, problems: string[] }}
 */
function collectGlossaryMarks(paragraphs) {
  const keys = new Set();
  const problems = [];
  paragraphs.forEach((paragraph, index) => {
    for (const match of paragraph.matchAll(GLOSSARY_MARK)) {
      const key = match[1].trim().toLowerCase();
      if (key === '') problems.push(`text.paragraphs[${index}] has an empty glossary mark`);
      else keys.add(key);
    }
    const leftover = paragraph.replace(GLOSSARY_MARK, '');
    if (leftover.includes('[[') || leftover.includes(']]')) {
      problems.push(`text.paragraphs[${index}] has a malformed glossary mark`);
    }
  });
  return { keys, problems };
}

/** Checks the text and its glossary marks against the glossary entries. */
function checkTextAndGlossary(lesson, report) {
  const { text, glossary } = lesson;
  if (!isObject(text)) {
    report('text must be an object');
    return;
  }
  if (!isFilledString(text.title)) report('text.title must be a non-empty string');
  if (!isFilledStringList(text.paragraphs)) {
    report('text.paragraphs must be a non-empty list of strings');
    return;
  }

  if (!isObject(glossary)) {
    report('glossary must be an object');
    return;
  }
  const { keys: marked, problems } = collectGlossaryMarks(text.paragraphs);
  problems.forEach(report);

  for (const key of marked) {
    if (!Object.hasOwn(glossary, key)) report(`mark [[${key}]] has no glossary entry`);
  }
  for (const [key, entry] of Object.entries(glossary)) {
    if (!marked.has(key)) report(`glossary key "${key}" is never marked in the text`);
    if (!isObject(entry) || !isFilledString(entry.pt)) {
      report(`glossary.${key}.pt must be a non-empty string`);
    }
  }
}

/** Checks the grammar section: title, explanation and translated examples. */
function checkGrammar(grammar, report) {
  if (!isObject(grammar)) {
    report('grammar must be an object');
    return;
  }
  if (!isFilledString(grammar.title)) report('grammar.title must be a non-empty string');
  if (!isFilledStringList(grammar.explanation)) {
    report('grammar.explanation must be a non-empty list of strings');
  }
  if (!Array.isArray(grammar.examples) || grammar.examples.length === 0) {
    report('grammar.examples must be a non-empty list');
    return;
  }
  grammar.examples.forEach((example, index) => {
    if (!isObject(example) || !isFilledString(example.en)) {
      report(`grammar.examples[${index}].en must be a non-empty string`);
    }
    if (!isObject(example) || !isFilledString(example.pt)) {
      report(`grammar.examples[${index}].pt must be a non-empty string`);
    }
  });
}

/** Checks the rules shared by every exercise: count, unique ids, explanation. */
function checkExercises(exercises, report) {
  if (!Array.isArray(exercises) || exercises.length < MIN_EXERCISES) {
    report(`a lesson needs at least ${MIN_EXERCISES} exercises`);
    if (!Array.isArray(exercises)) return;
  }
  const seenIds = new Set();
  exercises.forEach((exercise, index) => {
    if (!isObject(exercise)) {
      report(`exercises[${index}] must be an object`);
      return;
    }
    if (!isFilledString(exercise.id)) {
      report(`exercises[${index}].id must be a non-empty string`);
    } else if (seenIds.has(exercise.id)) {
      report(`duplicate exercise id "${exercise.id}"`);
    } else {
      seenIds.add(exercise.id);
    }
    if (!isFilledString(exercise.explanation)) {
      report(`exercises[${index}].explanation must be a non-empty string`);
    }
  });
}

/**
 * Checks a lesson object against the content format.
 *
 * @param {unknown} lesson - The parsed lesson file.
 * @param {string} fileName - The file name, e.g. "a2-past-simple-weekend.json".
 * @returns {string[]} Human-readable errors; empty when the lesson is valid.
 */
export function validateLesson(lesson, fileName) {
  const errors = [];
  const report = (message) => errors.push(`${fileName}: ${message}`);

  if (!isObject(lesson)) {
    report('lesson must be an object');
    return errors;
  }

  if (lesson.schemaVersion !== SCHEMA_VERSION) report(`schemaVersion must be ${SCHEMA_VERSION}`);

  if (!LEVELS.includes(lesson.level)) report(`level must be one of ${LEVELS.join(', ')}`);

  if (typeof lesson.id !== 'string' || !KEBAB_CASE.test(lesson.id)) {
    report('id must be a kebab-case string');
  } else {
    if (`${lesson.id}.json` !== fileName) report(`id "${lesson.id}" must match the file name`);
    if (LEVELS.includes(lesson.level) && !lesson.id.startsWith(`${lesson.level.toLowerCase()}-`)) {
      report(`id "${lesson.id}" must start with "${lesson.level.toLowerCase()}-"`);
    }
  }

  for (const field of ['title', 'grammarPoint', 'theme']) {
    if (!isFilledString(lesson[field])) report(`${field} must be a non-empty string`);
  }

  const minutes = lesson.estimatedMinutes;
  if (!Number.isInteger(minutes) || minutes < 3 || minutes > 20) {
    report('estimatedMinutes must be an integer from 3 to 20');
  }

  checkTextAndGlossary(lesson, report);
  checkGrammar(lesson.grammar, report);
  checkExercises(lesson.exercises, report);

  return errors;
}
