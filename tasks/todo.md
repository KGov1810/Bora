# Tasks: app-shell (Bora!)

Plan: `tasks/plan.md`. Definition of done for every task: unit tests pass (`node --test tests/`, run by Claude), no regression on earlier screens, the owner approved the commit.

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
- [ ] `resolveRoute` handles known, unknown, empty and nested hashes (`#/lessons/12` gives `lessons`).
- [ ] `t(key)` returns the string for an existing key, and the key itself for a missing one.
- [ ] Neither module touches the DOM.

**Verification:**
- [ ] Tests pass: `node --test tests/`

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
- [ ] Tapping a tab changes the hash and highlights the active tab in `--color-primary`.
- [ ] Every visible string comes from `locales/pt-BR.json`.
- [ ] Light and dark themes follow the iPhone setting; content clears the notch and the home indicator.

**Verification:**
- [ ] Tests pass: `node --test tests/`
- [ ] Manual check (Claude): local server, no console errors, tabs work.
- [ ] Manual check (owner): tabs and both themes on the iPhone in Safari.

**Dependencies:** Task 2

**Files likely touched:**
- `index.html`
- `css/base.css`
- `css/layout.css`
- `js/app.js`
- `js/views/home.js`
- `locales/pt-BR.json`

**Estimated scope:** Medium (6 files, most of them new and short)

## Task 4: Placeholder screens for Lições, Exercícios and Progresso

**Description:** Add one view module per remaining tab, each with a title and a short pt-BR message saying the section is coming soon.

**Acceptance criteria:**
- [ ] Each tab shows its own screen.
- [ ] Reloading the page on any tab keeps that tab open.

**Verification:**
- [ ] Tests pass: `node --test tests/`
- [ ] Manual check (Claude): every tab and every reload works locally.

**Dependencies:** Task 3

**Files likely touched:**
- `js/views/lessons.js`
- `js/views/exercises.js`
- `js/views/progress.js`
- `locales/pt-BR.json`

**Estimated scope:** Small (4 files)

## Checkpoint 1: Navigation
- [ ] Unit tests pass
- [ ] All four tabs work on her iPhone in Safari, in light and dark mode
- [ ] Review with the owner

## Task 5: App icon and web app manifest

**Description:** Draw the option C icon as an SVG source with the letters as paths, export the PNG sizes, and add the manifest and the iOS meta tags, so that "Adicionar à Tela de Início" gives the "Bora!" icon and a full-screen launch.

**Acceptance criteria:**
- [ ] The icon PNGs (180, 192, 512) match the chosen design; the owner approves a preview before the commit.
- [ ] From the home screen, the app opens full screen with the name "Bora!".
- [ ] The status bar color matches the page in both themes.

**Verification:**
- [ ] Manual check (Claude): the manifest is valid JSON and every icon path resolves locally.
- [ ] Manual check (owner): install on the iPhone and open from the home screen.

**Dependencies:** Task 3

**Files likely touched:**
- `icons/icon.svg`
- `icons/apple-touch-icon.png`, `icons/icon-192.png`, `icons/icon-512.png`
- `manifest.webmanifest`
- `index.html`

**Estimated scope:** Small to medium (generated PNGs plus 3 files)

## Task 6: Service worker with versioned cache

**Description:** Cache the shell files so the app opens fast, and make sure a new deployment replaces the old version. The cache name holds a version constant that is bumped at every deployment.

**Acceptance criteria:**
- [ ] The app opens from the home screen with no network delay on the second launch.
- [ ] After a deployment with a new version number, the next launch shows the new version.
- [ ] Old caches are deleted when the new service worker activates.

**Verification:**
- [ ] Tests pass: `node --test tests/`
- [ ] Manual check (Claude): local server, the service worker registers with no console errors.
- [ ] Manual check (owner): deploy a visible change and confirm it appears on the iPhone.

**Dependencies:** Tasks 4 and 5

**Files likely touched:**
- `sw.js`
- `js/app.js`

**Estimated scope:** Small (2 files)

## Checkpoint 2: Complete
- [ ] The full real-device checklist of the spec passes
- [ ] Every success criterion of the spec is met
- [ ] Review with the owner before starting the next module
