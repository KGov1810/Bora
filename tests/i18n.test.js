import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTranslator } from '../js/i18n.js';

test('returns the string for an existing key', () => {
  const t = createTranslator({ 'tabs.home': 'Início' });
  assert.equal(t('tabs.home'), 'Início');
});

test('returns the key itself when the key is missing', () => {
  const t = createTranslator({ 'tabs.home': 'Início' });
  assert.equal(t('tabs.unknown'), 'tabs.unknown');
});

test('returns the key itself when no strings are loaded', () => {
  const t = createTranslator();
  assert.equal(t('tabs.home'), 'tabs.home');
});

test('does not return inherited object properties as strings', () => {
  const t = createTranslator({});
  assert.equal(t('toString'), 'toString');
});
