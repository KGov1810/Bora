# Implementation Plan: exercises (Bora!)

Source spec: `SPEC-exercises.md` (approved 2026-10-26). Module map: `CAPABILITY-MAP.md`.
Tasks are tracked in `tasks/todo.md`. Completed plans are in `tasks/done/`.

## Overview

Let the learner do each lesson's exercises one at a time, with immediate correction and a pt-BR explanation, a summary at the end, and a round with only her mistakes. Nothing is saved yet.

## Architecture Decisions

- **Logic first, screens second.** Grading, shuffling and the session (current exercise, results, mistakes) are pure modules with unit tests. The screens only display the current state and forward taps.
- **Shuffling with an injected random.** `shuffle(items, random)` makes tests deterministic; the app passes `Math.random`. A shuffle never returns the original order when a different one exists, so a `reorder` exercise is never pre-solved and a `choice` answer is not always first.
- **Grading in one place.** Every type goes through `gradeExercise`, which also returns the right answer ready to display, so the feedback panel never rebuilds it.
- **Vertical slices for the screen.** The first screen task ships the whole flow (route, lesson link, tab list, feedback) with the two tap-to-answer types; typed and reordered answers follow; the summary comes last.

## Task List

### Phase 1: Logic
- [x] Task 1: Grading and shuffling
- [x] Task 2: Exercise session

### Checkpoint 1: Logic ready
- [x] Unit tests pass

### Phase 2: Screens
- [x] Task 3: Session screen with multiple choice and true or false
- [x] Task 4: Fill in the blank and word reordering
- [x] Task 5: Summary and redo mistakes

### Checkpoint 2: Complete
- [x] The owner's real-iPhone check passes (keyboard, chips, feedback)
- [ ] Every success criterion of the spec is met
- [ ] Review with the owner before starting the `access` module

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| The iPhone keyboard autocorrects or capitalizes her answer | Medium | `autocorrect`, `autocapitalize` and `spellcheck` off on the field; grading ignores case anyway. |
| The keyboard hides the "Verificar" button | Medium | The return key also checks the answer; the field scrolls into view. Checked on the iPhone. |
| Chips too small or too close to tap | Medium | 44px minimum height and spacing; checked on the iPhone. |
| A shuffle shows the answer in its original order | Low | Covered by unit tests. |

## Open Questions

None.
