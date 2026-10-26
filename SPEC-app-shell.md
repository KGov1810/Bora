# Spec: app-shell

Module from `CAPABILITY-MAP.md`. Status: **approved 2026-10-26**.

## Objective

Provide the empty shell of the app. The other modules plug into it later. The shell must look and feel like a native app on an iPhone.

### User stories

- As the learner, I open the site in Safari, tap *Compartilhar → Adicionar à Tela de Início*, and get an icon on my home screen.
- When I open the app from that icon, it launches full screen, with no Safari bar. The app content sits clear of the notch and the home indicator.
- I see a bottom tab bar with four tabs, labelled in Brazilian Portuguese: **Início**, **Lições**, **Exercícios** and **Progresso**. Each tab shows its own screen.
- Every visible text in the interface is in Brazilian Portuguese.
- The app follows my iPhone's light or dark mode.

### Also included: speech feasibility spike (step 0 of the build order)

A standalone test page at `spikes/speech-test.html`, served with the shell over HTTPS. HTTPS is required for microphone access. The page will be deleted once the `speech` module has been specified.

It tests four things:

1. **Text-to-speech:** read an English sentence aloud with an `en-US` voice, then with an `en-GB` voice.
2. **Speech recognition:** use `webkitSpeechRecognition` with `lang="en-US"` and show the transcript.
3. **iOS keyboard dictation:** a plain text field to try it as a fallback.
4. **Environment display:** show whether the page is running in Safari or as an installed app, and which APIs are available.

The test is run twice: once in Safari, and once from the home-screen icon. The results are recorded in `docs/spikes/speech-results.md`.

## Tech Stack

- **Languages:** HTML5, CSS, and JavaScript as ES modules. No framework, no build step, no runtime dependencies.
- **PWA:** a Web App Manifest and a service worker that caches the shell files.
- **Hosting:** GitHub Pages, from the `main` branch of `KGov1810/Bora`. The site is served under the sub-path `/Bora/`, so all paths must be **relative**.
- **Routing:** hash-based (`#/lessons`). This works on GitHub Pages without any 404 configuration.

## Commands

```
Dev server (local):     python3 -m http.server 8000
Dev server (LAN/phone): python3 -m http.server 8000 --bind 0.0.0.0
Unit tests:             node --test
```

The unit tests use Node.js's built-in test runner (Node ≥ 18), with no dependencies. Claude runs them in its workspace; the owner does not need Node.js installed.

Testing on the iPhone requires HTTPS, because of the service worker and the microphone. The real-device check is therefore done on GitHub Pages after deployment, not over the LAN.

## Project Structure

```
index.html              → Single page: shell, tab bar, view container
manifest.webmanifest    → PWA manifest (name, icons, colors, display: standalone)
sw.js                   → Service worker (shell cache, versioned)
css/
  base.css              → Mobile baseline, color tokens, light/dark themes
  layout.css            → App shell, tab bar, safe areas
js/
  app.js                → Entry point: registers service worker, starts router
  router.js             → Hash router (pure logic, unit-tested)
  i18n.js               → String lookup by key (pure logic, unit-tested)
  views/                → One module per tab: home.js, lessons.js, exercises.js, progress.js
locales/
  pt-BR.json            → All UI strings
icons/                  → App icons (180x180 apple-touch-icon, 192, 512)
spikes/
  speech-test.html      → Temporary speech feasibility page
tests/                  → node:test unit tests
docs/                   → Specs, spike results
```

## Code Style

The code style follows these conventions:

- Code, comments and identifiers are in English. Only `locales/pt-BR.json` contains Portuguese.
- No visible text is hard-coded in HTML or JS. Every string goes through `t('key')`.
- The pure logic modules (`router.js`, `i18n.js`) never touch the DOM, so they can be tested with Node.

Example:

```js
// js/router.js
/**
 * Resolves a location hash to a known route name.
 * Falls back to the default route for unknown or empty hashes.
 */
export function resolveRoute(hash, routes, defaultRoute = 'home') {
  const name = hash.replace(/^#\/?/, '').split('/')[0];
  return routes.includes(name) ? name : defaultRoute;
}
```

