# Tasks: app-shell (Bora!)

Plan: `tasks/plan.md`. Definition of done for every task: unit tests pass (`node --test`, run by Claude), no regression on earlier screens, the owner approved the commit.

## Task 1: Deployable placeholder page and speech test page

**Description:** Put a minimal page online at `https://kgov1810.github.io/Bora/` and add the speech test page from the spec. The test page has its own small manifest, so it can also be added to the home screen and tested in installed mode.

**Acceptance criteria:**
- [x] `index.html` loads on GitHub Pages and shows "Bora!" with a link to the speech test page.
- [x] The speech test page offers four tests: read a sentence aloud in `en-US` and `en-GB`, speech recognition in `en-US` with the transcript shown, a text field for iOS dictation, and an environment panel (Safari or installed, which APIs exist).
- [x] Every visible text on the test page is in pt-BR.

**Verification:**
- [x] Manual check (Claude): both pages open locally with `python3 -m http.server 8000`, with no console errors.
- [x] Manual check (owner): after the push, both pages open on the iPhone over HTTPS.

**Dependencies:** None. The owner enables GitHub Pages before the first check.

**Files likely touched:**
- `index.html`
- `spikes/speech-test.html`
- `spikes/manifest.webmanifest`
- `docs/spikes/speech-results.md` (template, filled in at Checkpoint 0)

**Estimated scope:** Small to medium (4 files)

## Checkpoint 0: Speech feasibility
- [x] Speech test run on her iPhone, in Safari and from the home screen
- [x] Results recorded in `docs/spikes/speech-results.md`
- [x] Decision noted: native recognition, with iOS dictation as fallback

## Task 2: Router and i18n logic, with unit tests

**Description:** Write the two pure modules from the spec, test first. `resolveRoute` maps a hash to a known tab and falls back to `home`. `createTranslator` returns a `t(key)` function that looks up a string and returns the key itself when it is missing.

**Acceptance criteria:**
- [x] `resolveRoute` handles known, unknown, empty and nested hashes (`#/lessons/12` gives `lessons`).
- [x] `t(key)` returns the string for an existing key, and the key itself for a missing one.
- [x] Neither module touches the DOM.

**Verification:**
- [x] Tests pass: `node --test`

**Dependencies:** None

**Files likely touched:**
- `js/router.js`
- `js/i18n.js`
- `tests/router.test.js`
- `tests/i18n.test.js`

**Estimated scope:** Small (4 short files)

## Task 3: Shell with tab bar and the Início screen

**Description:** Replace the placeholder page with the real shell: header, view area, and a bottom tab bar with four tabs. Only the Início screen exists yet; the other tabs fall back to it. Includes the color tokens of the Brand section and the full mobile baseline of the spec.

**Acceptance criteria:**
- [x] Tapping a tab changes the hash and highlights the active tab in `--color-primary`.
- [x] Every visible string comes from `locales/pt-BR.json`.
- [x] Light and dark themes follow the iPhone setting; content clears the notch and the home indicator.

**Verification:**
- [x] Tests pass: `node --test`
- [x] Manual check (Claude): local server, no console errors, tabs work.
- [x] Manual check (owner): tabs and both themes on the iPhone in Safari.

**Dependencies:** Task 2

**Files likely touched:**
- `index.html`
- `css/base.css`
- `css/layout.css`
- `js/app.js`
- `js/dom.js` (small DOM helper, added during implementation)
- `js/views/home.js`
- `locales/pt-BR.json`

**Estimated scope:** Medium (6 files, most of them new and short)

## Task 4: Placeholder screens for Lições, Exercícios and Progresso

**Description:** Add one view module per remaining tab, each with a title and a short pt-BR message saying the section is coming soon.

**Acceptance criteria:**
- [x] Each tab shows its own screen.
- [x] Reloading the page on any tab keeps that tab open.

**Verification:**
- [x] Tests pass: `node --test`
- [x] Manual check (Claude): every tab and every reload works locally.

**Dependencies:** Task 3

**Files likely touched:**
- `js/views/lessons.js`
- `js/views/exercises.js`
- `js/views/progress.js`
- `js/views/coming-soon.js` (shared placeholder, added during implementation)
- `js/app.js`, `css/layout.css` (view registration and section styles)
- `locales/pt-BR.json`

**Estimated scope:** Small (4 files)

## Checkpoint 1: Navigation
- [x] Unit tests pass
- [x] All four tabs work on her iPhone in Safari, in light and dark mode
- [x] Review with the owner

## Task 5: App icon and web app manifest

**Description:** Draw the option C icon as an SVG source with the letters as paths, export the PNG sizes, and add the manifest and the iOS meta tags, so that "Adicionar à Tela de Início" gives the "Bora!" icon and a full-screen launch.

**Acceptance criteria:**
- [x] The icon PNGs (180, 192, 512) match the chosen design; the owner approves a preview before the commit.
- [x] From the home screen, the app opens full screen with the name "Bora!".
- [x] The status bar color matches the page in both themes.

**Verification:**
- [x] Manual check (Claude): the manifest is valid JSON and every icon path resolves locally.
- [x] Manual check (owner): install on the iPhone and open from the home screen.

**Dependencies:** Task 3

**Files likely touched:**
- `icons/icon.svg` (letters changed from EN to BR at the owner's request)
- `icons/apple-touch-icon.png`, `icons/icon-192.png`, `icons/icon-512.png`
- `manifest.webmanifest`
- `index.html`

**Estimated scope:** Small to medium (generated PNGs plus 3 files)

## Task 6: Service worker with versioned cache

**Description:** Cache the shell files so the app opens fast, and make sure a new deployment replaces the old version. The cache name holds a version constant that is bumped at every deployment.

**Acceptance criteria:**
- [x] The app opens from the home screen with no network delay on the second launch.
- [x] After a deployment with a new version number, the next launch shows the new version.
- [x] Old caches are deleted when the new service worker activates.

**Verification:**
- [x] Tests pass: `node --test`
- [x] Manual check (Claude): local server, the service worker registers with no console errors.
- [x] Manual check (owner): deploy a visible change and confirm it appears on the iPhone.

**Dependencies:** Tasks 4 and 5

**Files likely touched:**
- `sw.js`
- `js/app.js`
- `tests/sw.test.js` (checks the cached file list, added during implementation)

**Estimated scope:** Small (2 files)

## Checkpoint 2: Complete
- [x] The full real-device checklist of the spec passes
- [x] Every success criterion of the spec is met
- [x] Review with the owner before starting the next module
