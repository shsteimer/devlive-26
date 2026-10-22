import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../../support/setup-dom.js';

let m;
before(async () => {
  setupDom();
  m = await import('../../../blocks/store-finder/store-finder.js');
});

const labels = {
  open: 'Open · closes {time}',
  opensToday: 'opens today at {time}',
  opens: 'opens {day} at {time}',
  pickupToday: 'today by {time}',
  pickupLater: '{day} by {time}',
  near: 'Near {place}',
  nearYou: 'Near you',
  all: 'All',
};

describe('store-finder', () => {
  it('uses same-origin API on prod, prod API elsewhere', () => {
    assert.equal(m.apiOrigin({ hostname: 'devlive.shsteimer.com' }), '');
    assert.equal(m.apiOrigin({ hostname: 'main--devlive-26--shsteimer.aem.page' }), 'https://devlive.shsteimer.com');
  });

  it('formats status and pickup with localized day names', () => {
    assert.equal(m.statusText({ open: true, closes: '20:00' }, labels, 'en'), 'Open · closes 20:00');
    assert.equal(m.statusText({ open: false, opens: { day: 'mon', time: '10:00', today: false } }, labels, 'de'), 'opens Montag at 10:00');
    assert.equal(m.statusText({ open: false, opens: { day: 'sun', time: '11:00', today: true } }, labels, 'en'), 'opens today at 11:00');
    assert.equal(m.pickupText({ day: 'sat', time: '12:00', today: false }, labels, 'en'), 'Saturday by 12:00');
    assert.equal(m.pickupText(null, labels, 'en'), '');
  });

  it('heading reflects where the location came from', () => {
    assert.equal(m.headingText({ source: 'edge', city: 'Copenhagen', country: 'DK' }, labels), 'Near Copenhagen, DK');
    assert.equal(m.headingText({ source: 'edge' }, labels), 'All');
    assert.equal(m.headingText({ source: 'browser' }, labels), 'Near you');
    assert.equal(m.headingText(undefined, labels), 'All');
  });

  it('leaves unknown tokens in templates', () => {
    assert.equal(m.fill('{a} {b}', { a: 1 }), '1 {b}');
  });
});
