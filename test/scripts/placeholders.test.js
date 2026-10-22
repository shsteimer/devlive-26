import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../support/setup-dom.js';

setupDom();
const { fetchPlaceholders } = await import('../../scripts/placeholders.js');

const sheets = {
  '/de/placeholders.json': [{ Key: 'add-to-bag', Text: 'In den Warenkorb' }, { Key: 'select-size', Text: 'Größe wählen' }],
  '/de/ch/placeholders.json': [{ Key: 'add-to-bag', Text: 'In den Warenkorb legen' }],
};

beforeEach(() => {
  window.placeholders = {};
  global.fetch = async (url) => (sheets[url]
    ? { ok: true, json: async () => ({ data: sheets[url] }) }
    : { ok: false });
});

describe('fetchPlaceholders', () => {
  it('lets a region sheet override its language sheet', async () => {
    assert.deepEqual(await fetchPlaceholders('/de/ch'), {
      addToBag: 'In den Warenkorb legen',
      selectSize: 'Größe wählen',
    });
  });

  it('falls back to the language sheet when the region has none', async () => {
    assert.deepEqual(await fetchPlaceholders('/de/de'), {
      addToBag: 'In den Warenkorb',
      selectSize: 'Größe wählen',
    });
  });

  it('reads a language sheet on its own', async () => {
    assert.equal((await fetchPlaceholders('/de')).selectSize, 'Größe wählen');
  });

  it('returns an empty object when nothing is found', async () => {
    assert.deepEqual(await fetchPlaceholders('/fr/ca'), {});
  });
});
