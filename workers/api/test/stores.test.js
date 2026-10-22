import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStatus, findStores } from '../store-logic.js';
import STORES from '../stores.js';
import worker, { getOrigin } from '../index.js';

const store = {
  timeZone: 'Europe/Copenhagen',
  hours: {
    mon: ['10:00', '20:00'], tue: ['10:00', '20:00'], sat: ['10:00', '20:00'],
  },
};

const at = (iso) => new Date(iso);

test('open during hours, in the store time zone', () => {
  assert.deepEqual(openStatus(store, at('2026-10-19T08:30:00Z')), { open: true, closes: '20:00' });
});

test('before opening today: opens today', () => {
  assert.deepEqual(openStatus(store, at('2026-10-19T07:00:00Z')).opens, { day: 'mon', time: '10:00', today: true });
});

test('after closing: opens next open day, skipping closed days', () => {
  assert.deepEqual(openStatus(store, at('2026-10-20T19:00:00Z')).opens, { day: 'sat', time: '10:00', today: false });
});

test('nearest by distance when an origin is known', () => {
  const sanJose = { lat: 37.3, lng: -121.9 };
  const { nearest, stores } = findStores(STORES, { from: sanJose });
  assert.equal(nearest.length, 6);
  assert.equal(nearest[0].id, 'san-jose');
  assert.equal(nearest[1].id, 'palo-alto');
  assert.ok(nearest.every((s, i) => i === 0 || s.distanceKm >= nearest[i - 1].distanceKm));
  assert.equal(stores.length, STORES.length);
  assert.equal(stores[0].hours, undefined);
});

test('no origin: no nearest, all stores by country then name', () => {
  const { nearest, stores } = findStores(STORES);
  assert.deepEqual(nearest, []);
  const keys = stores.map((s) => `${s.country} ${s.name}`);
  assert.deepEqual(keys, [...keys].sort((a, b) => a.localeCompare(b)));
  assert.equal(stores[0].distanceKm, undefined);
});

test('every store has valid data', () => {
  STORES.forEach((s) => {
    assert.match(s.country, /^[A-Z]{2}$/, s.id);
    assert.doesNotThrow(() => openStatus(s, new Date()), s.id);
  });
  assert.equal(new Set(STORES.map((s) => s.id)).size, STORES.length);
});

test('query coordinates win over edge geo; invalid input falls back', () => {
  const cf = {
    latitude: '55.68', longitude: '12.57', city: 'Copenhagen', country: 'DK',
  };
  assert.equal(getOrigin(new URL('https://x/api/stores?lat=48.86&lng=2.36'), cf).source, 'query');
  assert.equal(getOrigin(new URL('https://x/api/stores?lat=999&lng=2'), cf).source, 'edge');
  assert.equal(getOrigin(new URL('https://x/api/stores')).source, 'none');
});

test('CORS only for known origins', async () => {
  const get = (origin) => worker.fetch(new Request('https://devlive.shsteimer.com/api/stores', { headers: { origin } }));
  const ok = await get('https://main--devlive-26--shsteimer.aem.page');
  assert.equal(ok.headers.get('access-control-allow-origin'), 'https://main--devlive-26--shsteimer.aem.page');
  assert.equal(ok.headers.get('x-cache'), 'MISS');
  assert.equal((await ok.json()).stores.length, STORES.length);
  const bad = await get('https://evil.example');
  assert.equal(bad.headers.get('access-control-allow-origin'), null);
});

test('only GET /api/stores', async () => {
  assert.equal((await worker.fetch(new Request('https://x/api/stores', { method: 'POST' }))).status, 405);
  assert.equal((await worker.fetch(new Request('https://x/api/nope'))).status, 404);
});
