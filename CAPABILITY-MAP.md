# Capability Map — English Learning App

Approved: 2026-10-26

**User:** a single learner, native Brazilian Portuguese speaker (pt-BR), CEFR level A2, on iPhone.
**Goal:** move from A2 to B1, then B2, so she can understand TV series, videos and articles, and get by while travelling.
**Learning path:** theory, then exercises, then listening and speaking.

## Modules

| Module id | Responsibility | Depends on |
|---|---|---|
| `app-shell` | iPhone-installable PWA, navigation, pt-BR UI | — |
| `access` | Access code, session, Cloudflare Worker relay | `app-shell` |
| `content-format` | JSON format for lessons and exercises, A2 to B2 learning path | — |
| `lessons` | Theory display | `app-shell`, `content-format` |
| `exercises` | Multiple choice, fill-in, dictation, local auto-grading | `content-format` |
| `progress` | Online storage, stats, export of frequent mistakes | `access`, `exercises` |
| `ai-correction` | Free-writing correction with Claude Haiku 5.5 | `access`, `progress` |
| `speech` | Text-to-speech, speech recognition or iOS dictation, spoken-answer correction | `exercises`, `ai-correction` |

## Build order

Updated 2026-10-26: `lessons` and `exercises` come before `access`, so the learner can start studying before any server exists.

0. ✅ Speech recognition feasibility spike on the target iPhone
1. ✅ `app-shell`, ✅ `content-format`
2. ✅ `lessons`, ✅ `exercises`
3. `access`, then `progress`
4. `ai-correction`
5. `speech`

## Architecture

- **Front end:** HTML, CSS and vanilla JavaScript (ES modules), with no build step. Hosted on GitHub Pages.
- **Back end:** a Cloudflare Worker with a D1 database. It holds the Claude API key and stores progress.
- **AI model:** Claude Haiku 5.5 (`claude-haiku-5-5`), called only through the Worker.
- **Content:** JSON files in the repository, written together with Claude as the learner progresses.

## Out of scope (for now)

- Real-time spoken conversation
- Multiple users
- App Store distribution
- Full offline mode
- Exam preparation
