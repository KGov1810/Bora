# Implementation Plan: lessons (Bora!)

Source spec: `SPEC-lessons.md` (approved 2026-10-26). Module map: `CAPABILITY-MAP.md`.
Tasks were tracked in `tasks/done/lessons-todo.md`. Status: complete.

## Overview

Make lessons readable on her iPhone: the list of units and lessons in the Lições tab, and a lesson screen with the English text, a tappable glossary, the grammar, the vocabulary and an "Ouvir" button. Lessons opened once stay available offline.

## Architecture Decisions

- **Route parameter.** `parseRoute()` returns the route name and an optional parameter (`#/lessons/<id>`). `resolveRoute()` stays as it is, so the tab highlighting does not change.
- **Pure helpers first.** Glossary splitting, route parsing and voice choice are DOM-free and unit-tested; the views only assemble elements.
- **Glossary card pinned above the tab bar.** Instead of a popover next to the word, the card slides in at the bottom of the screen, above the tab bar. It never covers the word, never overflows the screen edge on a narrow phone, and is easy to reach with the thumb.
- **Content is validated at load time.** `content/load.js` runs the same validators as the tests, so a bad file shows a clear message instead of a broken screen.
- **Network first for `content/`.** The shell keeps its cache-first strategy; lesson files use network first with a cache fallback, so she always gets corrections when online.

## Task List

### Phase 1: Reading a lesson
- [x] Task 1: Route parameter and glossary splitting
- [x] Task 2: Lessons list screen
- [x] Task 3: Lesson screen with glossary, grammar and vocabulary

### Checkpoint 1: Readable lesson
- [x] Unit tests pass
- [x] Owner reads the first lesson on the iPhone, in both themes

### Phase 2: Listening and offline
- [x] Task 4: "Ouvir" button with voice allow-list
- [x] Task 5: Offline lessons

### Checkpoint 2: Complete
- [x] The real-iPhone checklist of the spec passes
- [x] Every success criterion of the spec is met
- [x] Review with the owner before starting the `exercises` module

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Glossary words too small to tap comfortably | Medium | Extra tap padding on terms; checked on the real iPhone at Checkpoint 1. |
| iOS refuses to speak without a direct tap, or the voice list loads late | Medium | Speech starts only from the button tap; voices are read after `voiceschanged`; the button stays hidden until a voice is found. |
| A cached lesson is outdated | Low | Network first for content; the cache is only a fallback. |
| Large view files become hard to follow | Low | Pure helpers are split out; one view file per screen. |

## Open Questions

None.
