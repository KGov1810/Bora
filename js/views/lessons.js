import { h } from '../dom.js';
import { loadCourse } from '../content/load.js';
import { renderLesson, renderContentError } from './lesson.js';

/** Builds one lesson link: position, pt-BR title and duration. */
function lessonLink(lesson, position, t) {
  return h(
    'li',
    {},
    h(
      'a',
      { class: 'lesson-link', href: `#/lessons/${encodeURIComponent(lesson.id)}` },
      h('span', { class: 'lesson-number', 'aria-hidden': 'true' }, String(position)),
      h(
        'span',
        { class: 'lesson-link-text' },
        h('span', { class: 'lesson-link-title' }, lesson.title),
        h('span', { class: 'lesson-link-meta' }, t('lessons.minutes').replace('{n}', String(lesson.estimatedMinutes))),
      ),
    ),
  );
}

/** Renders the list of levels, units and lessons from the learning path. */
async function renderList(container, t, context) {
  container.replaceChildren(h('p', { class: 'loading' }, t('lessons.loading')));

  let course;
  try {
    course = await loadCourse();
  } catch (error) {
    if (context.isCurrent()) renderContentError(container, t, 'lessons.error.course', error);
    return;
  }
  if (!context.isCurrent()) return;

  const levels = course.path.levels.map((level) => h(
    'section',
    { class: 'level', 'aria-labelledby': `level-${level.level}` },
    h('h2', { id: `level-${level.level}` }, t('lessons.level').replace('{level}', level.level)),
    ...level.units.map((unit) => h(
      'section',
      { class: 'unit', 'aria-labelledby': `unit-${unit.id}` },
      h('h3', { id: `unit-${unit.id}` }, unit.title),
      h('ol', { class: 'lesson-list' }, ...unit.lessons.map((id, index) => lessonLink(course.lessons[id], index + 1, t))),
    )),
  ));

  container.replaceChildren(h(
    'div',
    { class: 'page' },
    h('h1', {}, t('lessons.title')),
    h('p', { class: 'intro' }, t('lessons.intro')),
    ...(levels.length > 0 ? levels : [h('p', { class: 'empty-state' }, t('lessons.soon'))]),
  ));
}

/**
 * Renders the Lições tab: the list, or one lesson when the route has a parameter.
 *
 * @param {HTMLElement} container - The view container to fill.
 * @param {(key: string) => string} t - The translation function.
 * @param {{ param: string | null, isCurrent: () => boolean, setTitle: (title: string) => void }} context
 * @returns {Promise<(() => void) | void>} An optional cleanup function.
 */
export function render(container, t, context) {
  if (context.param) return renderLesson(container, t, context);
  return renderList(container, t, context);
}
