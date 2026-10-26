/**
 * Creates an element with attributes and children.
 * Strings become text nodes, so translated text is never parsed as HTML.
 *
 * @param {string} tag - The element tag name.
 * @param {Record<string, string>} [attributes={}] - Attributes to set.
 * @param {...(Node|string|null)} children - Child nodes or text; null is skipped.
 * @returns {HTMLElement} The new element.
 */
export function h(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  for (const child of children) {
    if (child !== null) element.append(child);
  }
  return element;
}
