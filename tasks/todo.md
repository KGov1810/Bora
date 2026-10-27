# Tasks: exercises (Bora!)

Plan: `tasks/plan.md`. Definition of done for every task: `node --test` passes (run by Claude), no console error in the headless check, new files listed in `sw.js` with a version bump, the owner approved the commit.

## Task 1: Grading and shuffling

**Description:** Write `gradeExercise` and `shuffle`, test first. `gradeExercise` returns `{ correct, expected }` for each type: the option text for `choice`, `"true"` or `"false"` for `true-false` (the screen translates it to Verdadeiro or Falso), the first accepted answer for `fill-blank`, and the words joined into the sentence for `reorder`.

**Acceptance criteria:**
- [x] Each type is graded right and wrong, and `fill-blank` uses `isAcceptedAnswer`.
- [x] `shuffle` keeps the same items, is deterministic with an injected random, and never returns the input order for 2 or more distinct items.
- [x] Neither module touches the DOM.

**Verification:**
- [x] Tests pass: `node --test`

**Dependencies:** None

**Files likely touched:**
- `js/exercises/grade.js`
- `js/exercises/shuffle.js`
- `tests/exercises-grade.test.js`
- `tests/exercises-shuffle.test.js`

**Estimated scope:** Small (4 files)

## Task 2: Exercise session

**Description:** Write `createSession(exercises)`, test first: the current exercise, its position, `answer(response)` (graded once, then locked), `next()`, whether the session is finished, the score, the mistakes, and a new session from the mistakes only.

**Acceptance criteria:**
- [x] Answering twice the same exercise keeps the first answer.
- [x] The score and the list of mistakes are right after a full round.
- [x] A session built from the mistakes contains only them, in their original order.

**Verification:**
- [x] Tests pass: `node --test`

**Dependencies:** Task 1

**Files likely touched:**
- `js/exercises/session.js`
- `tests/exercises-session.test.js`

**Estimated scope:** Small (2 files)

## Checkpoint 1: Logic ready
- [x] Unit tests pass

## Task 3: Session screen with multiple choice and true or false

**Description:** Ship the whole flow for the two tap-to-answer types: `#/exercises/<lesson-id>` opens the session; the lesson's button becomes a link; the Exercícios tab lists the lessons; one exercise per screen with position and progress bar; feedback panel with icon, words, correct answer and explanation; "Continuar". Other types show a placeholder until Task 4.

**Acceptance criteria:**
- [x] The lesson button and the tab list both open the session.
- [x] `choice` options are shuffled; tapping one answers and locks the exercise.
- [x] Right and wrong feedback show an icon, words and the explanation; wrong also shows the right answer.

**Verification:**
- [x] Tests pass: `node --test`
- [x] Headless check (Claude): both entry points, right and wrong answers, both themes, no console errors.

**Dependencies:** Task 2

**Files likely touched:**
- `js/views/exercises.js`
- `js/views/exercise-session.js`
- `js/views/lesson.js`
- `css/exercises.css`
- `locales/pt-BR.json`
- `sw.js`, `index.html` (new files and stylesheet link)
- `css/base.css` (right and wrong color tokens)

**Estimated scope:** Medium (5 files plus two one-line edits)

## Task 4: Fill in the blank and word reordering

**Description:** Add the text field (no autocorrect, return key checks) and the word chips (tap to place, tap to remove, "Verificar" once all are placed).

**Acceptance criteria:**
- [x] A `fill-blank` answer with different case, extra spaces or a curly apostrophe is accepted.
- [x] `reorder` chips move both ways; "Verificar" is disabled until every word is placed.
- [x] Both types show the same feedback panel as Task 3.

**Verification:**
- [x] Tests pass: `node --test`
- [x] Headless check (Claude): both types right and wrong, return key, both themes.

**Dependencies:** Task 3

**Files likely touched:**
- `js/views/exercise-session.js`
- `css/exercises.css`
- `locales/pt-BR.json`
- `sw.js`

**Estimated scope:** Small to medium (4 files)

## Task 5: Summary and redo mistakes

**Description:** After the last exercise, show the score, the missed exercises with their right answers, "Refazer os erros" (only when there are mistakes) and "Voltar para a lição".

**Acceptance criteria:**
- [x] The score matches the answers given.
- [x] "Refazer os erros" starts a round with only the missed exercises.
- [x] A round with no mistakes shows a congratulation and no redo button.

**Verification:**
- [x] Tests pass: `node --test`
- [x] Headless check (Claude): a round with mistakes, the redo round, a perfect round.

**Dependencies:** Task 4

**Files likely touched:**
- `js/views/exercise-session.js`
- `css/exercises.css`
- `locales/pt-BR.json`
- `sw.js`

**Estimated scope:** Small (4 files)

## Checkpoint 2: Complete
- [ ] The owner's real-iPhone check passes (keyboard, chips, feedback)
- [ ] Every success criterion of the spec is met
- [ ] Review with the owner before starting the `access` module
