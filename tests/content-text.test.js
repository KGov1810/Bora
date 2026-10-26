import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitGlossaryMarks } from '../js/content/text.js';

test('returns one text segment when there is no mark', () => {
  assert.deepEqual(splitGlossaryMarks('She works early.'), [{ text: 'She works early.' }]);
});

test('splits a paragraph around one mark', () => {
  assert.deepEqual(splitGlossaryMarks('She [[gets up]] early.'), [
    { text: 'She ' },
    { term: 'gets up', key: 'gets up' },
    { text: ' early.' },
  ]);
});

test('splits a paragraph with several marks', () => {
  assert.deepEqual(splitGlossaryMarks('The [[customers]] order [[to go]].'), [
    { text: 'The ' },
    { term: 'customers', key: 'customers' },
    { text: ' order ' },
    { term: 'to go', key: 'to go' },
    { text: '.' },
  ]);
});

test('handles a mark at the start and at the end', () => {
  assert.deepEqual(splitGlossaryMarks('[[Twice a week]] she [[dances]]'), [
    { term: 'Twice a week', key: 'twice a week' },
    { text: ' she ' },
    { term: 'dances', key: 'dances' },
  ]);
});

test('keeps the displayed case and lower-cases the key', () => {
  assert.deepEqual(splitGlossaryMarks('[[Customers]] wait.')[0], { term: 'Customers', key: 'customers' });
});

test('trims spaces inside a mark', () => {
  assert.deepEqual(splitGlossaryMarks('A [[ to go ]] coffee.')[1], { term: 'to go', key: 'to go' });
});
