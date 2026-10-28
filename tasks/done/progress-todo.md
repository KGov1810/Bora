# Tasks: progress (Bora!)

Plan: `tasks/done/progress-plan.md`. Definition of done for every task: `node --test` passes (run by Claude), no secret in the repository, new app files listed in `sw.js` with a version bump, the owner approved the commit.

## Task 1: Attempts storage and summary routes in the Worker

**Description:** Test first: `POST /progress/attempts` (validation, 1 to 100 attempts, response up to 200 characters, `INSERT OR IGNORE` on `client_id`) and `GET /progress/summary` (rounds per session, per-exercise stats with the last answer and the last wrong response). Both behind the access code. Schema created on first use. Fake D1 for tests.

**Acceptance criteria:**
- [x] Invalid bodies answer `400` and store nothing.
- [x] Sending the same attempts twice stores them once.
- [x] The summary matches the stored attempts, including "last answer right".

**Verification:**
- [x] Tests pass: `node --test`

**Dependencies:** None

**Files likely touched:**
- `worker/src/progress.js`
- `worker/src/index.js`
- `tests/fake-d1.js` (backed by Node's built-in SQLite, like D1)
- `tests/worker-progress.test.js`

**Estimated scope:** Medium (4 files)

## Task 2: D1 database and binding

**Description:** The owner creates the D1 database `bora-db` and sends its ID; Claude adds the `[[d1_databases]]` binding `DB` to `worker/wrangler.toml`; the push deploys it.

**Acceptance criteria:**
- [x] The Worker deploys with the binding.
- [x] `/progress/summary` answers an empty summary with the right code.

**Verification:**
- [x] Manual check (owner): the build succeeds; the app check comes at Task 5.

**Dependencies:** Task 1

**Files likely touched:**
- `worker/wrangler.toml`

**Estimated scope:** Owner setup, about 2 minutes

## Task 3: Local queue, sync and API calls

**Description:** Test first: `js/progress/queue.js` (add, list, remove sent ids; storage injected and guarded), `js/progress/sync.js` (send in batches of 100, remove only what the server confirmed, stop on error), and `postAttempts` / `getSummary` in the API client.

**Acceptance criteria:**
- [x] A failed send keeps the queue intact.
- [x] Batches never exceed 100 attempts.
- [x] Without an access code, nothing is sent and nothing is lost.

**Verification:**
- [x] Tests pass: `node --test`

**Dependencies:** Task 1

**Files likely touched:**
- `js/progress/queue.js`
- `js/progress/sync.js`
- `js/api/client.js`
- `tests/progress-queue.test.js`
- `tests/api-client.test.js` (sync tests are in `tests/progress-queue.test.js`)
- `sw.js`

**Estimated scope:** Medium (5 files)

## Task 4: Record answers during exercise sessions

**Description:** After each answer, build the attempt (ids, right or wrong, response as text, date, session id) and add it to the queue, then try a sync. Also sync when the app opens and when it comes back online.

**Acceptance criteria:**
- [x] Every answered exercise produces exactly one queued attempt.
- [x] The exercise flow is unchanged when offline or not connected.

**Verification:**
- [x] Tests pass: `node --test`
- [x] Headless check (Claude): a full round offline, then online with a fake Worker; the queue empties.

**Dependencies:** Task 3

**Files likely touched:**
- `js/progress/record.js`
- `js/progress/recorder.js` (the app's recorder, wired to storage and the Worker)
- `js/views/exercise-session.js`
- `js/app.js`
- `tests/progress-record.test.js`
- `sw.js`

**Estimated scope:** Medium (5 files)

## Task 5: Progresso screen with stats, Para revisar and Copiar resumo

**Description:** Test first for the rules and the summary text (`js/progress/summary.js`): practiced lessons (full round, at least 75 %), best score, Para revisar (last answer wrong). Then the screen: counts, best scores, Para revisar links, pending count, last update date, Copiar resumo with fallback, cached summary offline.

**Acceptance criteria:**
- [x] A 6 out of 9 round does not mark the lesson practiced; 7 out of 9 does; a retry round never does.
- [x] An exercise leaves Para revisar after one right answer.
- [x] The summary text lists lessons, scores and the most missed exercises with her wrong answers.

**Verification:**
- [x] Tests pass: `node --test`
- [x] Headless check (Claude): each state, both themes, no console errors.
- [x] Manual check (owner): the real-iPhone checklist.

**Dependencies:** Tasks 2 and 4

**Files likely touched:**
- `js/progress/summary.js`
- `tests/progress-summary.test.js`
- `js/views/progress.js`
- `css/progress.css`
- `locales/pt-BR.json`, `sw.js`

**Estimated scope:** Medium (5 to 6 files)

## Checkpoint 2: Complete
- [x] The real-iPhone check passes (answers saved online and offline, stats shown, summary copied)
- [x] Every success criterion of the spec is met
- [x] Review with the owner before starting the `ai-correction` module
