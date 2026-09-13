import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_TABLE_SETTINGS,
  normalizeDocumentState,
  normalizeBookTitle,
  normalizeTableSettings,
  hasUnsavedChanges
} from '../src/data-store.js';
import { clampSidebarWidth } from '../src/sidebar-resize.js';
import { isSpaRoute } from '../server.js';

test('normalizeTableSettings keeps valid table appearance settings', () => {
  assert.deepEqual(normalizeTableSettings({ headerColor: '#ABC123', textAlign: 'center' }), {
    headerColor: '#abc123',
    textAlign: 'center'
  });
});

test('normalizeTableSettings falls back safely for invalid values', () => {
  assert.deepEqual(normalizeTableSettings({ headerColor: 'red', textAlign: 'justify' }), DEFAULT_TABLE_SETTINGS);
});

test('normalizeDocumentState returns valid page tree and active id', () => {
  const normalized = normalizeDocumentState({ pages: null, activeId: null });

  assert.ok(Array.isArray(normalized.pages));
  assert.ok(normalized.pages.length > 0);
  assert.ok(typeof normalized.activeId === 'string');
});

test('normalizeDocumentState preserves valid state', () => {
  const input = {
    pages: [{ id: 'p_1', title: 'Hello', content: 'World', children: [] }],
    activeId: 'p_1'
  };

  const normalized = normalizeDocumentState(input);
  assert.deepEqual(normalized.pages, input.pages);
  assert.equal(normalized.activeId, 'p_1');
});

test('normalizeDocumentState preserves recipe metadata for recipe pages', () => {
  const input = {
    pages: [{
      id: 'p_1',
      title: 'Nasi Lemak',
      content: 'Resepi ringkas',
      children: [],
      recipe: {
        title: 'Nasi Lemak',
        category: 'Sarapan',
        servings: 2,
        prepTime: 15,
        cookTime: 25,
        ingredients: ['2 cawan nasi', '2 sudu sambal'],
        steps: ['Panaskan nasi', 'Tambah sambal']
      }
    }],
    activeId: 'p_1'
  };

  const normalized = normalizeDocumentState(input);
  assert.equal(normalized.pages[0].recipe.title, 'Nasi Lemak');
  assert.equal(normalized.pages[0].recipe.category, 'Sarapan');
  assert.equal(normalized.pages[0].recipe.servings, 2);
  assert.deepEqual(normalized.pages[0].recipe.ingredients, ['2 cawan nasi', '2 sudu sambal']);
  assert.deepEqual(normalized.pages[0].recipe.steps, ['Panaskan nasi', 'Tambah sambal']);
});

test('normalizeBookTitle trims and falls back to the default title', () => {
  assert.equal(normalizeBookTitle('  Masakanku  '), 'Masakanku');
  assert.equal(normalizeBookTitle('   '), 'RecipeBook');
  assert.equal(normalizeBookTitle(null), 'RecipeBook');
});

test('hasUnsavedChanges detects content edits that differ from the saved version', () => {
  assert.equal(hasUnsavedChanges('hello', 'hello'), false);
  assert.equal(hasUnsavedChanges('hello world', 'hello'), true);
  assert.equal(hasUnsavedChanges('', null), true);
});

test('clampSidebarWidth keeps the sidebar within allowed resize bounds', () => {
  assert.equal(clampSidebarWidth(120), 180);
  assert.equal(clampSidebarWidth(500), 480);
  assert.equal(clampSidebarWidth(260), 260);
});

test('isSpaRoute excludes api routes from the frontend fallback', () => {
  assert.equal(isSpaRoute('/api/docbook'), false);
  assert.equal(isSpaRoute('/api'), false);
  assert.equal(isSpaRoute('/recipes'), true);
  assert.equal(isSpaRoute('/'), true);
});
