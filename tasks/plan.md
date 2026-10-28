# Implementation Plan: progress (Bora!)

Source spec: `SPEC-progress.md` (approved 2026-10-28). Module map: `CAPABILITY-MAP.md`.
Tasks are tracked in `tasks/todo.md`. Completed plans are in `tasks/done/`.

## Overview

Save every exercise answer in a D1 database through `bora-api`, with an offline queue on the iPhone, then show practiced lessons, best scores and "Para revisar" in the Progresso tab, plus a "Copiar resumo" text for the owner.

## Architecture Decisions

- **The server stores facts, the app applies the rules.** The Worker returns rounds and per-exercise stats; the app decides "practiced" (full round, at least 75 %) and "Para revisar" using the lesson content it already has. Rules can change without touching the database.
- **Idempotent uploads.** Each attempt carries a `client_id` made on the iPhone; the table has a unique index on it and inserts use `INSERT OR IGNORE`. Retrying a batch is always safe.
- **Queue first, network second.** An answer is written to the local queue before any network call, so a failed or slow upload never loses it and never blocks the exercise.
- **Schema created by the Worker.** `CREATE TABLE IF NOT EXISTS` runs once per Worker instance, so the owner never runs SQL.
- **Fake D1 in tests.** A small in-memory fake of `prepare().bind().run()/all()`, enough for the queries used, keeps tests free of Cloudflare tools. The real database is checked after deployment.

## Task List

### Phase 1: Server
- [x] Task 1: Attempts storage and summary routes in the Worker
- [ ] Task 2: D1 database and binding (owner, guided)

### Checkpoint 1: Server ready
- [x] Unit tests pass
- [ ] The deployed Worker answers `/progress/summary` with an empty summary

### Phase 2: App
- [x] Task 3: Local queue, sync and API calls
- [ ] Task 4: Record answers during exercise sessions
- [ ] Task 5: Progresso screen with stats, Para revisar and Copiar resumo

### Checkpoint 2: Complete
- [ ] The real-iPhone check passes (answers saved online and offline, stats shown, summary copied)
- [ ] Every success criterion of the spec is met
- [ ] Review with the owner before starting the `ai-correction` module

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| The fake D1 behaves differently from the real one | Medium | Only simple SQL (insert, select, group by); checked on the deployed Worker at Checkpoint 1. |
| Answers sent twice after a network retry | Medium | Unique `client_id` with `INSERT OR IGNORE`, covered by tests. |
| The queue grows while she is not connected | Low | Small rows; batches of 100; a visible "aguardando envio" count. |
| Clipboard refused on iOS | Low | Fallback to a selectable text box. |

## Open Questions

None.
