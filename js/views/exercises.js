import { h } from '../dom.js';
import { loadCourse } from '../content/load.js';
import { renderContentError } from './lesson.js';
import { renderExerciseSession } from './exercise-session.js';

/** Builds one link to a lesson's exercises: pt-BR title and number of exercises. */
function exercisesLink(lesson, position, t) {
  return h(
    'li',
    {},
    h(
      'a',
      { class: 'lesson-link', href: `#/exercises/${encodeURIComponent(lesson.id)}` },
      h('span', { class: 'lesson-number', 'aria-hidden': 'true' }, String(position)),
      h(
        'span',
        { class: 'lesson-link-text' },
        h('span', { class: 'lesson-link-title' }, lesson.title),
        h('span', { class: 'lesson-link-meta' }, t('exercises.count').replace('{n}', String(lesson.exercises.length))),
      ),
    ),
  );
}

/** Lists the lessons, grouped by unit, each opening its exercises. */
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
    { class: 'level', 'aria-labelledby': `exercises-level-${level.level}` },
    h('h2', { id: `exercises-level-${level.level}` }, t('lessons.level').replace('{level}', level.level)),
    ...level.units.map((unit) => h(
      'section',
      { class: 'unit', 'aria-labelledby': `exercises-unit-${unit.id}` },
      h('h3', { id: `exercises-unit-${unit.id}` }, unit.title),
      h('ol', { class: 'lesson-list' }, ...unit.lessons.map((id, index) => exercisesLink(course.lessons[id], index + 1, t))),
    )),
  ));

  container.replaceChildren(h(
    'div',
    { class: 'page' },
    h('h1', {}, t('exercises.title')),
    h('p', { class: 'intro' }, t('exercises.intro')),
    ...(levels.length > 0 ? levels : [h('p', { class: 'empty-state' }, t('exercises.soon'))]),
  ));
}

/**
 * Renders the Exercícios tab: the list, or one lesson's session when the route has a parameter.
 */
export function render(container, t, context) {
  if (context.param) return renderExerciseSession(container, t, context);
  return renderList(container, t, context);
}
