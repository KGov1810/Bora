// Answers waiting to be sent to the server (see SPEC-progress.md).
// Storage can be missing or throw, so every access is guarded.

const KEY = 'bora.pendingAttempts';

function defaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * Creates the queue of attempts waiting to be sent.
 *
 * @param {Storage | undefined} [storage] - Where to keep the queue; defaults to localStorage.
 */
export function createAttemptQueue(storage = defaultStorage()) {
  const read = () => {
    try {
      const parsed = JSON.parse(storage?.getItem(KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const write = (items) => {
    try {
      storage?.setItem(KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Could not save pending answers:', error);
    }
  };

  return {
    /** Every waiting attempt, oldest first. */
    all: read,
    /** The number of waiting attempts. */
    size: () => read().length,
    /** Adds one attempt at the end of the queue. */
    add(attempt) {
      write([...read(), attempt]);
    },
    /** Removes the attempts the server confirmed. */
    remove(clientIds) {
      const sent = new Set(clientIds);
      write(read().filter((attempt) => !sent.has(attempt.clientId)));
    },
  };
}
