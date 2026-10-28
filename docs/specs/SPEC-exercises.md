# Spec: exercises

Module from `CAPABILITY-MAP.md`. Status: **approved 2026-10-26**.

## Objective

Let the learner practice each lesson with its exercises, one at a time, with immediate correction and a pt-BR explanation, then a short summary. All four exercise types of `SPEC-content-format.md` are supported: `choice`, `true-false`, `fill-blank` and `reorder`. No result is saved yet; saving belongs to the `progress` module.

### User stories

- At the end of a lesson, I tap **Fazer os exercícios** and the first exercise opens.
- In the **Exercícios** tab, I see the lessons and can start the exercises of any of them.
- I see one exercise at a time, with my position (3 of 9) and a progress bar.
- I answer and immediately see whether I am right, with the explanation in Portuguese and, when I am wrong, the correct answer.
- I tap **Continuar** to go to the next exercise.
- At the end, I see my score and the exercises I missed, and I can **redo only my mistakes**, or go back to the lesson.

### How each type is answered

| Type | Display | Answering |
|---|---|---|
| `choice` | The pt-BR question and the options as large buttons. **Options are shuffled**, so the right answer is not always in the same place. | Tapping an option answers. |
| `true-false` | The English statement, then **Verdadeiro** and **Falso**. | Tapping a button answers. |
| `fill-blank` | The pt-BR instruction, the English sentence with the blank, and the hint in brackets when present. A text field below. | Typing, then **Verificar** or the keyboard's return key. Graded with `isAcceptedAnswer` (case, spaces and apostrophes do not count). |
| `reorder` | The pt-BR instruction, an empty answer line, and the words as shuffled chips (never already in the right order). | Tapping a chip moves it to the answer line; tapping it there sends it back. **Verificar** is enabled once every word is placed. |

The text field uses `lang="en"`, `autocapitalize="off"`, `autocorrect="off"` and `spellcheck="false"`, so the iPhone does not "fix" her answer for her.

### Feedback

- **Right:** a green panel with a check icon, "Correto!", and the explanation.
- **Wrong:** a red panel with a cross icon, "Não foi dessa vez", the correct answer, and the explanation.
- The panel never relies on color alone (icon and words), and it is announced to screen readers.
- After answering, the exercise is locked; **Continuar** moves on.

### Summary

- Score: "7 de 9 certas".
- The list of missed exercises, each with its question and the correct answer.
- **Refazer os erros** starts a new round with only the missed exercises (shown when there is at least one).
- **Voltar para a lição** returns to the lesson screen.

## Routes

| Hash | Screen |
|---|---|
| `#/exercises` | List of lessons, each with a link to its exercises |
| `#/exercises/<lesson-id>` | The exercise session for that lesson |

The lesson screen's button links to `#/exercises/<lesson-id>`. Leaving a session in the middle ends it (nothing is saved yet).

## Project Structure

```
js/exercises/
  grade.js          → gradeExercise(exercise, response): { correct, expected } (pure, unit-tested)
  shuffle.js        → shuffle(items, random): a copy, never equal to the input when it can differ (pure, unit-tested)
  session.js        → createSession(exercises): current item, answer(), next(), results, mistakes (pure, unit-tested)
js/views/
  exercises.js      → list or session, depending on the route parameter
  exercise-session.js → session screen: one exercise, feedback, summary
js/views/lesson.js  → "Fazer os exercícios" becomes a link
css/exercises.css
locales/pt-BR.json
sw.js               → new files, version bump
```

The `random` parameter of `shuffle` is injected so the tests are deterministic; the app passes `Math.random`.

## Code Style

Same conventions as the previous modules: grading, shuffling and session logic are pure and unit-tested; views only build elements and forward taps.

```js
// js/exercises/grade.js
/**
 * Grades one answer.
 * choice → option index; true-false → boolean; fill-blank → typed text; reorder → list of words.
 * @returns {{ correct: boolean, expected: string }} expected is the right answer, ready to display.
 */
export function gradeExercise(exercise, response) { /* ... */ }
```

## Testing Strategy

- **Unit tests (`node --test`):**
  - `gradeExercise`: each type, right and wrong answers, the normalized `fill-blank` answers, the displayed `expected` value;
  - `shuffle`: same items, deterministic with an injected random, never identical to the input for 2 or more distinct items;
  - `createSession`: order, answering, moving on, score, mistakes, a new session from the mistakes only.
- **Headless browser check (Claude):** every exercise type answered right and wrong, the summary, "Refazer os erros", the links from the lesson and from the tab, both themes, no console errors.
- **Real iPhone (owner and learner):** the keyboard does not autocorrect, chips are easy to tap, feedback is clear.

## Boundaries

- **Always:** pt-BR strings in `pt-BR.json`; grading only through `gradeExercise`; new files listed in `sw.js` with a version bump.
- **Ask first:** saving results anywhere (that is the `progress` module).
- **Never:** reveal the right answer before she answers; rely on color alone for right and wrong.

## Success Criteria

1. The nine exercises of the first lesson can be done from the lesson screen and from the Exercícios tab.
2. All four types work as described, with feedback and explanation.
3. The summary shows the score and the mistakes, and "Refazer os erros" works.
4. The owner's real-iPhone check passes.
5. `node --test` passes.

## Out of scope

- Saving scores or marking a lesson as done (`progress`).
- Free writing corrected by AI (`ai-correction`).
- Listening and speaking exercises (`speech`).
- Timers, points or streaks.

## Open Questions

None.
