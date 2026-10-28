// Remembers the access code on this device (see docs/specs/SPEC-access.md).
// Storage can be missing or throw (private mode, cleared data), so every access is guarded.

const KEY = 'bora.accessCode';

/** The browser's localStorage, or undefined when it cannot be reached. */
function defaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * Creates a store for the access code.
 *
 * @param {Storage | undefined} [storage] - Where to keep the code; defaults to localStorage.
 */
export function createCodeStore(storage = defaultStorage()) {
  return {
    /** The saved code, or null. */
    get() {
      try {
        return storage?.getItem(KEY) ?? null;
      } catch {
        return null;
      }
    },
    /** Saves the code; returns false when it could not be saved. */
    set(code) {
      try {
        if (!storage) return false;
        storage.setItem(KEY, code);
        return true;
      } catch {
        return false;
      }
    },
    /** Forgets the code on this device. */
    clear() {
      try {
        storage?.removeItem(KEY);
      } catch {
        // Nothing to do: the code is already unreachable.
      }
    },
  };
}
