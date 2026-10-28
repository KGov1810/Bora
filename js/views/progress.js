import { h } from '../dom.js';
import { API_BASE_URL } from '../config.js';
import { createApiClient } from '../api/client.js';
import { createCodeStore } from '../api/storage.js';
import { loadCourse } from '../content/load.js';
import { recorder } from '../progress/recorder.js';
import { computeProgress, buildOwnerSummary } from '../progress/summary.js';

const SUMMARY_CACHE_KEY = 'bora.lastSummary';

const RESULT_MESSAGES = {
  invalid_code: 'progress.connect.invalid',
  offline: 'progress.connect.offline',
  server_error: 'progress.connect.serverError',
};

/** The last summary received from the server, kept for offline use. */
const summaryCache = {
  get() {
    try {
      const cached = JSON.parse(globalThis.localStorage?.getItem(SUMMARY_CACHE_KEY) ?? 'null');
      return cached && Array.isArray(cached.summary?.rounds) ? cached : null;
    } catch {
      return null;
    }
  },
  set(summary) {
    try {
      globalThis.localStorage?.setItem(SUMMARY_CACHE_KEY, JSON.stringify({ summary, at: new Date().toISOString() }));
    } catch {
      // Offline display is a convenience; nothing else depends on it.
    }
  },
  clear() {
    try {
      globalThis.localStorage?.removeItem(SUMMARY_CACHE_KEY);
    } catch {
      // Same as above.
    }
  },
};

/** Replaces {name} placeholders in a translated string. */
function format(text, values) {
  return Object.entries(values).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), text);
}

/** "1 resposta" or "N respostas" waiting to be sent. */
function pendingText(t, n) {
  return n === 1 ? t('progress.pending.one') : format(t('progress.pending.other'), { n });
}

/** A date and time in Brazilian format. */
function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ---- Connection card ----

function connectedCard(t, onDisconnect) {
  const disconnectButton = h('button', { type: 'button', class: 'secondary-button' }, t('progress.connect.disconnect'));
  disconnectButton.addEventListener('click', onDisconnect);
  return h(
    'section',
    { class: 'connection-card is-connected', 'aria-labelledby': 'connection-title' },
    h('h2', { id: 'connection-title' }, t('progress.connect.title')),
    h('p', { class: 'connection-status' }, h('span', { class: 'status-dot', 'aria-hidden': 'true' }), t('progress.connect.connected')),
    h('p', { class: 'connection-help' }, t('progress.connect.connectedHelp')),
    disconnectButton,
  );
}

function connectForm(t, client, onConnected) {
  const input = h('input', {
    type: 'password',
    id: 'access-code',
    class: 'answer-input',
    autocomplete: 'off',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    enterkeyhint: 'go',
  });
  const toggle = h('button', { type: 'button', class: 'show-toggle', 'aria-controls': 'access-code', 'aria-pressed': 'false' }, t('progress.connect.show'));
  const submit = h('button', { type: 'submit', class: 'primary-button', disabled: '' }, t('progress.connect.submit'));
  const message = h('p', { class: 'connection-message', role: 'status', 'aria-live': 'polite' });

  input.addEventListener('input', () => {
    submit.disabled = input.value.trim() === '';
    message.textContent = '';
    message.className = 'connection-message';
  });
  toggle.addEventListener('click', () => {
    const shown = input.type === 'text';
    input.type = shown ? 'password' : 'text';
    toggle.setAttribute('aria-pressed', String(!shown));
    toggle.textContent = t(shown ? 'progress.connect.show' : 'progress.connect.hide');
  });

  const form = h(
    'form',
    { class: 'connection-card', 'aria-labelledby': 'connection-title' },
    h('h2', { id: 'connection-title' }, t('progress.connect.title')),
    h('p', { class: 'connection-help' }, t('progress.connect.help')),
    h('label', { for: 'access-code', class: 'answer-label' }, t('progress.connect.label')),
    h('div', { class: 'code-row' }, input, toggle),
    submit,
    message,
    h('p', { class: 'connection-note' }, t('progress.connect.installedNote')),
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = input.value.trim();
    if (code === '') return;
    submit.disabled = true;
    input.disabled = true;
    message.className = 'connection-message';
    message.textContent = t('progress.connect.checking');

    const result = await client.checkAccess(code);
    if (result === 'ok') {
      onConnected(code);
      return;
    }
    input.disabled = false;
    submit.disabled = false;
    message.className = 'connection-message is-error';
    message.textContent = t(RESULT_MESSAGES[result]);
    if (result === 'invalid_code') input.select();
  });

  return form;
}

// ---- Progress sections ----

function statsSection(progress, t) {
  const started = progress.lessons.filter((lesson) => lesson.lastAt);
  return h(
    'section',
    { class: 'progress-section', 'aria-labelledby': 'stats-title' },
    h('h2', { id: 'stats-title' }, t('progress.stats.title')),
    h(
      'p',
      { class: 'progress-count' },
      h('span', { class: 'progress-count-number' }, `${progress.practicedCount}`),
      format(t('progress.stats.count'), { total: progress.totalLessons }),
    ),
    h('p', { class: 'connection-help' }, t('progress.stats.rule')),
    started.length === 0
      ? h('p', { class: 'empty-state' }, t('progress.stats.empty'))
      : h('ul', { class: 'progress-lessons' }, ...started.map((lesson) => h(
        'li',
        { 'data-practiced': String(lesson.practiced) },
        h('span', { class: 'progress-lesson-title' }, lesson.title),
        h(
          'span',
          { class: 'progress-lesson-score' },
          lesson.best === null
            ? t('progress.stats.noFullRound')
            : format(t('progress.stats.best'), { best: lesson.best, total: lesson.total }),
          lesson.practiced ? h('span', { class: 'practiced-mark' }, ` ✓ ${t('progress.stats.practiced')}`) : null,
        ),
      ))),
  );
}

