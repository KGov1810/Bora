// "Ouvir" controls: read a text aloud with speechSynthesis (see docs/specs/SPEC-lessons.md).

import { h } from '../dom.js';
import { pickVoice } from './voices.js';

const NORMAL_RATE = 0.95;
const SLOW_RATE = 0.7;

const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
const STOP_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/></svg>';

/** Builds an icon element from a trusted, hard-coded SVG string. */
function icon(svg) {
  const template = document.createElement('template');
  template.innerHTML = svg;
  return template.content.firstElementChild;
}

/**
 * Creates the "Ouvir" button and the slow-speed toggle for a text.
 * The controls stay hidden until a suitable voice is found, and stay hidden
 * for good when the device has none.
 *
 * @param {string} text - The English text to read.
 * @param {(key: string) => string} t - The translation function.
 * @returns {{ element: HTMLElement, cleanup: () => void }} The controls and a cleanup function.
 */
export function createReadAloud(text, t) {
  const playButton = h('button', { type: 'button', class: 'listen-button' });
  const slowButton = h('button', { type: 'button', class: 'slow-toggle', 'aria-pressed': 'false' }, t('lesson.listen.slow'));
  const element = h('div', { class: 'listen-controls', hidden: '' }, playButton, slowButton);

  if (!('speechSynthesis' in window)) return { element, cleanup: () => {} };
  const synth = window.speechSynthesis;

  let voice = null;
  let speaking = false;

  const showState = () => {
    playButton.replaceChildren(icon(speaking ? STOP_ICON : PLAY_ICON), t(speaking ? 'lesson.listen.stop' : 'lesson.listen.play'));
    playButton.setAttribute('aria-pressed', String(speaking));
  };

  const stop = () => {
    speaking = false;
    synth.cancel();
    showState();
  };

  const play = () => {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = 'en-US';
    utterance.rate = slowButton.getAttribute('aria-pressed') === 'true' ? SLOW_RATE : NORMAL_RATE;
    utterance.onend = () => {
      speaking = false;
      showState();
    };
    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') console.error('Speech error:', event.error);
      speaking = false;
      showState();
    };
    speaking = true;
    showState();
    synth.speak(utterance);
  };

  playButton.addEventListener('click', () => (speaking ? stop() : play()));
  slowButton.addEventListener('click', () => {
    const slow = slowButton.getAttribute('aria-pressed') !== 'true';
    slowButton.setAttribute('aria-pressed', String(slow));
    if (speaking) play(); // restart at the new speed
  });

  // The voice list can be empty at first; it fills when "voiceschanged" fires.
  const findVoice = () => {
    if (voice) return;
    voice = pickVoice(synth.getVoices());
    if (voice) element.hidden = false;
  };
  synth.addEventListener('voiceschanged', findVoice);
  findVoice();
  showState();

  return {
    element,
    cleanup: () => {
      synth.removeEventListener('voiceschanged', findVoice);
      if (speaking) synth.cancel();
    },
  };
}
