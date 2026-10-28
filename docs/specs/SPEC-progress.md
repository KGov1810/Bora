# Spec: progress

Module from `CAPABILITY-MAP.md`. Status: **approved 2026-10-28**.

## Objective

Save every exercise answer on the Bora! server, show the learner her progress in the Progresso tab, and give the owner a summary of her frequent mistakes to bring to Claude, who writes the next lessons from it.

### User stories

- **Learner:** I do exercises as usual. My answers are saved without anything to do, even when I am offline: they are sent as soon as the app is online and connected.
- **Learner:** in **Progresso**, I see how many lessons I have practiced, my best score per lesson, and a list **Para revisar** with the exercises I got wrong the last time I tried them. Each one links to its lesson's exercises.
- **Owner:** in **Progresso**, a button **Copiar resumo** copies a plain-text summary (lessons practiced, scores, most missed exercises with her wrong answers). I paste it to Claude to adapt the next lessons.
- When the app is not connected, Progresso says so and invites to connect; answers wait on the iPhone in the meantime.

## What is saved

One row per answered exercise:

| Field | Meaning |
|---|---|
| `client_id` | Unique id made on the iPhone, so a retried upload is never saved twice |
| `session_id` | Id of the exercise round, to compute a score per round |
| `lesson_id`, `exercise_id` | Which exercise |
| `correct` | 1 or 0 |
| `response` | What she answered, as text (option text, true or false, typed text, sentence built). At most 200 characters |
| `answered_at` | When she answered (ISO date from the iPhone) |
| `received_at` | When the server stored it |

Nothing else: no name, no device information.

## API (added to `bora-api`)

All routes require the access code (`SPEC-access.md`).

| Method and path | Body or result |
|---|---|
| `POST /progress/attempts` | Body `{"attempts": [...]}`, 1 to 100 attempts. Answers `200 {"saved": n}`. Already known `client_id`s are ignored, so retries are safe. Invalid body: `400 {"error": "invalid_body"}` |
| `GET /progress/summary` | `200 {"rounds": [...], "exercises": [...]}`. `rounds`: one entry per session (lesson, session, right answers, answers given, date). `exercises`: per exercise, attempts, wrong answers, whether the last answer was right, the last wrong response |

The table is created by the Worker itself on first use (`CREATE TABLE IF NOT EXISTS`), so no manual SQL is needed.

## App side

- **Recording:** the exercise session calls `recordAttempt()` after each answer. The attempt goes into a local queue (`localStorage`, guarded), then the app tries to send the queue. The queue is also sent when the app opens and when it comes back online. Sending needs the access code; without it, attempts simply wait.
- **Progresso tab:** connection card (from `access`), then:
  - "Lições praticadas: 4 de 10", and per lesson its best score on a full round;
  - **Para revisar**: exercises whose last answer was wrong, with the question and a link to the lesson's exercises;
  - **Copiar resumo** (copies the owner summary; falls back to a selectable text box if the clipboard is refused);
  - a line "N respostas aguardando envio" when the queue is not empty.
- **Offline:** the last summary received is kept on the iPhone and shown with "Atualizado em …".

## Owner's one-time setup (guided)

1. In the Cloudflare dashboard, create a D1 database named `bora-db`.
2. Send Claude its **database ID** (an identifier, not a secret). Claude adds the binding to `worker/wrangler.toml`; the next push deploys it.

## Project Structure

```
worker/src/progress.js        → validation, insert, summary queries (pure SQL helpers + handlers)
worker/src/index.js           → new routes
worker/wrangler.toml          → [[d1_databases]] binding "DB", database "bora-db"
js/progress/queue.js          → local queue of attempts (pure, storage injected, unit-tested)
js/progress/sync.js           → sends the queue in batches (fetch injected, unit-tested)
js/progress/summary.js        → owner summary text from the server summary and lesson content (pure, unit-tested)
js/api/client.js              → postAttempts(), getSummary()
js/views/exercise-session.js  → calls recordAttempt() after each answer
js/views/progress.js          → stats, Para revisar, Copiar resumo
tests/worker-progress.test.js → routes with a fake D1 (in-memory)
tests/progress-*.test.js
```

The Worker tests use a small in-memory fake of the D1 API (`prepare().bind().run()/all()/first()`, `batch()`), so no Cloudflare tool is needed.

## Testing Strategy

- **Unit tests (`node --test`):** body validation (limits, types, lengths); duplicate `client_id`s ignored; summary numbers; queue add, remove after a successful send, survives a failed send; sync in batches of 100; summary text.
- **Headless browser check (Claude):** answer exercises offline, see the pending count, connect, see the queue empty and the stats appear; Para revisar links; Copiar resumo.
- **Real iPhone (owner and learner):** do a lesson's exercises, check Progresso; copy the summary and paste it to Claude.

## Boundaries

- **Always:**
  - limit sizes on the server (100 attempts per request, 200 characters per response);
  - use bound SQL parameters, never string building;
  - keep lessons and exercises working with no connection.
- **Ask first:** deleting or resetting saved progress; any paid Cloudflare feature.
- **Never:** store anything that identifies the learner beyond her answers; block an exercise because a save failed.

## Success Criteria

1. Answers given offline or online all reach the server exactly once.
2. Progresso shows practiced lessons, best scores and Para revisar, and still shows the last summary offline.
3. Copiar resumo gives a summary the owner can paste to Claude.
4. `node --test` passes, and the D1 free limits are far from reached (a few hundred writes per day at most).

## Out of scope

- Resetting progress, several learners, charts over time.
- AI correction of free writing (`ai-correction`).
- Spaced repetition (review reminders on a schedule).

## Rules (decided 2026-10-28)

- **Para revisar:** an exercise is listed when its **last** answer was wrong. It leaves the list as soon as she answers it right once.
- **Practiced lesson:** a lesson counts as practiced when she finishes a **full round** (all its exercises) with **at least 75 % right answers** (7 out of 9 for the current lessons). "Refazer os erros" rounds do not count, because they hold only part of the exercises. The app decides this from the server's rounds and the lesson's number of exercises.
- **Best score:** the best full round of the lesson.

## Open Questions

None.
