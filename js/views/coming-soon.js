import { h } from '../dom.js';

/**
 * Renders a placeholder screen for a section that is not built yet.
 * Expects the keys `<section>.title`, `<section>.intro` and `<section>.soon`.
 *
 * @param {HTMLElement} container - The view container to fill.
 * @param {(key: string) => string} t - The translation function.
 * @param {string} section - The key prefix of the section, e.g. "lessons".
 */
export function renderComingSoon(container, t, section) {
  container.replaceChildren(h(
    'div',
    { class: 'page' },
    h('h1', {}, t(`${section}.title`)),
    h('p', { class: 'intro' }, t(`${section}.intro`)),
    h('p', { class: 'empty-state' }, t(`${section}.soon`)),
  ));
}
