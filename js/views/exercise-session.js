import { h } from '../dom.js';
import { loadLesson } from '../content/load.js';
import { createSession } from '../exercises/session.js';
import { shuffle } from '../exercises/shuffle.js';
import { renderContentError } from './lesson.js';

const CHECK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';

/** Builds an icon element from a trusted, hard-coded SVG string. */
function icon(svg) {
  const template = document.createElement('template');
  template.innerHTML = svg;
  return template.content.firstElementChild;
}

/** Replaces {name} placeholders in a translated string. */
function format(text, values) {
  return Object.entries(values).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), text);
}

/** The right answer as shown to the learner (true-false is translated). */
function displayedAnswer(exercise, expected, t) {
  if (exercise.type === 'true-false') return t(expected === 'true' ? 'exercises.true' : 'exercises.false');
  return expected;
}

/** The question as shown in the summary. */
function questionText(exercise) {
  if (exercise.type === 'true-false') return exercise.statement;
  if (exercise.type === 'fill-blank') return exercise.sentence;
  return exercise.prompt;
}

/** Header: back link to the lesson, position and progress bar. */
function sessionHeader(lessonId, current, t) {
  const done = current.position - 1;
  return h(
    'div',
    { class: 'session-header' },
    h('a', { class: 'back-link', href: `#/lessons/${encodeURIComponent(lessonId)}` }, t('exercises.back')),
    h('span', { class: 'session-count' }, format(t('exercises.position'), { n: current.position, total: current.total })),
    h(
      'div',
      {
        class: 'progress-track',
        role: 'progressbar',
        'aria-label': t('exercises.progress'),
        'aria-valuemin': '0',
        'aria-valuemax': String(current.total),
        'aria-valuenow': String(done),
      },
      h('div', { class: 'progress-fill', style: `width: ${(done / current.total) * 100}%` }),
    ),
  );
}

/** Feedback panel shown after an answer. */
function feedbackPanel(exercise, result, isLast, t, onContinue) {
  const continueButton = h('button', { type: 'button', class: 'primary-button' }, t(isLast ? 'exercises.seeResult' : 'exercises.continue'));
  continueButton.addEventListener('click', onContinue);
  const panel = h(
    'div',
    { class: `feedback ${result.correct ? 'is-correct' : 'is-wrong'}`, role: 'status' },
    h(
      'p',
      { class: 'feedback-title' },
      icon(result.correct ? CHECK_ICON : CROSS_ICON),
      t(result.correct ? 'exercises.feedback.correct' : 'exercises.feedback.wrong'),
    ),
    result.correct ? null : h(
      'p',
      { class: 'feedback-expected' },
      format(t('exercises.feedback.expected'), { answer: displayedAnswer(exercise, result.expected, t) }),
    ),
    h('p', { class: 'feedback-explanation' }, exercise.explanation),
    continueButton,
  );
  return { panel, continueButton };
}

/** Multiple choice: shuffled options; tapping one answers. */
function choiceBody(exercise, submit) {
  const order = shuffle(exercise.options.map((_, index) => index));
  const buttons = order.map((index) => {
    const button = h('button', { type: 'button', class: 'option-button', 'data-index': String(index) }, exercise.options[index]);
    button.addEventListener('click', () => submit(index, button));
    return button;
  });
  return {
    element: h('div', {}, h('h2', { class: 'exercise-prompt' }, exercise.prompt), h('div', { class: 'options' }, ...buttons)),
    lock(response) {
      buttons.forEach((button) => {
        button.disabled = true;
        const index = Number(button.dataset.index);
        if (index === exercise.answer) button.dataset.state = 'correct';
        else if (index === response) button.dataset.state = 'wrong';
      });
    },
  };
}

