// Chooses a natural American English voice for text-to-speech (see docs/specs/SPEC-lessons.md
// and docs/spikes/speech-results.md). Pure module: works on a list of voice-like objects.

// Natural en-US voices, in order of preference.
const ALLOWED = ['Samantha', 'Alex', 'Ava', 'Allison', 'Nicky', 'Susan', 'Tom'];

// Novelty and robotic voices shipped by Apple, with the French names seen on her iPhone.
const NOVELTY = [
  'Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Deranged', 'Fred',
  'Good News', 'Hysterical', 'Jester', 'Junior', 'Kathy', 'Organ', 'Pipe Organ', 'Ralph',
  'Superstar', 'Trinoids', 'Whisper', 'Wobble', 'Zarvox',
  'Mauvaises nouvelles', 'Cloches', 'Bulles', 'Violoncelles', 'Bonnes nouvelles', 'Bouffon',
  'Orgue', 'Trinoïdes', 'Murmure',
];

/** True for American English, whether written en-US or en_US. */
function isAmericanEnglish(voice) {
  return voice.lang.replace('_', '-') === 'en-US';
}

/** The voice name without a variant suffix: "Ava (Enhanced)" gives "Ava". */
function baseName(voice) {
  return voice.name.replace(/\s*\(.*\)\s*$/, '');
}

/**
 * Picks the voice used to read lessons aloud.
 * Order: the allow-list (Samantha first), then any other en-US voice that is not
 * a novelty voice. British and other voices are never used.
 *
 * @param {Array<{ name: string, lang: string }>} voices - Voices from speechSynthesis.getVoices().
 * @returns {{ name: string, lang: string } | null} The chosen voice, or null when none is suitable.
 */
export function pickVoice(voices) {
  const american = voices.filter(isAmericanEnglish);
  for (const name of ALLOWED) {
    const voice = american.find((candidate) => baseName(candidate) === name);
    if (voice) return voice;
  }
  return american.find((voice) => !NOVELTY.includes(baseName(voice))) ?? null;
}
