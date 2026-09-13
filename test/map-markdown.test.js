import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMapEmbedUrl, buildMapMarkup, parseLocationInput } from '../src/map-markdown.js';

test('parseLocationInput accepts coordinates and validates their ranges', () => {
  assert.deepEqual(parseLocationInput({ latitude: '3.139', longitude: '101.6869' }), {
    latitude: 3.139,
    longitude: 101.6869,
    link: ''
  });
  assert.equal(parseLocationInput({ latitude: '91', longitude: '10' }), null);
});

test('parseLocationInput extracts coordinates from a map link', () => {
  assert.deepEqual(parseLocationInput({ link: 'https://www.google.com/maps/@3.139,101.6869,15z' }), {
    latitude: 3.139,
    longitude: 101.6869,
    link: 'https://www.google.com/maps/@3.139,101.6869,15z'
  });
  assert.deepEqual(parseLocationInput({ link: 'https://www.openstreetmap.org/#map=16/3.139/101.6869' }).latitude, 3.139);
});

test('buildMapMarkup creates an OpenStreetMap embed and preserves the source link', () => {
  const markup = buildMapMarkup({ latitude: 3.139, longitude: 101.6869, link: 'https://maps.google.com/?q=3.139,101.6869', label: 'Office' });
  assert.match(markup, /class="doc-map"/);
  assert.match(markup, /openstreetmap\.org\/export\/embed\.html/);
  assert.match(markup, /Office/);
  assert.match(markup, /maps\.google\.com/);
  assert.match(markup, /class="doc-map-marker"/);
  assert.match(buildMapEmbedUrl(3.139, 101.6869), /marker=3\.139(?:%2C|,)101\.6869/);
});

test('buildMapMarkup keeps a location link when it has no extractable coordinates', () => {
  const markup = buildMapMarkup({ link: 'https://maps.app.goo.gl/example', label: 'Pickup point' });
  assert.match(markup, /Pickup point/);
  assert.match(markup, /maps\.app\.goo\.gl/);
  assert.doesNotMatch(markup, /<iframe/);
  assert.doesNotMatch(markup, /doc-map-marker/);
});