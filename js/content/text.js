// Turns lesson text into displayable segments (see docs/specs/SPEC-lessons.md).
// Pure module: no DOM access.

/** Matches one [[term]] glossary mark; shared with the validator. */
export const GLOSSARY_MARK = /\[\[([^[\]]*)\]\]/g;

/**
 * Splits a paragraph into plain text and glossary terms.
 * "She [[gets up]] early." gives
 * [{ text: 'She ' }, { term: 'gets up', key: 'gets up' }, { text: ' early.' }].
 * The term keeps its displayed case; the key is lower case, like the glossary keys.
 *
 * @param {string} paragraph - A paragraph with [[term]] marks.
 * @returns {Array<{ text: string } | { term: string, key: string }>} The segments, in order.
 */
export function splitGlossaryMarks(paragraph) {
  const segments = [];
  let position = 0;
  for (const match of paragraph.matchAll(GLOSSARY_MARK)) {
    if (match.index > position) segments.push({ text: paragraph.slice(position, match.index) });
    const term = match[1].trim();
    segments.push({ term, key: term.toLowerCase() });
    position = match.index + match[0].length;
  }
  if (position < paragraph.length) segments.push({ text: paragraph.slice(position) });
  return segments;
}
