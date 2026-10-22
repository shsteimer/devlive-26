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
};

describe('store-finder', () => {
  it('uses same-origin API on prod, prod API elsewhere', () => {
    assert.equal(m.apiOrigin({ hostname: 'devlive.shsteimer.com' }), '');
    assert.equal(m.apiOrigin({ hostname: 'main--devlive-26--shsteimer.aem.page' }), 'https://devlive.shsteimer.com');
  });

  it('formats status with localized day names', () => {
    assert.equal(m.statusText({ open: true, closes: '20:00' }, labels, 'en'), 'Open · closes 20:00');
    assert.equal(m.statusText({ open: false, opens: { day: 'mon', time: '10:00', today: false } }, labels, 'de'), 'opens Montag at 10:00');
    assert.equal(m.statusText({ open: false, opens: { day: 'sun', time: '11:00', today: true } }, labels, 'en'), 'opens today at 11:00');
  });

  it('miles for US and UK, km elsewhere', () => {
    assert.equal(m.formatDistance(16.09344, 'en-US', 'us'), '10 mi');
    assert.equal(m.formatDistance(5, 'en-GB', 'gb'), '3.1 mi');
    assert.equal(m.formatDistance(5, 'de-DE', 'de'), '5 km');
  });

  it('groups by country, sorted by localized country name', () => {
    const stores = [
      { id: 'a', country: 'US' }, { id: 'b', country: 'DE' }, { id: 'c', country: 'US' },
    ];
    const en = m.groupByCountry(stores, 'en');
    assert.deepEqual(en.map((g) => g.name), ['Germany', 'United States']);
    assert.deepEqual(en[1].stores.map((s) => s.id), ['a', 'c']);
    assert.deepEqual(m.groupByCountry(stores, 'de').map((g) => g.name), ['Deutschland', 'Vereinigte Staaten']);
  });

  it('place name from edge origin', () => {
    assert.equal(m.placeName({ city: 'San Jose', country: 'US' }, 'en'), 'San Jose, United States');
    assert.equal(m.placeName({ country: 'DK' }, 'en'), 'Denmark');
    assert.equal(m.placeName(undefined, 'en'), '');
  });

  it('leaves unknown tokens in templates', () => {
    assert.equal(m.fill('{a} {b}', { a: 1 }), '1 {b}');
  });
});
