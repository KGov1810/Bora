# Implementation Plan: app-shell (Bora!)

Source spec: `SPEC-app-shell.md` (approved 2026-10-26). Module map: `CAPABILITY-MAP.md`.
Tasks are tracked in `tasks/todo.md`.

## Overview

Build the empty but installable shell of **Bora!**: a PWA for iPhone with four tabs labelled in pt-BR, light and dark themes, an app icon, and a service worker. It is hosted on GitHub Pages from `KGov1810/Bora` at `https://kgov1810.github.io/Bora/`.

Before the shell, a small speech test page goes online first. It checks the main technical risk of the whole project on her real iPhone.

## Architecture Decisions

- **No build step, no dependencies.** The files in the repository are exactly what GitHub Pages serves. This keeps deployment to a single push.
- **Hash routing (`#/lessons`).** GitHub Pages has no server-side rewrites. Hash routes never produce a 404, including after a reload of the installed app.
- **Pure logic kept apart from the DOM.** `router.js` and `i18n.js` have no DOM access, so they can be unit-tested with `node --test`. The DOM code stays thin and is checked on the real device.
- **Relative paths everywhere.** The site lives under `/Bora/`, so absolute paths like `/css/...` would break.
- **Service worker last.** Caching is added after everything else works, because a wrong cache makes every later test harder to trust.
- **Icon drawn with paths, not text.** The "EN" letters in the icon are drawn as vector shapes. Rasterizing to PNG then does not depend on which fonts are installed.

## Deployment and approvals

- Claude runs `node --test` in its own workspace before proposing each commit.
- Every commit and push needs the owner's explicit approval and a commit message (English). Pushes go to `main`, which needs no extra branch for a single-developer project.
- The owner enables GitHub Pages once, in Settings › Pages, source: `main` branch, root folder. Claude guides this at Task 1.

## Task List

### Phase 0: Risk first
- [x] Task 1: Deployable placeholder page and speech test page

### Checkpoint 0: Speech feasibility
- [x] The owner and the learner run the speech test on her iPhone, in Safari and from the home screen
- [x] Results recorded in `docs/spikes/speech-results.md`

### Phase 1: Shell
- [x] Task 2: Router and i18n logic, with unit tests
- [x] Task 3: Shell with tab bar and the Início screen
- [x] Task 4: Placeholder screens for Lições, Exercícios and Progresso

### Checkpoint 1: Navigation
- [x] Unit tests pass
- [x] All four tabs work on her iPhone in Safari, in light and dark mode

### Phase 2: Installable app
- [ ] Task 5: App icon and web app manifest
- [ ] Task 6: Service worker with versioned cache

### Checkpoint 2: Complete
- [ ] The full real-device checklist of the spec passes
- [ ] Every success criterion of the spec is met
- [ ] Review with the owner before starting the next module

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Speech recognition does not work in installed mode on iOS | High | Tested first (Task 1). Fallback already planned: iOS keyboard dictation. |
| Stale cache: the installed app keeps showing an old version | Medium | Service worker added last; cache version bumped on every deployment; "new version loads" is on the checklist. |
| Wrong path or case breaks the site under `/Bora/` | Medium | Relative paths only; checked on the live URL at every checkpoint. |
| Only the owner can test on the iPhone, so feedback is slower | Medium | Few, short checkpoints with an explicit checklist. |
| Icon PNG export differs from the design canvas | Low | Letters drawn as paths; the PNG is shown to the owner before it is committed. |

## Open Questions

None.
