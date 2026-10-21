import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../support/setup-dom.js';

setupDom();
const { getLocale, localizeLinks } = await import('../../scripts/shared.js');

describe('getLocale', () => {
  it('reads language and region from the path', () => {
    assert.deepEqual(getLocale('/de/ch/products/trail'), {
      lang: 'de', region: 'ch', prefix: '/de/ch', htmlLang: 'de-CH',
    });
  });

  it('handles a language-only path', () => {
    assert.deepEqual(getLocale('/en'), {
      lang: 'en', region: '', prefix: '/en', htmlLang: 'en',
    });
  });

  it('falls back to en with no prefix for non-locale paths', () => {
    assert.deepEqual(getLocale('/library/blocks/tabs'), {
      lang: 'en', region: '', prefix: '', htmlLang: 'en',
    });
  });
});

describe('localizeLinks', () => {
  function linksOn(pageUrl, hrefs) {
    setupDom(pageUrl);
    const el = document.createElement('div');
    el.innerHTML = hrefs.map((h) => `<a href="${h}">x</a>`).join('');
    localizeLinks(el);
    return [...el.querySelectorAll('a')].map((a) => a.getAttribute('href'));
  }

  it('rewrites master-locale links to the current region', () => {
    const [href] = linksOn('http://localhost:3000/de/ch/', ['/de/products/trail?size=42#reviews']);
    assert.equal(href, '/de/ch/products/trail?size=42#reviews');
  });

  it('leaves links already in the current locale, external links and non-locale paths alone', () => {
    const hrefs = ['/de/ch/club', 'https://example.com/en/club', '/library/blocks/tabs'];
    assert.deepEqual(linksOn('http://localhost:3000/de/ch/', hrefs), hrefs);
  });

  it('skips links inside [data-no-localize]', () => {
    setupDom('http://localhost:3000/en/gb/');
    const el = document.createElement('div');
    el.innerHTML = '<div data-no-localize><a href="/en/us/">US</a></div>';
    localizeLinks(el);
    assert.equal(el.querySelector('a').getAttribute('href'), '/en/us/');
  });
});
