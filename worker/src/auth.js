// Access code check for the Bora! Worker (see docs/specs/SPEC-access.md).

const encoder = new TextEncoder();

/** SHA-256 of a string, so both values have the same length before comparing. */
async function digest(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}

/**
 * Compares two codes in constant time: the comparison takes the same time
 * whatever the first wrong character, so it does not leak the code.
 *
 * @param {string} given - The code sent by the app.
 * @param {string} expected - The ACCESS_CODE secret.
 * @returns {Promise<boolean>} True when both codes are identical and not empty.
 */
export async function codesMatch(given, expected) {
  if (!given || !expected) return false;
  const [a, b] = await Promise.all([digest(given), digest(expected)]);
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) difference |= a[i] ^ b[i];
  return difference === 0;
}
