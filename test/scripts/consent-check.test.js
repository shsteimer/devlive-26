import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../support/setup-dom.js';

setupDom();
document.cookie = 'consent=declined';
const { getConsent } = await import('../../scripts/consent-check.js');

describe('getConsent', () => {
  it('reads the consent cookie', () => {
    assert.equal(getConsent('', 'a=1; consent=accepted; b=2'), 'accepted');
    assert.equal(getConsent('', 'consent=declined'), 'declined');
  });

  it('returns null when no choice was made', () => {
    assert.equal(getConsent('', ''), null);
    assert.equal(getConsent('', 'myconsent=accepted'), null);
    assert.equal(getConsent('', 'consent=maybe'), null);
  });

  it('lets the URL parameter override the cookie', () => {
    assert.equal(getConsent('?consent=accept', 'consent=declined'), 'accepted');
    assert.equal(getConsent('?consent=decline', 'consent=accepted'), 'declined');
    assert.equal(getConsent('?consent=nonsense', 'consent=accepted'), 'declined');
  });
});
