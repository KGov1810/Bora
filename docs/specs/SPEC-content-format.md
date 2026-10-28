# Spec: content-format

Module from `CAPABILITY-MAP.md`. Status: **approved 2026-10-26**.

## Objective

Define how lessons and exercises are written, stored and checked, so that:

- Claude can write new lessons in conversation and add them to the repository as data files, with no code change;
- the `lessons` and `exercises` modules can display any lesson that follows the format;
- a broken lesson file is caught by a test before it is pushed, not on the learner's iPhone.

This module does **not** build any screen. The display belongs to `lessons` and `exercises`.

### Teaching approach (agreed 2026-10-26)

Written comprehension comes first. Every lesson is built around one short English text:

1. **A short text** at her level (a travel dialogue, a mini-article, an episode summary…). The texts are original, written for the app in the style of real sources; no copyrighted articles or scripts are reproduced.
2. **An inline glossary.** Difficult words in the text are marked; tapping one shows its pt-BR translation. The lesson's vocabulary is also listed at the end.
3. **One grammar point**, explained in pt-BR from sentences of the text.
4. **Exercises**, all graded automatically, each with a pt-BR explanation shown after an answer: comprehension questions (multiple choice, true or false), fill in the blank, and word reordering.
5. **An optional "Ouvir" button** reads the text aloud (text-to-speech). Listening and speaking exercises come later in the path.

One lesson covers one notion and takes about 10 minutes. The path goes A2, then B1, then B2.

## Tech Stack

- **Data:** JSON files, UTF-8, in the repository. No database for content.
- **Validation:** a pure JavaScript module (`js/content/validate.js`), with no DOM access and no dependency. The app and the tests use the same validator.
- **Tests:** `node --test`, as in `app-shell`.

## Commands

```
Unit tests (validator + every content file): node --test
```

## Project Structure

```
content/
  path.json                 → The learning path: levels, units, and the order of lessons
  lessons/
    <lesson-id>.json         → One file per lesson; file name = lesson id
js/content/
  validate.js               → validateLesson(), validatePath() (pure, unit-tested)
tests/
  content-validate.test.js  → Validator unit tests (valid and broken samples)
  content-files.test.js     → Runs the validator on every file in content/
docs/
  curriculum.md             → Planned lessons per level, not yet written
```

## The format

### Lesson file

`content/lessons/a2-past-simple-weekend.json`:

```json
{
  "schemaVersion": 1,
  "id": "a2-past-simple-weekend",
  "level": "A2",
  "title": "Um fim de semana em Londres",
  "grammarPoint": "Past simple",
  "theme": "travel",
  "estimatedMinutes": 10,
  "text": {
    "title": "A weekend in London",
    "paragraphs": [
      "Last weekend, Ana [[visited]] London with her sister.",
      "They [[booked]] a small hotel near the river and walked a lot."
    ]
  },
  "glossary": {
    "visited": { "pt": "visitou" },
    "booked": { "pt": "reservaram", "note": "to book = reservar" }
  },
  "grammar": {
    "title": "Past simple: ações terminadas no passado",
    "explanation": [
      "Usamos o past simple para ações que começaram e terminaram no passado.",
      "Nos verbos regulares, acrescentamos -ed: visit → visited."
    ],
    "examples": [
      { "en": "Ana visited London.", "pt": "A Ana visitou Londres." }
    ]
  },
  "exercises": [
    {
      "id": "q1",
      "type": "choice",
      "prompt": "Com quem a Ana foi para Londres?",
      "options": ["Com a irmã", "Com uma amiga", "Sozinha"],
      "answer": 0,
      "explanation": "O texto diz: \"with her sister\" (com a irmã dela)."
    },
    {
      "id": "q2",
      "type": "true-false",
      "statement": "They stayed in a big hotel.",
      "answer": false,
      "explanation": "O hotel era pequeno: \"a small hotel\"."
    },
    {
      "id": "q3",
      "type": "fill-blank",
      "prompt": "Complete com o verbo no passado.",
      "sentence": "Last year, we ___ Paris.",
      "answers": ["visited"],
      "hint": "visit",
      "explanation": "Verbo regular: visit + -ed = visited."
    },
    {
      "id": "q4",
      "type": "reorder",
      "prompt": "Coloque as palavras na ordem certa.",
      "words": ["They", "walked", "a", "lot"],
      "explanation": "Sujeito + verbo + complemento: They walked a lot."
    }
  ]
}
```

