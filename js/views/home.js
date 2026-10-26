import { h } from '../dom.js';

// Placeholder levels until the `progress` module stores the real ones.
const LEVELS = [
  { code: 'A2', state: 'current' },
  { code: 'B1', state: 'next' },
  { code: 'B2', state: 'later' },
];

const CAPTION_KEYS = {
  current: 'home.path.current',
  next: 'home.path.next',
};

/**
 * Renders the home screen: greeting, introduction and the level path.
 *
 * @param {HTMLElement} container - The view container to fill.
 * @param {(key: string) => string} t - The translation function.
 */
export function render(container, t) {
  const levels = LEVELS.map(({ code, state }) => h(
    'li',
    { 'data-state': state },
    h('span', { class: 'level-badge' }, code),
    h('span', { class: 'level-caption' }, CAPTION_KEYS[state] ? t(CAPTION_KEYS[state]) : ''),
  ));

  container.replaceChildren(h(
    'div',
    { class: 'home' },
    h('h1', { class: 'wordmark' }, t('app.name')),
    h('h2', {}, t('home.greeting')),
    h('p', { class: 'intro' }, t('home.intro')),
    h(
      'section',
      { class: 'level-path', 'aria-labelledby': 'level-path-title' },
      h('h3', { id: 'level-path-title' }, t('home.path.label')),
      h('ol', {}, ...levels),
    ),
    h('p', { class: 'soon' }, t('home.soon')),
  ));
}
