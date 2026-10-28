# Implementation Plan: access (Bora!)

Source spec: `SPEC-access.md` (approved 2026-10-27). Module map: `CAPABILITY-MAP.md`.
Tasks are tracked in `tasks/todo.md`. Completed plans are in `tasks/done/`.

## Overview

A Cloudflare Worker (`bora-api`) deployed from `worker/` by Workers Builds, protected by an access code stored as a Cloudflare secret, and a "Conexão" card in the Progresso tab to enter the code once.

## Architecture Decisions

- **The Worker is tested without Cloudflare.** Its `fetch` handler is called directly from `node --test` with real `Request` objects and a fake `env`.
- **Code first, deployment second.** The Worker is written and tested before the owner creates the Cloudflare account, so the first deployment is the real one.
- **The owner's setup is a task of its own.** It is short, but it blocks the real-device check, so it sits between the Worker and the app screen.
- **The app never depends on the Worker for lessons.** The connection card is the only place that calls it.

## Task List

### Phase 1: Worker
- [x] Task 1: Worker with health check, CORS and access code

### Checkpoint 1: Worker ready to deploy
- [x] Unit tests pass

### Phase 2: Deployment (owner, guided)
- [x] Task 2: Cloudflare account, Workers Builds, `ACCESS_CODE` secret

### Phase 3: App
- [x] Task 3: API client and code storage
- [ ] Task 4: Connection card in the Progresso tab

### Checkpoint 2: Complete
- [ ] The owner's real-iPhone check passes (right code, wrong code, disconnect, lessons offline)
- [ ] Every success criterion of the spec is met
- [ ] Review with the owner before starting the `progress` module

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Workers Builds does not find the Worker in the repository | Medium | `worker/` as root directory with its own `wrangler.toml`; the owner shares the build log if it fails. |
| CORS blocks the app | Medium | Origin allow-list tested; the exact origin is `https://kgov1810.github.io` (no path). |
| The code is entered in Safari instead of the installed app | Low | Explained on the card and in the setup steps. |
| A weak access code | Low | At least 12 characters, recommended in the setup steps. |

## Open Questions

None.
