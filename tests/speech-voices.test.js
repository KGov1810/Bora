import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickVoice } from '../js/speech/voices.js';

// Voices as reported by the learner's iPhone (docs/spikes/speech-results.md), plus a few extras.
const IPHONE_VOICES = [
  { name: 'Daniel', lang: 'en-GB' },
  { name: 'Karen', lang: 'en-AU' },
  { name: 'Albert', lang: 'en-US' },
  { name: 'Bahh', lang: 'en-US' },
  { name: 'Bulles', lang: 'en-US' },
  { name: 'Fred', lang: 'en-US' },
  { name: 'Samantha', lang: 'en-US' },
  { name: 'Zarvox', lang: 'en-US' },
];

test('prefers Samantha', () => {
  assert.equal(pickVoice(IPHONE_VOICES).name, 'Samantha');
});

test('follows the allow-list order when Samantha is missing', () => {
  const voices = [
    { name: 'Tom', lang: 'en-US' },
    { name: 'Ava', lang: 'en-US' },
    { name: 'Alex', lang: 'en-US' },
  ];
  assert.equal(pickVoice(voices).name, 'Alex');
});

test('accepts enhanced variants of an allowed voice', () => {
  assert.equal(pickVoice([{ name: 'Ava (Enhanced)', lang: 'en-US' }]).name, 'Ava (Enhanced)');
});

test('accepts an underscore in the language code', () => {
  assert.equal(pickVoice([{ name: 'Samantha', lang: 'en_US' }]).name, 'Samantha');
});

test('falls back to another en-US voice that is not a novelty voice', () => {
  const voices = [
    { name: 'Bahh', lang: 'en-US' },
    { name: 'Evan', lang: 'en-US' },
  ];
  assert.equal(pickVoice(voices).name, 'Evan');
});

test('never returns a novelty voice, in English or French', () => {
  const voices = ['Albert', 'Bahh', 'Bells', 'Cloches', 'Bulles', 'Fred', 'Junior', 'Kathy', 'Murmure', 'Ralph', 'Superstar', 'Trinoïdes', 'Wobble', 'Zarvox']
    .map((name) => ({ name, lang: 'en-US' }));
  assert.equal(pickVoice(voices), null);
});

test('returns null when only British voices exist', () => {
  assert.equal(pickVoice([{ name: 'Daniel', lang: 'en-GB' }]), null);
});

test('returns null when the list is empty', () => {
  assert.equal(pickVoice([]), null);
});

test('ignores an allowed name in another language', () => {
  assert.equal(pickVoice([{ name: 'Samantha', lang: 'fr-FR' }]), null);
});
