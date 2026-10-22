import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStatus, pickupTime, findStores } from '../store-logic.js';
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

test('pickup is lead time after now, or after opening', () => {
  assert.deepEqual(pickupTime(store, at('2026-10-19T08:30:00Z')), { day: 'mon', time: '12:30', today: true });
  assert.deepEqual(pickupTime(store, at('2026-10-19T06:00:00Z')), { day: 'mon', time: '12:00', today: true });
});

test('pickup rolls to next open day when not ready before close', () => {
  assert.deepEqual(pickupTime(store, at('2026-10-19T17:30:00Z')), { day: 'tue', time: '12:00', today: false });
});

test('sorts by distance when an origin is known, by name otherwise', () => {
  const stores = [
    { id: 'tokyo', name: 'A Tokyo', lat: 35.66, lng: 139.7, ...store },
    { id: 'cph', name: 'B Copenhagen', lat: 55.68, lng: 12.57, ...store },
  ];
  const near = findStores(stores, { from: { lat: 55.7, lng: 12.6 } });
  assert.deepEqual(near.map((s) => s.id), ['cph', 'tokyo']);
  assert.ok(near[0].distanceKm < 5);
  assert.equal(near[0].hours, undefined);
  assert.deepEqual(findStores(stores).map((s) => s.id), ['tokyo', 'cph']);
});

test('browser coordinates win over edge geo; invalid input falls back', () => {
  const cf = {
    latitude: '55.68', longitude: '12.57', city: 'Copenhagen', country: 'DK',
  };
  assert.equal(getOrigin(new URL('https://x/api/stores?lat=48.86&lng=2.36'), cf).source, 'browser');
  assert.equal(getOrigin(new URL('https://x/api/stores?lat=999&lng=2'), cf).source, 'edge');
  assert.equal(getOrigin(new URL('https://x/api/stores')).source, 'none');
});

test('CORS only for known origins', async () => {
  const get = (origin) => worker.fetch(new Request('https://devlive.shsteimer.com/api/stores', { headers: { origin } }));
  const ok = await get('https://main--devlive-26--shsteimer.aem.page');
  assert.equal(ok.headers.get('access-control-allow-origin'), 'https://main--devlive-26--shsteimer.aem.page');
  assert.equal(ok.headers.get('x-cache'), 'MISS');
  assert.equal((await ok.json()).stores.length, 8);
  const bad = await get('https://evil.example');
  assert.equal(bad.headers.get('access-control-allow-origin'), null);
});

test('only GET /api/stores', async () => {
  assert.equal((await worker.fetch(new Request('https://x/api/stores', { method: 'POST' }))).status, 405);
  assert.equal((await worker.fetch(new Request('https://x/api/nope'))).status, 404);
});