/** True or false: an English statement and two buttons. */
function trueFalseBody(exercise, submit, t) {
  const buttons = [true, false].map((value) => {
    const button = h('button', { type: 'button', class: 'option-button', 'data-value': String(value) }, t(value ? 'exercises.true' : 'exercises.false'));
    button.addEventListener('click', () => submit(value, button));
    return button;
  });
  return {
    element: h(
      'div',
      {},
      h('h2', { class: 'exercise-prompt' }, t('exercises.trueFalse.prompt')),
      h('p', { class: 'exercise-sentence', lang: 'en' }, exercise.statement),
      h('div', { class: 'options options-row' }, ...buttons),
    ),
    lock(response) {
      buttons.forEach((button) => {
        button.disabled = true;
        const value = button.dataset.value === 'true';
        if (value === exercise.answer) button.dataset.state = 'correct';
        else if (value === response) button.dataset.state = 'wrong';
      });
    },
  };
}

/** Fill in the blank: the sentence, an optional hint and a text field. */
function fillBlankBody(exercise, submit, t) {
  const [before, after] = exercise.sentence.split('___');
  const input = h('input', {
    type: 'text',
    id: 'fill-answer',
    class: 'answer-input',
    lang: 'en',
    autocomplete: 'off',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    enterkeyhint: 'done',
    placeholder: t('exercises.answer.placeholder'),
  });
  const checkButton = h('button', { type: 'submit', class: 'primary-button', disabled: '' }, t('exercises.check'));
  input.addEventListener('input', () => {
    checkButton.disabled = input.value.trim() === '';
  });
  const form = h(
    'form',
    { class: 'answer-form' },
    h('label', { for: 'fill-answer', class: 'visually-hidden' }, t('exercises.answer.label')),
    input,
    checkButton,
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (input.value.trim() !== '') submit(input.value);
  });

  // When the keyboard opens, iOS scrolls the field into view and can push the
  // instruction off screen. Once the keyboard is up, bring the instruction back
  // to the top: the whole exercise fits above the keyboard on an iPhone.
  const prompt = h('h2', { class: 'exercise-prompt' }, exercise.prompt);
  input.addEventListener('focus', () => {
    const showPrompt = () => prompt.scrollIntoView({ block: 'start', behavior: 'smooth' });
    const viewport = window.visualViewport;
    if (viewport) viewport.addEventListener('resize', showPrompt, { once: true });
    setTimeout(showPrompt, 400); // fallback when no resize event fires
  });

  return {
    element: h(
      'div',
      {},
      prompt,
      h('p', { class: 'exercise-sentence', lang: 'en' }, before, h('span', { class: 'blank', 'aria-label': '___' }, '_____'), after),
      exercise.hint ? h('p', { class: 'exercise-hint' }, format(t('exercises.hint'), { hint: exercise.hint })) : null,
      form,
    ),
    lock() {
      input.disabled = true;
      checkButton.hidden = true;
    },
  };
}

/** Reorder: shuffled word chips moved between the bank and the answer line. */
function reorderBody(exercise, submit, t) {
  // Chips are tracked by their position in `words`, since a word can appear twice.
  const placed = [];
  let bank = shuffle(exercise.words.map((_, index) => index));
  let locked = false;

  const answerLine = h('div', { class: 'reorder-answer', role: 'group', 'aria-label': t('exercises.reorder.answer') });
  const bankArea = h('div', { class: 'reorder-bank', role: 'group', 'aria-label': t('exercises.reorder.bank') });
  const checkButton = h('button', { type: 'button', class: 'primary-button', disabled: '' }, t('exercises.check'));

  const chip = (index, inAnswer) => {
    const button = h('button', { type: 'button', class: 'chip-button', lang: 'en' }, exercise.words[index]);
    button.disabled = locked;
    button.addEventListener('click', () => {
      if (inAnswer) {
        placed.splice(placed.indexOf(index), 1);
        bank = [...bank, index];
      } else {
        bank = bank.filter((item) => item !== index);
        placed.push(index);
      }
      draw();
    });
    return button;
  };

  const draw = () => {
    answerLine.replaceChildren(
      ...(placed.length > 0 ? placed.map((index) => chip(index, true)) : [h('span', { class: 'reorder-placeholder' }, t('exercises.reorder.empty'))]),
    );
    bankArea.replaceChildren(...bank.map((index) => chip(index, false)));
    checkButton.disabled = locked || bank.length > 0;
  };

  checkButton.addEventListener('click', () => submit(placed.map((index) => exercise.words[index])));
  draw();

  return {
    element: h('div', {}, h('h2', { class: 'exercise-prompt' }, exercise.prompt), answerLine, bankArea, checkButton),
    lock() {
      locked = true;
      checkButton.hidden = true;
      draw();
    },
  };
}

