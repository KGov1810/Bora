# Spec: lessons

Module from `CAPABILITY-MAP.md`. Status: **approved 2026-10-26**.

## Objective

Let the learner read the lessons on her iPhone: the list of lessons in the Lições tab, and a lesson screen with the text, the tappable glossary, the "Ouvir" button, the grammar explanation and the vocabulary list. Exercises are displayed by the next module (`exercises`).

### User stories

- In **Lições**, I see the A2 units and their lessons, in the order of the path, each with its title and duration.
- I tap a lesson and it opens on its own screen. The back button returns to the list.
- I read the English text. Glossary words are visibly marked; when I tap one, a small card shows the pt-BR translation and the note, if any. Tapping elsewhere closes it.
- I tap **Ouvir** and the text is read aloud by a natural American voice. I can tap again to stop, and switch to a slower speed.
- Below the text, I read the grammar explanation in pt-BR, with examples, then the list of the lesson's vocabulary.
- At the end, a button leads to the exercises. Until the `exercises` module exists, it says they are coming soon.
- A lesson I opened once still opens without a connection.

### Lesson screen order

```
┌─────────────────────────────┐
│ ‹ Lições                    │  back link
│ A2 · 10 min                 │  level and duration
│ Um dia na vida de uma       │  pt-BR title
│ barista                     │
├─────────────────────────────┤
│ A Day in the Life of a      │  English text title
│ Barista        [▶ Ouvir]    │  + listen button, slow toggle
│                             │
│ Maya gets up at five…       │  text; glossary words underlined
│      ┌──────────────┐       │
│      │ se levanta   │       │  glossary card on tap
│      │ to get up =… │       │
│      └──────────────┘       │
├─────────────────────────────┤
│ Gramática                   │  grammar title, explanation,
│ …                           │  examples (en + pt)
├─────────────────────────────┤
│ Vocabulário                 │  glossary list: en → pt
├─────────────────────────────┤
│ [ Fazer os exercícios ]     │  disabled, "em breve" until `exercises`
└─────────────────────────────┘
```

The text comes first, then the grammar, as agreed in `SPEC-content-format.md`: she reads, then understands the rule from sentences she has just read.

## Tech Stack

Same as `app-shell`: HTML, CSS and vanilla JavaScript modules, no build step, no dependency.

- **Text-to-speech:** `speechSynthesis`, American English, with a voice allow-list (see below).
- **Content loading:** `fetch` of `content/path.json` and `content/lessons/<id>.json`, checked with `validateLesson` and `validatePath` before display.
- **Offline:** the service worker caches content files the first time they are loaded.

## Routes

| Hash | Screen |
|---|---|
| `#/lessons` | List of units and lessons |
| `#/lessons/<lesson-id>` | One lesson |

The Lições tab stays highlighted on both. An unknown lesson id shows an error state with a link back to the list.

## Behaviour details

### Glossary marks

`[[word]]` marks become tappable elements (`<button>` styled as underlined text, so they are reachable by keyboard and screen readers). The card shows `pt` and `note`. Only one card is open at a time. The text never goes through `innerHTML`.

### Voice selection

From the spike results (`docs/spikes/speech-results.md`), voices are picked from an allow-list, in order of preference: Samantha, then any other natural `en-US` voice from the allow-list (Alex, Ava, Allison, Nicky, Susan, Tom), then any `en-US` voice that is not a known novelty voice. Novelty voices (Albert, Bahh, Bells, Boing, Bubbles, Cellos, Fred, Junior, Kathy, Organ, Ralph, Superstar, Trinoids, Whisper, Wobble, Zarvox, and their localized names) are never used. If no suitable voice exists, the button is hidden.

The voice list can be empty on the first call; the app waits for the `voiceschanged` event.

Speeds: normal (0.95) and slow (0.7). Leaving the lesson screen stops the voice.

### Loading and errors

- While loading: a short loading state.
- If a file cannot be loaded (offline and never opened) or fails validation, a pt-BR message explains what happened and offers a link back to the list. Validation errors are written to the console for debugging.

### Offline

The service worker caches `content/` files with a "network first, cache as fallback" strategy: with a connection she always gets the latest version of a lesson, and without one she gets the last version she opened.

## Project Structure

```
js/
  router.js                 → + parseRoute(): route name and parameter (unit-tested)
  content/
    load.js                 → fetch + validate path and lessons (thin, DOM-free)
    text.js                 → splitGlossaryMarks(): paragraph → text and term segments (unit-tested)
  speech/
    voices.js               → pickVoice(): voice allow-list (unit-tested)
  views/
    lessons.js              → list or lesson screen, depending on the route parameter
    lesson.js               → lesson screen rendering
locales/pt-BR.json          → new UI strings (back, Ouvir, Parar, Mais devagar, Gramática, Vocabulário…)
css/lesson.css              → lesson screen styles
sw.js                       → content/ runtime caching, version bump
```

## Code Style

Same conventions as `app-shell` and `content-format`. Pure logic (route parsing, glossary splitting, voice choice) lives in DOM-free modules with unit tests; views stay thin.

```js
// js/content/text.js
/**
 * Splits a paragraph into plain text and glossary terms.
 * "She [[gets up]] early." → [{ text: 'She ' }, { term: 'gets up', key: 'gets up' }, { text: ' early.' }]
 */
export function splitGlossaryMarks(paragraph) { /* ... */ }
```

## Testing Strategy

- **Unit tests (`node --test`):**
  - `parseRoute`: `#/lessons`, `#/lessons/<id>`, unknown routes, extra segments;
  - `splitGlossaryMarks`: no mark, one mark, several marks, a mark at the start or end, case kept in the displayed term and lower-cased in the key;
  - `pickVoice`: Samantha preferred, allow-list order, novelty voices skipped, no suitable voice, `en-GB` only.
- **Headless browser check (Claude):** list screen, lesson screen, glossary card open and close, back link, unknown lesson id, offline reopening, both themes, no console errors.
- **Real iPhone (owner):** reading comfort, glossary taps, "Ouvir" with the slow speed, back navigation, opening a lesson in airplane mode after a first visit.

## Boundaries

- **Always:**
  - put every UI string in `pt-BR.json`;
  - validate content before displaying it;
  - bump `CACHE_VERSION` and list new files in `sw.js`;
  - keep glossary words reachable by keyboard and screen readers.
- **Ask first:** changing the lesson content format (that belongs to `content-format`).
- **Never:**
  - render content with `innerHTML`;
  - use a novelty voice;
  - block the lesson when text-to-speech is unavailable (the button is simply hidden).

## Success Criteria

1. The Lições tab lists the units and lessons of `content/path.json`.
2. The first A2 lesson opens, with the text, a working glossary, "Ouvir", the grammar and the vocabulary.
3. A lesson opened once still opens in airplane mode.
4. The owner's real-iPhone checklist passes.
5. `node --test` passes.

## Out of scope

- Exercises (next module).
- Marking a lesson as done, or any progress (the `progress` module).
- Word-by-word highlighting while the text is read aloud.
- A full translation of the text.

## Open Questions

None.
