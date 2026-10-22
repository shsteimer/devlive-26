import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../../support/setup-dom.js';

setupDom();
const { getTargetIndex } = await import('../../../blocks/carousel/carousel.js');

describe('getTargetIndex', () => {
  it('keeps in-range indexes', () => {
    assert.equal(getTargetIndex(1, 3), 1);
  });

  it('wraps past either end', () => {
    assert.equal(getTargetIndex(3, 3), 0);
    assert.equal(getTargetIndex(-1, 3), 2);
  });
});
