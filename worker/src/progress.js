// Saved exercise answers for Bora! (see SPEC-progress.md).
// Uses the D1 binding `DB`. All SQL uses bound parameters.

const MAX_ATTEMPTS = 100;
const MAX_RESPONSE_LENGTH = 200;
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const KEBAB_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY,
    client_id TEXT NOT NULL UNIQUE,
    session_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    correct INTEGER NOT NULL,
    response TEXT NOT NULL,
    answered_at TEXT NOT NULL,
    received_at TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS attempts_by_exercise ON attempts (lesson_id, exercise_id, answered_at)',
  'CREATE INDEX IF NOT EXISTS attempts_by_session ON attempts (lesson_id, session_id)',
];

// Databases whose schema is known to exist in this Worker instance.
const readyDatabases = new WeakSet();

/** Creates the table and indexes once per Worker instance. */
export async function ensureSchema(db) {
  if (readyDatabases.has(db)) return;
  await db.batch(SCHEMA.map((sql) => db.prepare(sql)));
  readyDatabases.add(db);
}

/** True for an ISO-like date string that parses to a real date. */
function isDate(value) {
  return typeof value === 'string' && value.length <= 40 && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
}

/** True when one attempt has every field in the expected shape and size. */
function isValidAttempt(item) {
  return typeof item === 'object' && item !== null
    && typeof item.clientId === 'string' && ID.test(item.clientId)
    && typeof item.sessionId === 'string' && ID.test(item.sessionId)
    && typeof item.lessonId === 'string' && item.lessonId.length <= 80 && KEBAB_ID.test(item.lessonId)
    && typeof item.exerciseId === 'string' && item.exerciseId.length <= 40 && KEBAB_ID.test(item.exerciseId)
    && typeof item.correct === 'boolean'
    && typeof item.response === 'string' && item.response.length <= MAX_RESPONSE_LENGTH
    && isDate(item.answeredAt);
}

/**
 * Checks a POST /progress/attempts body.
 * @returns {object[] | null} The attempts, or null when the body is invalid.
 */
export function parseAttempts(body) {
  if (typeof body !== 'object' || body === null || !Array.isArray(body.attempts)) return null;
  const { attempts } = body;
  if (attempts.length < 1 || attempts.length > MAX_ATTEMPTS) return null;
  return attempts.every(isValidAttempt) ? attempts : null;
}

/**
 * Stores attempts; already known client ids are ignored.
 * @returns {Promise<number>} The number of new rows.
 */
export async function saveAttempts(db, attempts, now = new Date()) {
  await ensureSchema(db);
  const receivedAt = now.toISOString();
  const insert = db.prepare(`INSERT OR IGNORE INTO attempts
    (client_id, session_id, lesson_id, exercise_id, correct, response, answered_at, received_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const results = await db.batch(attempts.map((item) => insert.bind(
    item.clientId,
    item.sessionId,
    item.lessonId,
    item.exerciseId,
    item.correct ? 1 : 0,
    item.response,
    item.answeredAt,
    receivedAt,
  )));
  return results.reduce((total, result) => total + (result.meta?.changes ?? 0), 0);
}

/** Rounds (one per session) and per-exercise stats. */
export async function readSummary(db) {
  await ensureSchema(db);
  const rounds = await db.prepare(`SELECT lesson_id, session_id,
      SUM(correct) AS correct, COUNT(*) AS answered, MAX(answered_at) AS at
    FROM attempts
    GROUP BY lesson_id, session_id
    ORDER BY at, lesson_id, session_id`).all();

  const exercises = await db.prepare(`SELECT a.lesson_id, a.exercise_id,
      COUNT(*) AS attempts, SUM(1 - a.correct) AS wrong,
      (SELECT b.correct FROM attempts b
        WHERE b.lesson_id = a.lesson_id AND b.exercise_id = a.exercise_id
        ORDER BY b.answered_at DESC, b.id DESC LIMIT 1) AS last_correct,
      (SELECT c.response FROM attempts c
        WHERE c.lesson_id = a.lesson_id AND c.exercise_id = a.exercise_id AND c.correct = 0
        ORDER BY c.answered_at DESC, c.id DESC LIMIT 1) AS last_wrong_response
    FROM attempts a
    GROUP BY a.lesson_id, a.exercise_id
    ORDER BY a.lesson_id, a.exercise_id`).all();

  return {
    rounds: rounds.results.map((row) => ({
      lessonId: row.lesson_id,
      sessionId: row.session_id,
      correct: Number(row.correct),
      answered: Number(row.answered),
      at: row.at,
    })),
    exercises: exercises.results.map((row) => ({
      lessonId: row.lesson_id,
      exerciseId: row.exercise_id,
      attempts: Number(row.attempts),
      wrong: Number(row.wrong),
      lastCorrect: Number(row.last_correct) === 1,
      lastWrongResponse: row.last_wrong_response ?? null,
    })),
  };
}
