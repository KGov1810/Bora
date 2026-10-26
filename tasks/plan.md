# Implementation Plan: content-format (Bora!)

Source spec: `SPEC-content-format.md` (approved 2026-10-26). Module map: `CAPABILITY-MAP.md`.
Tasks are tracked in `tasks/todo.md`. Status: complete.

## Overview

Make lessons pure data: a documented JSON format, a validator that checks every lesson before it is pushed, the learning path file, the A2 curriculum outline, and the first real A2 lesson. No screen is built in this module.

## Architecture Decisions

- **One validator, used by the tests and later by the app.** `js/content/validate.js` is pure and has no DOM access. Because it lives in `js/`, it is also listed in the service worker cache (the `sw.js` test enforces this), with a cache version bump.
- **Errors are returned, not thrown.** Each rule adds a readable message naming the file and the field, so a failing test says exactly what to fix.
- **Content is checked automatically.** A test loads every file in `content/`. Adding a lesson needs no new test.
- **Curriculum first, in parallel with the code.** The A2 outline needs the owner's review, so it is written first; the validator is built while the owner reads it.

## Task List

### Phase 1: Curriculum and validator
- [x] Task 1: A2 curriculum outline
- [x] Task 2: Lesson validator: fields and glossary marks
- [x] Task 3: Exercise validation and answer normalization

### Checkpoint 1: Format ready
- [x] Unit tests pass
- [x] Owner approved the A2 outline

### Phase 2: Real content
- [x] Task 4: Path validator and content files test
- [x] Task 5: First A2 lesson and learning path

### Checkpoint 2: Complete
- [x] Every success criterion of the spec is met
- [x] Review with the owner before starting the `lessons` module

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| The validator is too strict and blocks useful content | Medium | Rules come from the spec only; any new rule is discussed first. |
| Text level does not match her real A2 level | Medium | The owner reviews the first lesson; she gives feedback once the `lessons` screen exists. |
| The first lesson cannot be seen in the app yet | Low | Expected: the screen is the next module. The owner reviews the text in chat. |
| A new `js/` file is forgotten in the service worker cache | Low | Already caught by the `sw.js` test. |

## Open Questions

None.
