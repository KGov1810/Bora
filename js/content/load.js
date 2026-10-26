// Loads and validates content files (see SPEC-lessons.md).
// No DOM access; results are kept in memory for the session.

import { validateLesson, validatePath } from './validate.js';

const CONTENT_URL = new URL('../../content/', import.meta.url);

/** Raised when content cannot be loaded or is invalid; `details` lists the problems. */
export class ContentError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ContentError';
    this.details = details;
  }
}

const lessonCache = new Map();
let coursePromise = null;

/** Fetches a JSON file under content/; returns null when it does not exist. */
async function fetchJson(relativePath) {
  const response = await fetch(new URL(relativePath, CONTENT_URL));
  if (response.status === 404) return null;
  if (!response.ok) throw new ContentError(`HTTP ${response.status} for ${relativePath}`);
  return response.json();
}

/**
 * Loads one lesson and validates it.
 *
 * @param {string} id - The lesson id.
 * @returns {Promise<object>} The lesson.
 * @throws {ContentError} When the lesson is missing, unreachable or invalid.
 */
export async function loadLesson(id) {
  if (lessonCache.has(id)) return lessonCache.get(id);
  if (!/^[a-z0-9-]+$/.test(id)) throw new ContentError(`Unknown lesson id "${id}"`);

  const lesson = await fetchJson(`lessons/${id}.json`);
  if (lesson === null) throw new ContentError(`Lesson "${id}" does not exist`);

  const errors = validateLesson(lesson, `${id}.json`);
  if (errors.length > 0) throw new ContentError(`Lesson "${id}" is invalid`, errors);

  lessonCache.set(id, lesson);
  return lesson;
}

/** Loads the path and every lesson it lists, then validates them together. */
async function fetchCourse() {
  const path = await fetchJson('path.json');
  if (path === null) throw new ContentError('content/path.json does not exist');

  const ids = (Array.isArray(path.levels) ? path.levels : [])
    .flatMap((level) => (Array.isArray(level.units) ? level.units : []))
    .flatMap((unit) => (Array.isArray(unit.lessons) ? unit.lessons : []));

  const lessons = {};
  const errors = [];
  await Promise.all(ids.map(async (id) => {
    try {
      lessons[id] = await loadLesson(id);
    } catch (error) {
      // A missing file is reported by validatePath below; other problems are listed here.
      if (!(error instanceof ContentError && error.message.endsWith('does not exist'))) {
        errors.push(error.message, ...(error.details ?? []));
      }
    }
  }));

  errors.push(...validatePath(path, lessons));
  if (errors.length > 0) throw new ContentError('The course content is invalid', errors);
  return { path, lessons };
}

/**
 * Loads the learning path with all its lessons, once per session.
 *
 * @returns {Promise<{ path: object, lessons: Record<string, object> }>}
 * @throws {ContentError} When something is missing, unreachable or invalid.
 */
export function loadCourse() {
  if (!coursePromise) {
    coursePromise = fetchCourse().catch((error) => {
      coursePromise = null; // allow a retry, e.g. once back online
      throw error;
    });
  }
  return coursePromise;
}
