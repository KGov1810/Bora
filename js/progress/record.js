// Turns answers into attempts and sends them (see docs/specs/SPEC-progress.md). No DOM access.

import { syncAttempts } from './sync.js';

const MAX_RESPONSE_LENGTH = 200;

/** The learner's answer as text, as stored on the server. */
export function responseText(exercise, response) {
  let text;
  switch (exercise.type) {
    case 'choice':
      text = exercise.options[response] ?? '';
      break;
    case 'true-false':
      text = String(response);
      break;
    case 'reorder':
      text = Array.isArray(response) ? response.join(' ') : '';
      break;
    default:
      text = String(response ?? '').trim();
  }
  return text.slice(0, MAX_RESPONSE_LENGTH);
}

/** A random id for an attempt or a session. */
export function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Builds the attempt saved for one answered exercise. */
export function buildAttempt({ lessonId, exercise, response, result, sessionId, now = new Date(), makeId: newId = makeId }) {
  return {
    clientId: newId(),
    sessionId,
    lessonId,
    exerciseId: exercise.id,
    correct: Boolean(result.correct),
    response: responseText(exercise, response),
    answeredAt: now.toISOString(),
  };
}

/**
 * Creates a recorder: attempts go to the queue first, then the queue is sent.
 * Only one sync runs at a time; a sync asked during another one reuses it.
 *
 * @param {{ queue: object, client: object, getCode: () => string | null }} options
 */
export function createRecorder({ queue, client, getCode }) {
  let running = null;

  const sync = () => {
    if (!running) {
      running = syncAttempts({ queue, client, code: getCode() })
        .catch((error) => {
          console.error('Sync failed:', error);
          return { status: 'server_error', sent: 0 };
        })
        .finally(() => {
          running = null;
        });
    }
    return running;
  };

  return {
    /** Queues one attempt, then tries to send the queue. */
    record(attempt) {
      queue.add(attempt);
      return sync();
    },
    sync,
    pending: () => queue.size(),
  };
}
