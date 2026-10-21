import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../../support/setup-dom.js';

setupDom();
const { getTargetTabIndex } = await import('../../../blocks/tabs/tabs.js');

describe('getTargetTabIndex', () => {
  it('moves right and left', () => {
    assert.equal(getTargetTabIndex('ArrowRight', 0, 3), 1);
    assert.equal(getTargetTabIndex('ArrowLeft', 2, 3), 1);
  });

  it('wraps at both ends', () => {
    assert.equal(getTargetTabIndex('ArrowRight', 2, 3), 0);
    assert.equal(getTargetTabIndex('ArrowLeft', 0, 3), 2);
  });

  it('jumps to first and last with Home and End', () => {
    assert.equal(getTargetTabIndex('Home', 1, 3), 0);
    assert.equal(getTargetTabIndex('End', 1, 3), 2);
  });

  it('ignores other keys', () => {
    assert.equal(getTargetTabIndex('Enter', 1, 3), null);
    assert.equal(getTargetTabIndex('ArrowDown', 1, 3), null);
  });
});
