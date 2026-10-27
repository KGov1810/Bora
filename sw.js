// Service worker for Bora!: caches the app shell so it opens fast.
// Bump CACHE_VERSION on every deployment, or the installed app keeps the old files.

const CACHE_VERSION = 'v8';
const CACHE_NAME = `bora-shell-${CACHE_VERSION}`;

// Lesson files: network first, then this cache as a fallback. Not versioned,
// so lessons opened once stay available offline across app updates.
const CONTENT_CACHE = 'bora-content';

// Paths are relative to the service worker's scope (/Bora/ on GitHub Pages).
const SHELL_FILES = [
  './',
  'index.html',
  'manifest.webmanifest?v=3',
  'css/base.css',
  'css/layout.css',
  'css/lesson.css',
  'css/exercises.css',
  'js/app.js',
  'js/content/load.js',
  'js/content/text.js',
  'js/content/validate.js',
  'js/dom.js',
  'js/exercises/grade.js',
  'js/exercises/session.js',
  'js/exercises/shuffle.js',
  'js/i18n.js',
  'js/router.js',
  'js/speech/read-aloud.js',
  'js/speech/voices.js',
  'js/views/coming-soon.js',
  'js/views/exercise-session.js',
  'js/views/exercises.js',
  'js/views/home.js',
  'js/views/lesson.js',
  'js/views/lessons.js',
  'js/views/progress.js',
  'locales/pt-BR.json',
  'icons/apple-touch-icon.png?v=3',
  'icons/icon-192.png?v=3',
  'icons/icon-512.png?v=3',
  'icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // cache: 'reload' skips the browser's HTTP cache (GitHub Pages caches files
      // for 10 minutes), so a new version never stores files from the old one.
      .then((cache) => cache.addAll(SHELL_FILES.map((path) => new Request(path, { cache: 'reload' }))))
      // Activate as soon as the new files are cached; the page reloads itself.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith('bora-shell-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ))
      .then(() => self.clients.claim()),
  );
});

/** Network first for content files: always fresh online, last version offline. */
async function contentResponse(request) {
  const cache = await caches.open(CONTENT_CACHE);
  try {
    // 'no-cache' revalidates with the server instead of trusting the HTTP cache.
    const response = await fetch(request, { cache: 'no-cache' });
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

/** Cache first for the app shell, with the cached shell as an offline page. */
async function shellResponse(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    return await fetch(request);
  } catch (error) {
    if (request.mode === 'navigate') {
      const shell = await caches.match('./');
      if (shell) return shell;
    }
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const contentPath = new URL('content/', self.registration.scope).pathname;
  event.respondWith(url.pathname.startsWith(contentPath) ? contentResponse(request) : shellResponse(request));
});
