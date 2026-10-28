# Spec: access

Module from `CAPABILITY-MAP.md`. Status: **approved 2026-10-27**.

## Objective

Give Bora! a small, private back end that only the learner's app can use. This module builds the foundation that `progress` (saved results) and `ai-correction` (Claude Haiku) will plug into:

- a Cloudflare Worker, deployed automatically from this repository;
- an access code, so nobody else can use the Worker (and, later, spend the Claude API budget);
- a screen in the app to enter the code once, and a visible connection status.

No data is stored yet: the database (D1) arrives with `progress`.

### User stories

- In the **Progresso** tab, I see "Conectar" with a field for the access code. I type it once and the app says it is connected.
- The code is remembered on the iPhone; I never type it again unless I reinstall the app.
- If the code is wrong, I see a clear message in Portuguese.
- Lessons and exercises keep working without a code and without a connection. Only saving progress (next module) needs the connection.

### Owner's one-time setup (guided step by step when we get there)

1. Create a free Cloudflare account.
2. In the Cloudflare dashboard, create a Worker from this GitHub repository (Workers Builds), with `worker/` as the root directory. Every push to `main` then deploys the Worker automatically: no software to install.
3. Add a secret named `ACCESS_CODE` in the Worker's settings, with the code of your choice (at least 12 characters, for example four random words).
4. Copy the Worker's address (`https://bora-api.<your-subdomain>.workers.dev`) and send it to Claude, who writes it into `js/config.js`.

## Tech Stack

- **Worker:** JavaScript module (`export default { fetch }`), no dependency, no build step. Configured by `worker/wrangler.toml`.
- **Deployment:** Cloudflare Workers Builds, connected to GitHub. Default deploy command: `npx wrangler deploy`, run by Cloudflare.
- **Secret:** `ACCESS_CODE`, stored in Cloudflare, never in the repository.
- **Free plan:** 100,000 requests per day; one learner uses a few hundred at most.

## API

Base URL: the Worker's address, written in `js/config.js`.

| Method and path | Auth | Response |
|---|---|---|
| `GET /health` | None | `200 {"ok": true}`, to check that the Worker is online |
| `GET /auth/check` | Required | `204` when the code is right, `401 {"error": "invalid_code"}` otherwise |
| `OPTIONS *` | None | CORS preflight |
| Anything else | — | `404 {"error": "not_found"}` |

- **Authentication:** header `Authorization: Bearer <access code>`. The Worker compares it with `ACCESS_CODE` in constant time. If `ACCESS_CODE` is not configured, every protected route answers `503 {"error": "not_configured"}`, so a forgotten secret never opens the door.
- **CORS:** only `https://kgov1810.github.io` is allowed, plus `http://localhost:8000` for local testing. Methods `GET, POST, PUT, OPTIONS`; header `Authorization, Content-Type`.

## App side

- `js/config.js`: the Worker's base URL (a public address, not a secret).
- `js/api/client.js`: `checkAccess(code)`, `fetch` wrapper adding the header, timeout of 10 seconds, readable results: `ok`, `invalid_code`, `offline`, `server_error`.
- `js/api/storage.js`: reads and writes the access code in `localStorage`, inside `try/catch`.
- **Progresso tab:** a "Conexão" card. Not connected: the code field (type `password`, with a "show" toggle) and **Conectar**. Connected: "Conectado" and **Desconectar** (forgets the code on this device).

**Known iOS behavior:** Safari and the home-screen app have separate storage. The code must be entered from the installed app, which is the one she uses.

## Project Structure

```
worker/
  wrangler.toml          → Worker name (bora-api), entry point, compatibility date
  src/index.js           → fetch handler: routing, CORS, auth
  src/auth.js            → constant-time code comparison (pure, unit-tested)
js/config.js
js/api/client.js
js/api/storage.js
js/views/progress.js     → connection card
tests/worker.test.js     → handler tests with real Request/Response objects (Node ≥ 18)
tests/api-client.test.js → client results with a fake fetch
```

The tests call the Worker's `fetch` handler directly with a fake `env`, so no Cloudflare tool is needed to test.

## Code Style

Same conventions as the other modules. The Worker keeps the logic in small pure functions and the handler only routes.

```js
// worker/src/index.js
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return preflight(request);
    // ...
  },
};
```

## Testing Strategy

- **Unit tests (`node --test`):** `/health`; `/auth/check` with the right code, a wrong code, no header, and no `ACCESS_CODE` configured; CORS headers for the allowed origin and none for another origin; preflight; 404. Client: each result, including timeout and network error.
- **After deployment (Claude, with `curl` if the network allows it, otherwise the owner in Safari):** `/health` answers.
- **Real iPhone (owner):** connect with the right code, then a wrong one; disconnect; lessons still work in airplane mode.

## Boundaries

- **Always:**
  - keep secrets in Cloudflare only;
  - compare codes in constant time;
  - restrict CORS to the app's origin.
- **Ask first:**
  - any paid Cloudflare feature;
  - adding a Worker dependency or build step.
- **Never:**
  - commit an access code or API key;
  - log the access code;
  - make lessons depend on the connection.

## Success Criteria

1. The Worker deploys automatically from `main` and `/health` answers.
2. The app connects with the right code, refuses a wrong one, and remembers the code.
3. Lessons and exercises still work without a code and offline.
4. `node --test` passes.

## Out of scope

- Saving progress and the database (`progress`).
- Calling Claude Haiku (`ai-correction`).
- Several users, accounts or passwords.

## Open Questions

None. Resolved:

- **Where to ask for the code:** in the Progresso tab, only when needed. The app never asks for it at launch.
- **Worker name:** `bora-api`.
