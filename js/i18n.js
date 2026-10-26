/**
 * Creates a translation function bound to a flat dictionary of strings.
 * A missing key returns the key itself, so a gap is visible on screen
 * instead of an empty label.
 *
 * @param {Record<string, string>} [strings={}] - Keys mapped to translated strings.
 * @returns {(key: string) => string} The translation function.
 */
export function createTranslator(strings = {}) {
  return (key) => (Object.hasOwn(strings, key) ? strings[key] : key);
}