function reviewSection(progress, t) {
  return h(
    'section',
    { class: 'progress-section', 'aria-labelledby': 'review-title' },
    h('h2', { id: 'review-title' }, t('progress.review.title')),
    progress.review.length === 0
      ? h('p', { class: 'empty-state' }, t('progress.review.empty'))
      : h('ul', { class: 'review-list' }, ...progress.review.map((item) => h(
        'li',
        {},
        h(
          'a',
          { class: 'review-link', href: `#/exercises/${encodeURIComponent(item.lesson.id)}` },
          h('span', { class: 'review-question', lang: item.exercise.type === 'choice' ? 'pt-BR' : 'en' }, item.question),
          h('span', { class: 'review-lesson' }, item.lesson.title),
        ),
      ))),
  );
}

function ownerSection(summary, course, t) {
  const button = h('button', { type: 'button', class: 'secondary-button' }, t('progress.owner.copy'));
  const fallback = h('textarea', { class: 'owner-summary', readonly: '', hidden: '', 'aria-label': t('progress.owner.title') });
  const status = h('p', { class: 'connection-message', role: 'status', 'aria-live': 'polite' });

  button.addEventListener('click', async () => {
    const text = buildOwnerSummary(summary, course);
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = t('progress.owner.copied');
    } catch {
      fallback.value = text;
      fallback.hidden = false;
      fallback.focus();
      fallback.select();
      status.textContent = t('progress.owner.selectManually');
    }
  });

  return h(
    'section',
    { class: 'progress-section', 'aria-labelledby': 'owner-title' },
    h('h2', { id: 'owner-title' }, t('progress.owner.title')),
    h('p', { class: 'connection-help' }, t('progress.owner.help')),
    button,
    status,
    fallback,
  );
}

/** Status line: last update, pending answers, problems. */
function statusLine(t, { cachedAt, pending, problem }) {
  const parts = [];
  if (problem) parts.push(t(problem));
  if (cachedAt) parts.push(format(t('progress.updatedAt'), { date: formatDate(cachedAt) }));
  if (pending > 0) parts.push(pendingText(t, pending));
  return parts.length === 0 ? null : h('p', { class: 'progress-status', role: 'status' }, parts.join(' · '));
}

/**
 * Renders the Progresso tab: connection, practiced lessons, Para revisar and the
 * owner's summary. Lessons and exercises never depend on it.
 */
export function render(container, t, context) {
  const store = createCodeStore();
  const client = createApiClient({ baseUrl: API_BASE_URL });
  let course = null;
  let state = { summary: summaryCache.get()?.summary ?? null, cachedAt: summaryCache.get()?.at ?? null, problem: null, loading: false };

  const draw = () => {
    if (context && !context.isCurrent()) return;
    const code = store.get();
    const children = [
      h('h1', {}, t('progress.title')),
      h('p', { class: 'intro' }, t('progress.intro')),
    ];

    if (!code) {
      children.push(connectForm(t, client, (newCode) => {
        if (!store.set(newCode)) console.error('Could not save the access code on this device.');
        refresh();
      }));
      const pending = recorder.pending();
      if (pending > 0) children.push(h('p', { class: 'progress-status' }, pendingText(t, pending)));
    } else {
      if (state.summary && course) {
        const progress = computeProgress(state.summary, course);
        children.push(statsSection(progress, t), reviewSection(progress, t));
      } else if (state.loading) {
        children.push(h('p', { class: 'loading' }, t('lessons.loading')));
      }
      const line = statusLine(t, { cachedAt: state.cachedAt, pending: recorder.pending(), problem: state.problem });
      if (line) children.push(line);
      if (state.summary && course) children.push(ownerSection(state.summary, course, t));
      children.push(connectedCard(t, () => {
        store.clear();
        summaryCache.clear();
        state = { summary: null, cachedAt: null, problem: null, loading: false };
        draw();
      }));
    }

    container.replaceChildren(h('div', { class: 'page progress-page' }, ...children));
  };

  const refresh = async () => {
    const code = store.get();
    if (!code) {
      draw();
      return;
    }
    state = { ...state, loading: true, problem: null };
    draw();

    try {
      course = course ?? await loadCourse();
    } catch (error) {
      console.error(error);
    }
    await recorder.sync();
    const result = await client.getSummary(code);
    if (result.status === 'ok') {
      summaryCache.set(result.summary);
      const cached = summaryCache.get();
      state = { summary: result.summary, cachedAt: cached?.at ?? new Date().toISOString(), problem: null, loading: false };
    } else {
      const problem = result.status === 'invalid_code' ? 'progress.connect.codeRejected' : (RESULT_MESSAGES[result.status] ?? 'progress.connect.serverError');
      state = { ...state, problem, loading: false };
    }
    draw();
  };

  refresh();
}