### Mobile baseline (mandatory)

- **Viewport:** `viewport-fit=cover`.
- **Safe areas:** `env(safe-area-inset-*)` padding on the header and the tab bar.
- **Height:** `100dvh` for the shell.
- **Inputs:** font size of at least 16px, so Safari does not zoom in on focus.
- **Taps:**
  - no tap highlight flash;
  - `touch-action: manipulation` on controls;
  - `user-select: none` on controls only;
  - press feedback through `:active`;
  - hover effects wrapped in `@media (hover: hover) and (pointer: fine)`.
- **Overscroll:** `overscroll-behavior: none` on `html` and `body`.
- **Status bar:** one `theme-color` value per color scheme, plus `apple-mobile-web-app-status-bar-style`.
- **Zoom:** zoom is never disabled, so no `user-scalable=no`.

## Testing Strategy

- **Unit tests** with `node --test` cover the pure modules: route resolution (known, unknown and empty hashes) and i18n lookup (existing key, missing key, fallback).
- **Manual checklist on a real iPhone**, run after each deployment. This is mandatory, because desktop emulation does not reproduce these behaviours:
  - [ ] Installing to the home screen works, and the icon and name are correct.
  - [ ] The app opens full screen, with no Safari interface.
  - [ ] Nothing is hidden under the notch or the home indicator.
  - [ ] All four tabs work.
  - [ ] Light and dark mode are both correct.
  - [ ] There is no tap flash and no lag on tap.
  - [ ] After a redeployment, the new version loads (cache update).
- **Speech spike:** run the test page in Safari and in installed mode, and record the results.

## Boundaries

- **Always:**
  - use relative paths;
  - run `node --test` before proposing a commit;
  - put every UI string in `pt-BR.json`;
  - bump the cache version in `sw.js` on every deployment.
- **Ask first:**
  - adding any dependency or build step;
  - changing the routing scheme;
  - any commit or push (per your general instructions).
- **Never:**
  - put an API key or secret in the front end;
  - disable zoom;
  - hard-code Portuguese text in JS or HTML.

## Brand

- **App name:** **Bora!** (Brazilian Portuguese for "let's go!"). It is used as the manifest `name` and `short_name`, and as the home-screen label.
- **Icon:** an "EN" monogram in cream on an orange rounded square, with a short ink-colored bar underneath (option C on the design canvas). The icon is exported as PNG files at 180×180 (apple-touch-icon), 192×192 and 512×512.

The color tokens are defined in `css/base.css`:

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-brand` | `#E8613C` | `#E8613C` | Icon, large surfaces, manifest `theme_color` |
| `--color-primary` | `#C2410C` | `#FF8A5B` | Active tab, links, primary text accents |
| `--color-accent` | `#2B2D42` | `#FFF4E6` | Secondary emphasis |
| `--color-bg` | `#FFF8F2` | `#1D1B22` | Page background, `theme-color` per scheme |
| `--color-text` | `#18181B` | `#F4F4F5` | Body text |
| `--color-muted` | `#52525B` | `#A1A1AA` | Inactive tabs, secondary text |

The primary color is lighter in dark mode, because `#C2410C` does not have enough contrast on the dark background. Every text and background pair must reach at least 4.5:1 contrast.

## Success Criteria

1. The site is deployed on GitHub Pages over HTTPS.
2. It can be installed on her iPhone and opens in standalone mode.
3. The four tabs work and are labelled in Brazilian Portuguese.
4. The real-device checklist passes in full.
5. `node --test` passes.
6. The speech spike results are recorded and give a clear decision: either native speech recognition or iOS dictation for the `speech` module.

## Open Questions

None. Resolved:

- **App name and icon:** **Bora!**, option C (see Brand).
- **Repository:** `https://github.com/KGov1810/Bora`, served at `https://kgov1810.github.io/Bora/`. The path is case-sensitive.
- **Spec language:** English, like the code.
- **Node.js:** not installed on the owner's computer. Claude runs `node --test` in its own workspace and reports the result before proposing any commit.
