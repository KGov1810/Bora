# Speech spike results

Test page: `spikes/speech-test.html` (live at `https://kgov1810.github.io/Bora/spikes/speech-test.html`).
Device: the learner's iPhone, iOS 26.6.1 (Safari reports a frozen `iPhone OS 18_7` in its user agent).
Date: 2026-10-26

## Results

| Test | Safari | Installed (home screen) |
|---|---|---|
| Text-to-speech, `en-US` (Samantha) | Works | Not tested (same engine, voices listed) |
| Text-to-speech, `en-GB` (Daniel) | Works | Not tested (same engine, voices listed) |
| Speech recognition, `en-US` | Works | Works (exact match on first try) |
| Keyboard dictation | Works | Not tested |

## Notes

- **Voices:** 25 English voices are listed, in both modes. They include good voices (Samantha `en-US`, Daniel `en-GB`, Karen `en-AU`, Moira `en-IE`) and novelty voices (Bahh, Bulles, Zarvox, Murmure…) that the app must never pick. The voice list is empty on the first call and fills a moment later, so the app must wait for it.
- **`canceled` errors:** caused by tapping a play button while a sentence was still being read. This is expected, because the page cancels the previous utterance.
- **Recognition:**
  - One `aborted` error on the very first attempt, probably during the microphone permission prompt.
  - One transcript of something other than the target ("Busy busy busy"), which shows that recognition returns what it actually hears. That is the behaviour needed to correct her speaking.
  - Every attempt with the target sentence matched.
- **Dictation:** iOS adds punctuation and capitals ("Where Is, The Train station"). Normalizing case and punctuation before comparing handles it.

### Raw report: Safari

```
Modo: Navegador (Safari)
Reconhecimento de voz: disponível
TTS: 25 English voices
TTS: en-US started, voice="Samantha" … ended
TTS: en-GB started, voice="Daniel" … ended
SR: error=aborted
SR: transcript="Busy busy busy", match=false
SR: transcript="I would like a coffee please", match=true
DICTATION: text="Where Is, The Train station", match=true
```

### Raw report: installed

```
Modo: App instalado (tela de início)
Reconhecimento de voz: disponível
TTS: 25 English voices
SR: transcript="I would like a coffee please", match=true
```

## Decision for the `speech` module

- **Speaking:** use native speech recognition (`webkitSpeechRecognition`, `lang="en-US"`) as the primary input, because it works in Safari and in the installed app.
- **Fallback:** keep iOS keyboard dictation, for when recognition fails or the microphone permission is denied.
- **Listening:** use `speechSynthesis` with an allow-list of natural voices (Samantha, Daniel, Karen, Moira…). Never pick a voice by language alone.
- **To confirm when the `speech` module starts:** text-to-speech and dictation in installed mode. A quick check is enough, since they rely on the same system features as in Safari.
