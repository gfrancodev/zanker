import test from 'node:test';
import assert from 'node:assert/strict';
import {searchIcons} from '../src/icons.mjs';

test('a query returns the intents whose terms it contains', () => {
  const results = searchIcons('preciso de um icone de busca');
  assert.equal(results[0].intent, 'search');
  assert.ok(results[0].alternatives.length > 0, 'a suggestion names icons to use');
  assert.ok(results[0].guidance.length > 0, 'a suggestion says when the icon fits');
});

test('more matching terms rank higher', () => {
  const results = searchIcons('menu de navigation com settings e security');
  assert.equal(results[0].intent, 'navigation', 'two matching terms beat one');
  assert.equal(results[0].score, 2);
  assert.deepEqual(results.map((icon) => icon.intent).slice(1).sort(), ['security', 'settings']);
});

test('a query matching nothing returns nothing rather than a weak guess', () => {
  assert.deepEqual(searchIcons('quantum tunnelling'), []);
  assert.deepEqual(searchIcons(''), []);
});

test('the query is matched case insensitively and accepts any type', () => {
  assert.equal(searchIcons('DASHBOARD')[0].intent, 'home');
  assert.deepEqual(searchIcons(12345), []);
});

test('a suggestion never mutates the table it came from', () => {
  const first = searchIcons('home')[0];
  first.intent = 'tampered';
  assert.equal(searchIcons('home')[0].intent, 'home');
});
