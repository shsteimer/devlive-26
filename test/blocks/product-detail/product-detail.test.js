import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../../support/setup-dom.js';

setupDom();
const { readFields, splitList, addSchema } = await import('../../../blocks/product-detail/product-detail.js');

function makeBlock(rows) {
  const block = document.createElement('div');
  block.innerHTML = rows.map(([k, v]) => `<div><div>${k}</div><div>${v}</div></div>`).join('');
  return block;
}

describe('splitList', () => {
  it('splits, trims and drops empty values', () => {
    const cell = document.createElement('div');
    cell.textContent = ' 40, 41 ,,42 ';
    assert.deepEqual(splitList(cell), ['40', '41', '42']);
  });

  it('returns an empty list for a missing cell', () => {
    assert.deepEqual(splitList(undefined), []);
  });
});

describe('readFields', () => {
  it('maps rows to fields by position, using the last cell', () => {
    const fields = readFields(makeBlock([['Images', ''], ['Name', 'Summit Shell'], ['Category', 'Outdoor']]));
    assert.equal(fields.name.textContent, 'Summit Shell');
    assert.equal(fields.category.textContent, 'Outdoor');
    assert.equal(fields.price, undefined);
  });
});

describe('addSchema', () => {
  beforeEach(() => { document.head.innerHTML = ''; });

  const schema = () => JSON.parse(document.head.querySelector('script[type="application/ld+json"]').textContent);

  it('adds Product JSON-LD from the authored fields', () => {
    const fields = readFields(makeBlock([
      ['Images', ''], ['Name', ' Summit Shell '], ['Category', 'Outdoor'], ['Price', '€249'], ['Description', 'Waterproof shell.'],
    ]));
    const img = document.createElement('img');
    img.src = 'https://example.com/shell.jpg';
    addSchema(fields, img);

    assert.deepEqual(schema(), {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Summit Shell',
      description: 'Waterproof shell.',
      image: 'https://example.com/shell.jpg',
      category: 'Outdoor',
      brand: { '@type': 'Brand', name: 'Veloxa' },
    });
  });

  it('uses og:site_name as the brand', () => {
    document.head.innerHTML = '<meta property="og:site_name" content="Trailcraft">';
    addSchema(readFields(makeBlock([['Images', ''], ['Name', 'Basecamp 2']])), null);
    assert.equal(schema().brand.name, 'Trailcraft');
  });
});
