import { resolveRoute } from './router.js';
import { createTranslator } from './i18n.js';
import * as homeView from './views/home.js';
import * as lessonsView from './views/lessons.js';
import * as exercisesView from './views/exercises.js';
import * as progressView from './views/progress.js';

const VIEWS = {
  home: homeView,
  lessons: lessonsView,
  exercises: exercisesView,
  progress: progressView,
};

const TABS = Object.keys(VIEWS);

/** Loads the pt-BR strings; returns an empty dictionary if they cannot be fetched. */
async function loadStrings() {
  try {
    const response = await fetch(new URL('../locales/pt-BR.json', import.meta.url));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Could not load translations:', error);
    return {};
  }
}

/** Fills every element marked with data-i18n or data-i18n-aria-label. */
function applyStaticStrings(t) {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
  });
}

/** Renders the view for the current hash and highlights its tab. */
function renderRoute(t) {
  const route = resolveRoute(window.location.hash, TABS);
  const view = VIEWS[route];
  const container = document.getElementById('view');

  view.render(container, t);
  container.scrollTop = 0;

  document.querySelectorAll('.tab-bar a').forEach((link) => {
    if (link.dataset.route === route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const tabName = t(`tabs.${route}`);
  document.title = route === 'home' ? t('app.name') : `${tabName} · ${t('app.name')}`;
}

async function start() {
  const t = createTranslator(await loadStrings());
  applyStaticStrings(t);
  renderRoute(t);
  window.addEventListener('hashchange', () => renderRoute(t));
}

start();
