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

/** True when the value is an array of filled strings with a length in [min, max]. */
function isStringListOfSize(value, min, max) {
  return Array.isArray(value) && value.length >= min && value.length <= max && value.every(isFilledString);
}

// Per-type rules. Each checker reports problems with the exercise's path, e.g. "exercises[2]".
const EXERCISE_CHECKERS = {
  choice(exercise, at, report) {
    if (!isFilledString(exercise.prompt)) report(`${at}.prompt must be a non-empty string`);
    if (!isStringListOfSize(exercise.options, 2, 5)) {
      report(`${at}.options must have 2 to 5 non-empty strings`);
      return;
    }
    if (!Number.isInteger(exercise.answer) || exercise.answer < 0 || exercise.answer >= exercise.options.length) {
      report(`${at}.answer must be the index of an option`);
    }
  },
  'true-false'(exercise, at, report) {
    if (!isFilledString(exercise.statement)) report(`${at}.statement must be a non-empty string`);
    if (typeof exercise.answer !== 'boolean') report(`${at}.answer must be true or false`);
  },
  'fill-blank'(exercise, at, report) {
    if (!isFilledString(exercise.prompt)) report(`${at}.prompt must be a non-empty string`);
    const blanks = typeof exercise.sentence === 'string' ? exercise.sentence.split('___').length - 1 : 0;
    if (blanks !== 1) report(`${at}.sentence must contain exactly one ___`);
    if (!isFilledStringList(exercise.answers)) report(`${at}.answers must be a non-empty list of strings`);
    if ('hint' in exercise && !isFilledString(exercise.hint)) report(`${at}.hint must be a non-empty string when present`);
  },
  reorder(exercise, at, report) {
    if (!isFilledString(exercise.prompt)) report(`${at}.prompt must be a non-empty string`);
    if (!isStringListOfSize(exercise.words, 2, 12)) report(`${at}.words must have 2 to 12 non-empty strings`);
  },
};

/** Checks the rules shared by every exercise (count, unique ids, explanation), then its type's rules. */
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
    const checker = Object.hasOwn(EXERCISE_CHECKERS, exercise.type) ? EXERCISE_CHECKERS[exercise.type] : null;
    if (checker) checker(exercise, `exercises[${index}]`, report);
    else report(`exercises[${index}].type "${exercise.type}" is not supported`);
  });
}

/**
 * Normalizes a typed answer for comparison: trimmed, lower case,
 * single inner spaces, and straight apostrophes.
 *
 * @param {string} text - The typed or expected answer.
 * @returns {string} The normalized answer.
 */
export function normalizeAnswer(text) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[’‘]/g, "'");
}

/**
 * Tells whether a typed answer matches one of the accepted answers of a fill-blank exercise.
 *
 * @param {string} typed - What the learner typed.
 * @param {string[]} accepted - The exercise's accepted answers.
 * @returns {boolean} True when the normalized answer is accepted.
 */
export function isAcceptedAnswer(typed, accepted) {
  const answer = normalizeAnswer(typed);
  return accepted.some((candidate) => normalizeAnswer(candidate) === answer);
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

/** Returns every lesson id listed in the path, in order (duplicates kept). */
function listPathLessons(path) {
  if (!isObject(path) || !Array.isArray(path.levels)) return [];
  return path.levels.flatMap((level) => (isObject(level) && Array.isArray(level.units) ? level.units : []))
    .flatMap((unit) => (isObject(unit) && Array.isArray(unit.lessons) ? unit.lessons : []));
}

/**
 * Checks the learning path against the format and the lesson files that exist.
 *
 * @param {unknown} path - The parsed content/path.json.
 * @param {Record<string, { level: string }>} lessons - Lesson files on disk, by id.
 * @returns {string[]} Human-readable errors; empty when the path is valid.
 */
export function validatePath(path, lessons) {
  const errors = [];
  const report = (message) => errors.push(`path.json: ${message}`);

  if (!isObject(path)) {
    report('path must be an object');
    return errors;
  }
  if (path.schemaVersion !== SCHEMA_VERSION) report(`schemaVersion must be ${SCHEMA_VERSION}`);
  if (!Array.isArray(path.levels)) {
    report('levels must be a list');
    return errors;
  }

  const seenLevels = new Set();
  const seenUnits = new Set();
  const seenLessons = new Set();

  path.levels.forEach((entry, levelIndex) => {
    const at = `levels[${levelIndex}]`;
    if (!isObject(entry) || !LEVELS.includes(entry.level)) {
      report(`${at}.level must be one of ${LEVELS.join(', ')}`);
      return;
    }
    if (seenLevels.has(entry.level)) report(`level "${entry.level}" is listed twice`);
    seenLevels.add(entry.level);

    if (!Array.isArray(entry.units)) {
      report(`${at}.units must be a list`);
      return;
    }
    entry.units.forEach((unit, unitIndex) => {
      const unitAt = isObject(unit) && isFilledString(unit.id) ? `unit ${unit.id}` : `${at}.units[${unitIndex}]`;
      if (!isObject(unit) || typeof unit.id !== 'string' || !KEBAB_CASE.test(unit.id)) {
        report(`${unitAt}: id must be a kebab-case string`);
      } else if (seenUnits.has(unit.id)) {
        report(`duplicate unit id "${unit.id}"`);
      } else {
        seenUnits.add(unit.id);
      }
      if (!isObject(unit) || !isFilledString(unit.title)) report(`${unitAt}: title must be a non-empty string`);
      if (!isObject(unit) || !isFilledStringList(unit.lessons)) {
        report(`${unitAt}: lessons must be a non-empty list of lesson ids`);
        return;
      }

      unit.lessons.forEach((lessonId) => {
        if (seenLessons.has(lessonId)) report(`lesson "${lessonId}" is listed twice`);
        seenLessons.add(lessonId);
        if (!Object.hasOwn(lessons, lessonId)) {
          report(`lesson "${lessonId}" has no file in content/lessons/`);
        } else if (lessons[lessonId].level !== entry.level) {
          report(`lesson "${lessonId}" is ${lessons[lessonId].level} but listed under ${entry.level}`);
        }
      });
    });
  });

  return errors;
}

/**
 * Lists lesson files that the path does not mention (drafts).
 *
 * @param {unknown} path - The parsed content/path.json.
 * @param {Record<string, unknown>} lessons - Lesson files on disk, by id.
 * @returns {string[]} The draft lesson ids, sorted.
 */
export function findDraftLessons(path, lessons) {
  const listed = new Set(listPathLessons(path));
  return Object.keys(lessons).filter((id) => !listed.has(id)).sort();
}