### Lesson rules (checked by `validateLesson`)

| Field | Rule |
|---|---|
| `schemaVersion` | Must be `1`. |
| `id` | Kebab-case, starts with the level in lower case (`a2-`, `b1-`, `b2-`). Must equal the file name without `.json`. |
| `level` | One of `A2`, `B1`, `B2`. |
| `title`, `grammarPoint`, `theme` | Non-empty strings. `title` is pt-BR. |
| `estimatedMinutes` | Integer from 3 to 20. |
| `text.title`, `text.paragraphs` | English. At least one paragraph. |
| Glossary marks | `[[word]]` in a paragraph. The key is the marked text in lower case. Every mark must have a `glossary` entry, and every entry must be used at least once. Marks cannot be nested or empty. |
| `glossary.<key>.pt` | Non-empty pt-BR translation. `note` is optional. |
| `grammar` | `title`, at least one `explanation` paragraph, at least one `{ en, pt }` example. |
| `exercises` | At least 3. Each `id` is unique within the lesson. Every exercise has a non-empty pt-BR `explanation`. |

### Exercise types

| `type` | Fields | Graded as correct when |
|---|---|---|
| `choice` | `prompt`, `options` (2 to 5 strings), `answer` (index) | The chosen index equals `answer`. |
| `true-false` | `statement` (English), `answer` (boolean) | The chosen value equals `answer`. |
| `fill-blank` | `prompt`, `sentence` with exactly one `___`, `answers` (at least one accepted string), optional `hint` | The typed text matches one of `answers` after normalization. |
| `reorder` | `prompt`, `words` (2 to 12, in the correct order) | The words are put back in exactly that order. The app shuffles them for display. |

**Normalization for `fill-blank`:** trim, lower case, collapse inner spaces, and turn curly apostrophes (’) into straight ones ('). This way, "Visited", " visited " and "didn’t" all count when the expected answers are "visited" and "didn't".

### Learning path

`content/path.json`:

```json
{
  "schemaVersion": 1,
  "levels": [
    {
      "level": "A2",
      "units": [
        {
          "id": "a2-u1",
          "title": "Falar do passado",
          "lessons": ["a2-past-simple-weekend"]
        }
      ]
    }
  ]
}
```

`validatePath` checks:
- every unit id is unique;
- every listed lesson has a file in `content/lessons/`;
- every lesson listed under a level has that same `level`;
- no lesson appears twice.

A lesson file that the path does not list is allowed (a draft), but a test reports it.

## Code Style

Same conventions as `app-shell`: English code and comments, pure modules without DOM access. The validator returns a list of readable errors instead of throwing, so a test failure says exactly what to fix:

```js
// js/content/validate.js
/**
 * Checks a lesson object against the content format.
 * @returns {string[]} Human-readable errors; empty when the lesson is valid.
 */
export function validateLesson(lesson, fileName) { /* ... */ }
```

Example error: `a2-past-simple-weekend.json: glossary key "booked" is never marked in the text`.

## Testing Strategy

- **Validator unit tests:** one valid sample, then one broken sample per rule (missing field, unknown type, glossary mark without entry, unused glossary entry, `fill-blank` without `___`, duplicate exercise id, id that does not match the file name…).
- **Content files test:** loads `content/path.json` and every file in `content/lessons/`, and fails with the validator's errors if any file is invalid. Any new lesson is checked automatically.
- **Normalization tests:** for the `fill-blank` comparison function.

## Boundaries

- **Always:**
  - run `node --test` before proposing a commit with new or changed content;
  - write explanations, titles and translations in Brazilian Portuguese;
  - keep texts original and at the lesson's level.
- **Ask first:**
  - changing the format in a way that breaks existing lessons (this needs a new `schemaVersion`);
  - adding a new exercise type.
- **Never:**
  - copy text from real articles, books, song lyrics or series scripts;
  - put HTML in content files (the app shows content as plain text).

## Success Criteria

1. The format is documented in this spec, with a full example.
2. `validateLesson` and `validatePath` exist, with a unit test for every rule.
3. `content/path.json` and the first real A2 lesson exist and pass the content files test.
4. `docs/curriculum.md` lists the planned A2 lessons, in order, approved by the owner.
5. `node --test` passes.

## Open Questions

None. Resolved:

- **Variety of English:** American English (spelling such as *traveled*, *color*; default voice `en-US`, Samantha). British forms may be mentioned in glossary notes.
