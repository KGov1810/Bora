import { h } from '../dom.js';
import { loadLesson, ContentError } from '../content/load.js';
import { splitGlossaryMarks } from '../content/text.js';
import { createReadAloud } from '../speech/read-aloud.js';

/**
 * Shows a pt-BR message with a link back to the list, and logs the details.
 *
 * @param {HTMLElement} container - The view container.
 * @param {(key: string) => string} t - The translation function.
 * @param {string} messageKey - The message to show.
 * @param {unknown} error - The underlying error, written to the console.
 */
export function renderContentError(container, t, messageKey, error) {
  console.error(error, error?.details ?? '');
  container.replaceChildren(h(
    'div',
    { class: 'page' },
    h('a', { class: 'back-link', href: '#/lessons' }, t('lessons.back')),
    h('h1', {}, t('lessons.error.title')),
    h('p', { class: 'empty-state' }, t(messageKey)),
  ));
}

/** Builds one English paragraph, with glossary terms as buttons. */
function paragraph(text) {
  const parts = splitGlossaryMarks(text).map((segment) => (
    'term' in segment
      ? h('button', { type: 'button', class: 'term', 'data-key': segment.key, 'aria-expanded': 'false' }, segment.term)
      : segment.text
  ));
  return h('p', { lang: 'en' }, ...parts);
}

/** Builds the grammar section: title, explanation and translated examples. */
function grammarSection(grammar, t) {
  return h(
    'section',
    { class: 'lesson-section', 'aria-labelledby': 'grammar-title' },
    h('h2', { id: 'grammar-title' }, t('lesson.grammar')),
    h('h3', {}, grammar.title),
    ...grammar.explanation.map((text) => h('p', {}, text)),
    h('ul', { class: 'examples' }, ...grammar.examples.map((example) => h(
      'li',
      {},
      h('span', { class: 'example-en', lang: 'en' }, example.en),
      h('span', { class: 'example-pt' }, example.pt),
    ))),
  );
}

/** Builds the vocabulary list from the glossary. */
function vocabularySection(glossary, t) {
  return h(
    'section',
    { class: 'lesson-section', 'aria-labelledby': 'vocabulary-title' },
    h('h2', { id: 'vocabulary-title' }, t('lesson.vocabulary')),
    h('dl', { class: 'vocabulary' }, ...Object.entries(glossary).flatMap(([key, entry]) => [
      h('dt', { lang: 'en' }, key),
      h('dd', {}, entry.pt, entry.note ? h('span', { class: 'vocabulary-note' }, entry.note) : null),
    ])),
  );
}

/** Builds the glossary card, hidden until a term is tapped. */
function glossaryCard(t) {
  return h(
    'aside',
    { class: 'glossary-card', hidden: '', 'aria-live': 'polite' },
    h('div', { class: 'glossary-card-text' },
      h('span', { class: 'glossary-term', lang: 'en' }),
      h('span', { class: 'glossary-pt' }),
      h('span', { class: 'glossary-note' })),
    h('button', { type: 'button', class: 'glossary-close', 'aria-label': t('lesson.glossary.close') }, '×'),
  );
}

/**
 * Wires the glossary: tapping a term opens its card, tapping it again, the
 * close button or anywhere else closes it.
 *
 * @returns {() => void} A cleanup function removing the listener.
 */
function wireGlossary(container, glossary) {
  const card = container.querySelector('.glossary-card');
  let openTerm = null;

  const close = () => {
    if (openTerm) openTerm.setAttribute('aria-expanded', 'false');
    openTerm = null;
    card.hidden = true;
  };

  const open = (button) => {
    const entry = glossary[button.dataset.key];
    if (!entry) return;
    if (openTerm) openTerm.setAttribute('aria-expanded', 'false');
    openTerm = button;
    button.setAttribute('aria-expanded', 'true');
    card.querySelector('.glossary-term').textContent = button.textContent;
    card.querySelector('.glossary-pt').textContent = entry.pt;
    card.querySelector('.glossary-note').textContent = entry.note ?? '';
    card.hidden = false;
  };

  const onClick = (event) => {
    const term = event.target.closest('.term');
    if (term) {
      if (term === openTerm) close();
      else open(term);
    } else if (!event.target.closest('.glossary-card') || event.target.closest('.glossary-close')) {
      close();
    }
  };

  container.addEventListener('click', onClick);
  return () => container.removeEventListener('click', onClick);
}

/**
 * Renders one lesson: text with glossary, grammar, vocabulary, exercises button.
 *
 * @returns {Promise<(() => void) | void>} A cleanup function once rendered.
 */
export async function renderLesson(container, t, context) {
  container.replaceChildren(h('p', { class: 'loading' }, t('lessons.loading')));

  let lesson;
  try {
    lesson = await loadLesson(context.param);
  } catch (error) {
    if (!context.isCurrent()) return undefined;
    const missing = error instanceof ContentError && /does not exist|Unknown lesson/.test(error.message);
    renderContentError(container, t, missing ? 'lessons.error.missing' : 'lessons.error.lesson', error);
    return undefined;
  }
  if (!context.isCurrent()) return undefined;

  context.setTitle(lesson.title);

  // Plain text for text-to-speech: title and paragraphs without glossary marks.
  const spokenText = [lesson.text.title, ...lesson.text.paragraphs]
    .map((text) => splitGlossaryMarks(text).map((segment) => segment.text ?? segment.term).join(''))
    .join('\n');
  const readAloud = createReadAloud(spokenText, t);

  container.replaceChildren(h(
    'article',
    { class: 'lesson' },
    h('a', { class: 'back-link', href: '#/lessons' }, t('lessons.back')),
    h(
      'p',
      { class: 'lesson-meta' },
      h('span', { class: 'chip' }, t('lessons.level').replace('{level}', lesson.level)),
      h('span', { class: 'chip' }, t('lessons.minutes').replace('{n}', String(lesson.estimatedMinutes))),
    ),
    h('h1', {}, lesson.title),
    h(
      'section',
      { class: 'reading', 'aria-labelledby': 'text-title' },
      h('div', { class: 'reading-header' }, h('h2', { id: 'text-title', lang: 'en' }, lesson.text.title)),
      readAloud.element,
      ...lesson.text.paragraphs.map(paragraph),
      h('p', { class: 'reading-hint' }, t('lesson.glossary.hint')),
    ),
    grammarSection(lesson.grammar, t),
    vocabularySection(lesson.glossary, t),
    h(
      'div',
      { class: 'lesson-actions' },
      h('a', { class: 'primary-button', href: `#/exercises/${encodeURIComponent(lesson.id)}` }, t('lesson.exercises')),
    ),
    glossaryCard(t),
  ));

  const unwireGlossary = wireGlossary(container, lesson.glossary);
  return () => {
    unwireGlossary();
    readAloud.cleanup();
  };
}
