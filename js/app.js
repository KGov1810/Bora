import { parseRoute } from './router.js';
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

let renderCount = 0;
let cleanupView = null;

/**
 * Renders the view for the current hash and highlights its tab.
 * Views receive a context: the route parameter, a way to know whether they are
 * still on screen after an await, and a way to set the page title. A view may
 * return a cleanup function, called before the next view renders.
 */
function renderRoute(t) {
  const { name, param } = parseRoute(window.location.hash, TABS);
  const container = document.getElementById('view');
  const renderId = ++renderCount;

  if (cleanupView) cleanupView();
  cleanupView = null;

  const setTitle = (title) => {
    document.title = title ? `${title} · ${t('app.name')}` : t('app.name');
  };
  setTitle(name === 'home' ? '' : t(`tabs.${name}`));

  const result = VIEWS[name].render(container, t, {
    param,
    isCurrent: () => renderId === renderCount,
    setTitle,
  });
  Promise.resolve(result).then((cleanup) => {
    if (typeof cleanup !== 'function') return;
    if (renderId === renderCount) cleanupView = cleanup;
    else cleanup();
  });
  container.scrollTop = 0;

  document.querySelectorAll('.tab-bar a').forEach((link) => {
    if (link.dataset.route === name) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

/**
 * Registers the service worker and reloads once when a new version takes over,
 * so a deployment shows up without closing the app.
 */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // A first install has no previous controller: no reload needed then.
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  navigator.serviceWorker
    .register(new URL('../sw.js', import.meta.url))
    .then((registration) => {
      // Installed iPhone apps resume without reloading: check for updates on return.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update();
      });
    })
    .catch((error) => console.error('Service worker registration failed:', error));
}

async function start() {
  const t = createTranslator(await loadStrings());
  applyStaticStrings(t);
  renderRoute(t);
  window.addEventListener('hashchange', () => renderRoute(t));
  registerServiceWorker();
}

start();
