# Tasks: content-format (Bora!)

Plan: `tasks/plan.md`. Definition of done for every task: `node --test` passes (run by Claude), the owner approved the commit.

## Task 1: A2 curriculum outline

**Description:** Write `docs/curriculum.md`: the planned A2 lessons, grouped into units, in teaching order. Each line gives the lesson id, the grammar point, the text's theme, and a one-line pt-BR title. Themes follow her goals: travel, series, articles, daily life.

**Acceptance criteria:**
- [x] The A2 outline covers the core A2 grammar points, one per lesson.
- [x] Every planned id follows the spec's naming rule.
- [x] The owner approves the outline (order and themes).

**Verification:**
- [x] Manual check (owner): reads the outline in chat or on GitHub.

**Dependencies:** None

**Files likely touched:**
- `docs/curriculum.md`

**Estimated scope:** Small (1 file)

## Task 2: Lesson validator: fields and glossary marks

**Description:** Write `validateLesson` for every lesson-level rule of the spec, test first: schema version, id and file name, level, required strings, minutes, text, glossary marks and entries, grammar section, and the minimum number of exercises with unique ids.

**Acceptance criteria:**
- [x] The spec's example lesson is valid.
- [x] Every lesson rule has a failing sample that produces a readable error naming the field.
- [x] A mark without a glossary entry, and an entry never marked, are both reported.

**Verification:**
- [x] Tests pass: `node --test`

**Dependencies:** None

**Files likely touched:**
- `js/content/validate.js`
- `tests/content-validate.test.js`
- `sw.js` (list the new file, bump `CACHE_VERSION`)

**Estimated scope:** Medium (3 files)

## Task 3: Exercise validation and answer normalization

**Description:** Add the per-type rules for `choice`, `true-false`, `fill-blank` and `reorder`, and the `normalizeAnswer` function used to grade `fill-blank`, test first.

**Acceptance criteria:**
- [ ] Each exercise type has a valid sample and a failing sample for each of its rules.
- [ ] An unknown exercise type is reported.
- [ ] `normalizeAnswer` handles case, outer and inner spaces, and curly apostrophes.

**Verification:**
- [ ] Tests pass: `node --test`

**Dependencies:** Task 2

**Files likely touched:**
- `js/content/validate.js`
- `tests/content-validate.test.js`

**Estimated scope:** Small (2 files)

## Checkpoint 1: Format ready
- [ ] Unit tests pass
- [x] Owner approved the A2 outline

## Task 4: Path validator and content files test

**Description:** Write `validatePath`, test first, and a test that loads `content/path.json` and every lesson file and runs both validators on them.

**Acceptance criteria:**
- [ ] Duplicate unit ids, duplicate lessons, missing lesson files and level mismatches are reported.
- [ ] A lesson file missing from the path is reported as a draft (test output), without failing.
- [ ] A broken content file makes `node --test` fail with the validator's errors.

**Verification:**
- [ ] Tests pass: `node --test`

**Dependencies:** Task 3

**Files likely touched:**
- `js/content/validate.js`
- `tests/content-validate.test.js`
- `tests/content-files.test.js`

**Estimated scope:** Small to medium (3 files)

## Task 5: First A2 lesson and learning path

**Description:** Write the first lesson of the approved outline as a real content file, in American English, with its pt-BR glossary, grammar explanation and at least 6 exercises, and list it in `content/path.json`.

**Acceptance criteria:**
- [ ] The lesson and the path pass the content files test.
- [ ] The text is original, at A2 level, about 120 to 180 words.
- [ ] The owner reviews the text, the explanation and the exercises.

**Verification:**
- [ ] Tests pass: `node --test`
- [ ] Manual check (owner): reads the lesson in chat.

**Dependencies:** Tasks 1 and 4

**Files likely touched:**
- `content/lessons/<first-lesson-id>.json`
- `content/path.json`

**Estimated scope:** Small (2 files)

## Checkpoint 2: Complete
- [ ] Every success criterion of the spec is met
- [ ] Review with the owner before starting the `lessons` module
