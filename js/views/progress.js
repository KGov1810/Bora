import { h } from '../dom.js';
import { API_BASE_URL } from '../config.js';
import { createApiClient } from '../api/client.js';
import { createCodeStore } from '../api/storage.js';

const RESULT_MESSAGES = {
  invalid_code: 'progress.connect.invalid',
  offline: 'progress.connect.offline',
  server_error: 'progress.connect.serverError',
};

/** The card shown once the code is saved on this device. */
function connectedCard(t, onDisconnect) {
  const disconnectButton = h('button', { type: 'button', class: 'secondary-button' }, t('progress.connect.disconnect'));
  disconnectButton.addEventListener('click', onDisconnect);
  return h(
    'section',
    { class: 'connection-card is-connected', 'aria-labelledby': 'connection-title' },
    h('h2', { id: 'connection-title' }, t('progress.connect.title')),
    h('p', { class: 'connection-status', role: 'status' }, h('span', { class: 'status-dot', 'aria-hidden': 'true' }), t('progress.connect.connected')),
    h('p', { class: 'connection-help' }, t('progress.connect.connectedHelp')),
    disconnectButton,
  );
}

/** The card with the access code form. */
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

/**
 * Renders the Progresso tab: for now, the connection to the Bora! server.
 * Lessons and exercises never depend on it.
 */
export function render(container, t) {
  const store = createCodeStore();
  const client = createApiClient({ baseUrl: API_BASE_URL });

  const draw = (justConnected = false) => {
    const savedCode = store.get();
    const card = savedCode
      ? connectedCard(t, () => {
        store.clear();
        draw();
      })
      : connectForm(t, client, (code) => {
        if (!store.set(code)) console.error('Could not save the access code on this device.');
        draw(true);
      });

    container.replaceChildren(h(
      'div',
      { class: 'page' },
      h('h1', {}, t('progress.title')),
      h('p', { class: 'intro' }, t('progress.intro')),
      card,
      h('p', { class: 'empty-state' }, t('progress.soon')),
    ));
    if (justConnected) container.querySelector('.connection-status')?.focus?.();
  };

  draw();
}
