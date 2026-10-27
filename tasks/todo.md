# Tasks: access (Bora!)

Plan: `tasks/plan.md`. Definition of done for every task: `node --test` passes (run by Claude), no secret in the repository, the owner approved the commit.

## Task 1: Worker with health check, CORS and access code

**Description:** Write the Worker, test first: `GET /health`, `GET /auth/check` with constant-time comparison, `503` when `ACCESS_CODE` is missing, CORS for the allowed origins only, preflight, `404` otherwise. Add `worker/wrangler.toml`.

**Acceptance criteria:**
- [x] Every route and status of the spec's API table is covered by a test.
- [x] No CORS header is sent to an origin outside the allow-list.
- [x] The repository contains no code or key.

**Verification:**
- [x] Tests pass: `node --test`

**Dependencies:** None

**Files likely touched:**
- `worker/wrangler.toml`
- `worker/src/index.js`
- `worker/src/auth.js`
- `tests/worker.test.js`

**Estimated scope:** Small to medium (4 files)

## Task 2: Cloudflare account, Workers Builds, ACCESS_CODE secret

**Description:** The owner creates the Cloudflare account, creates the Worker from the GitHub repository with `worker/` as root directory, adds the `ACCESS_CODE` secret and sends the Worker's address. Claude guides each step.

**Acceptance criteria:**
- [ ] A push to `main` deploys the Worker.
- [ ] `/health` answers at the Worker's address.
- [ ] `/auth/check` answers `401` without the code.

**Verification:**
- [ ] Manual check (owner or Claude): open `/health` in a browser.

**Dependencies:** Task 1 pushed

**Files likely touched:** none (Cloudflare dashboard)

**Estimated scope:** Owner setup, about 15 minutes

## Task 3: API client and code storage

**Description:** Write `js/config.js` with the Worker's address, `js/api/storage.js` (code in `localStorage`, inside `try/catch`) and `js/api/client.js` (`checkAccess`, 10-second timeout, results `ok`, `invalid_code`, `offline`, `server_error`), test first with a fake `fetch`.

**Acceptance criteria:**
- [ ] Each client result is covered by a test, including timeout and network error.
- [ ] Storage never throws, even when `localStorage` is unavailable.

**Verification:**
- [ ] Tests pass: `node --test`

**Dependencies:** Task 2 (for the address)

**Files likely touched:**
- `js/config.js`
- `js/api/client.js`
- `js/api/storage.js`
- `tests/api-client.test.js`
- `sw.js`

**Estimated scope:** Small to medium (5 files)

## Task 4: Connection card in the Progresso tab

**Description:** Replace the Progresso placeholder with the "Conexão" card: code field with a show toggle and **Conectar** when not connected; "Conectado" and **Desconectar** when connected; pt-BR messages for each client result.

**Acceptance criteria:**
- [ ] The right code connects and is remembered after closing the app.
- [ ] A wrong code and an offline device each show their own message.
- [ ] **Desconectar** forgets the code on this device.

**Verification:**
- [ ] Tests pass: `node --test`
- [ ] Headless check (Claude): each state with a fake Worker, both themes, no console errors.
- [ ] Manual check (owner): the real-iPhone checklist of the spec.

**Dependencies:** Task 3

**Files likely touched:**
- `js/views/progress.js`
- `css/progress.css`
- `locales/pt-BR.json`
- `index.html`, `sw.js`

**Estimated scope:** Medium (5 files)

## Checkpoint 2: Complete
- [ ] The owner's real-iPhone check passes (right code, wrong code, disconnect, lessons offline)
- [ ] Every success criterion of the spec is met
- [ ] Review with the owner before starting the `progress` module
