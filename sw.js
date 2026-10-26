// Service worker for Bora!: caches the app shell so it opens fast.
// Bump CACHE_VERSION on every deployment, or the installed app keeps the old files.

const CACHE_VERSION = 'v2';
const CACHE_NAME = `bora-shell-${CACHE_VERSION}`;

// Paths are relative to the service worker's scope (/Bora/ on GitHub Pages).
const SHELL_FILES = [
  './',
  'index.html',
  'manifest.webmanifest?v=3',
  'css/base.css',
  'css/layout.css',
  'js/app.js',
  'js/content/validate.js',
  'js/dom.js',
  'js/i18n.js',
  'js/router.js',
  'js/views/coming-soon.js',
  'js/views/exercises.js',
  'js/views/home.js',
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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      return await fetch(request);
    } catch (error) {
      // Offline page load: fall back to the cached shell.
      if (request.mode === 'navigate') {
        const shell = await caches.match('./');
        if (shell) return shell;
      }
      throw error;
    }
  })());
});