const BODIES = {
  choice: choiceBody,
  'true-false': trueFalseBody,
  'fill-blank': fillBlankBody,
  reorder: reorderBody,
};

/**
 * Renders the exercises of one lesson, one at a time, then the summary.
 *
 * @returns {Promise<void>}
 */
export async function renderExerciseSession(container, t, context) {
  container.replaceChildren(h('p', { class: 'loading' }, t('lessons.loading')));

  let lesson;
  try {
    lesson = await loadLesson(context.param);
  } catch (error) {
    if (context.isCurrent()) {
      const missing = /does not exist|Unknown lesson/.test(error.message);
      renderContentError(container, t, missing ? 'lessons.error.missing' : 'lessons.error.lesson', error);
    }
    return;
  }
  if (!context.isCurrent()) return;
  context.setTitle(lesson.title);

  let session = createSession(lesson.exercises);

  const showSummary = () => {
    const { correct, total } = session.score();
    const mistakes = session.mistakes();
    const retryButton = mistakes.length > 0 ? h('button', { type: 'button', class: 'primary-button' }, t('exercises.summary.retry')) : null;
    retryButton?.addEventListener('click', () => {
      session = session.retryMistakes();
      show();
    });

    container.replaceChildren(h(
      'div',
      { class: 'summary' },
      h('h1', {}, t('exercises.summary.title')),
      h('p', { class: 'summary-score' }, format(t('exercises.summary.score'), { correct, total })),
      h('p', { class: 'intro' }, t(mistakes.length === 0 ? 'exercises.summary.perfect' : 'exercises.summary.review')),
      mistakes.length === 0 ? null : h(
        'section',
        { class: 'summary-mistakes', 'aria-labelledby': 'mistakes-title' },
        h('h2', { id: 'mistakes-title' }, t('exercises.summary.mistakes')),
        h('ul', {}, ...mistakes.map(({ exercise, result }) => h(
          'li',
          {},
          h('span', { class: 'mistake-question', lang: exercise.type === 'true-false' || exercise.type === 'fill-blank' ? 'en' : 'pt-BR' }, questionText(exercise)),
          h('span', { class: 'mistake-answer' }, format(t('exercises.feedback.expected'), { answer: displayedAnswer(exercise, result.expected, t) })),
        ))),
      ),
      h(
        'div',
        { class: 'summary-actions' },
        retryButton,
        h('a', { class: 'secondary-button', href: `#/lessons/${encodeURIComponent(lesson.id)}` }, t('exercises.summary.backToLesson')),
      ),
    ));
    container.scrollTop = 0;
  };

  const showExercise = () => {
    const current = session.current();
    const { exercise } = current;
    const isLast = current.position === current.total;
    const area = h('div', { class: 'exercise' });

    const submit = (response) => {
      const result = session.answer(response);
      body.lock(response);
      const { panel, continueButton } = feedbackPanel(exercise, result, isLast, t, () => {
        session.next();
        show();
      });
      area.append(panel);
      panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      continueButton.focus({ preventScroll: true });
    };

    const makeBody = BODIES[exercise.type];
    const body = makeBody(exercise, submit, t);
    area.append(body.element);

    container.replaceChildren(h('div', { class: 'session' }, sessionHeader(lesson.id, current, t), area));
    container.scrollTop = 0;
  };

  const show = () => (session.isFinished() ? showSummary() : showExercise());
  show();
}
