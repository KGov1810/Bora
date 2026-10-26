# Tasks: lessons (Bora!)

Plan: `tasks/plan.md`. Definition of done for every task: `node --test` passes (run by Claude), no console error in the headless check, new files listed in `sw.js` with a version bump, the owner approved the commit.

## Task 1: Route parameter and glossary splitting

**Description:** Add `parseRoute()` to the router and write `splitGlossaryMarks()`, test first. `parseRoute('#/lessons/a2-x')` gives `{ name: 'lessons', param: 'a2-x' }`. `splitGlossaryMarks()` turns a paragraph into plain text and term segments, keeping the displayed case and lower-casing the key.

**Acceptance criteria:**
- [ ] `parseRoute` handles a bare tab, a tab with a parameter, unknown routes and extra segments.
- [ ] `splitGlossaryMarks` handles no mark, one mark, several marks, and marks at the start or end.
- [ ] The existing `resolveRoute` tests still pass.

**Verification:**
- [ ] Tests pass: `node --test`

**Dependencies:** None

**Files likely touched:**
- `js/router.js`
- `js/content/text.js`
- `tests/router.test.js`
- `tests/content-text.test.js`

**Estimated scope:** Small (4 files)

## Task 2: Lessons list screen

**Description:** Replace the Lições placeholder with the list of units and lessons from `content/path.json`, each lesson showing its pt-BR title and duration and linking to `#/lessons/<id>`. Includes the content loader with validation and the loading and error states.

**Acceptance criteria:**
- [ ] The list shows unit a2-u1 and the first lesson, with title and duration.
- [ ] A loading state shows while fetching; an invalid or unreachable path shows a pt-BR error message.
- [ ] The Lições tab stays highlighted on `#/lessons/<id>`.

**Verification:**
- [ ] Tests pass: `node --test`
- [ ] Headless check (Claude): list renders in both themes, no console errors.

**Dependencies:** Task 1

**Files likely touched:**
- `js/content/load.js`
- `js/views/lessons.js`
- `js/app.js`
- `css/lesson.css`
- `locales/pt-BR.json`
- `sw.js`

**Estimated scope:** Medium (6 files, mostly small)

## Task 3: Lesson screen with glossary, grammar and vocabulary

**Description:** Render one lesson: back link, level and duration, pt-BR title, English text with glossary terms as buttons, the glossary card pinned above the tab bar, the grammar section, the vocabulary list and the disabled "Fazer os exercícios" button.

**Acceptance criteria:**
- [ ] Tapping a term opens its card with `pt` and `note`; tapping elsewhere or another term closes or replaces it.
- [ ] The grammar section shows the title, the explanation and the examples in English and pt-BR.
- [ ] An unknown lesson id shows a pt-BR message and a link back to the list.

**Verification:**
- [ ] Tests pass: `node --test`
- [ ] Headless check (Claude): open a lesson, open and close a glossary card, back link, unknown id, both themes, no console errors.

**Dependencies:** Task 2

**Files likely touched:**
- `js/views/lesson.js`
- `js/views/lessons.js`
- `css/lesson.css`
- `locales/pt-BR.json`
- `sw.js`

**Estimated scope:** Medium (5 files)

## Checkpoint 1: Readable lesson
- [ ] Unit tests pass
- [ ] Owner reads the first lesson on the iPhone, in both themes

## Task 4: "Ouvir" button with voice allow-list

**Description:** Write `pickVoice()`, test first, from the spike results. Add the "Ouvir" / "Parar" button and the slow-speed toggle to the lesson screen. Stop speaking when leaving the lesson.

**Acceptance criteria:**
- [ ] `pickVoice` prefers Samantha, follows the allow-list order, never returns a novelty voice, and returns null when nothing suitable exists.
- [ ] The button is hidden when no suitable voice is available.
- [ ] Navigating away stops the voice.

**Verification:**
- [ ] Tests pass: `node --test`
- [ ] Manual check (owner): "Ouvir" at both speeds on the iPhone.

**Dependencies:** Task 3

**Files likely touched:**
- `js/speech/voices.js`
- `tests/speech-voices.test.js`
- `js/views/lesson.js`
- `locales/pt-BR.json`
- `css/lesson.css`
- `sw.js`

**Estimated scope:** Medium (6 files)

## Task 5: Offline lessons

**Description:** Cache `content/` files in the service worker with a network-first strategy and a cache fallback.

**Acceptance criteria:**
- [ ] A lesson opened once opens again offline.
- [ ] With a connection, an updated lesson file is shown, not the cached one.

**Verification:**
- [ ] Tests pass: `node --test`
- [ ] Headless check (Claude): open a lesson online, go offline, reopen it; change the file, go online, see the change.
- [ ] Manual check (owner): airplane mode on the iPhone.

**Dependencies:** Task 3

**Files likely touched:**
- `sw.js`

**Estimated scope:** Small (1 file)

## Checkpoint 2: Complete
- [ ] The real-iPhone checklist of the spec passes
- [ ] Every success criterion of the spec is met
- [ ] Review with the owner before starting the `exercises` module
