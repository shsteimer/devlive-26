import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../../support/setup-dom.js';

setupDom();
const {
  default: decorate, readFields, splitList, addSchema, parsePrice,
} = await import('../../../blocks/product-detail/product-detail.js');

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

describe('parsePrice', () => {
  it('reads amount and ISO currency from symbols and codes', () => {
    assert.deepEqual(parsePrice('$110'), { price: '110', priceCurrency: 'USD' });
    assert.deepEqual(parsePrice('€249,95'), { price: '249.95', priceCurrency: 'EUR' });
    assert.deepEqual(parsePrice('£1,299.00'), { price: '1299.00', priceCurrency: 'GBP' });
    assert.deepEqual(parsePrice('CHF 1.299,50'), { price: '1299.50', priceCurrency: 'CHF' });
    assert.deepEqual(parsePrice('1 299 kr SEK'), { price: '1299', priceCurrency: 'SEK' });
    assert.deepEqual(parsePrice('NEW $1,299'), { price: '1299', priceCurrency: 'USD' });
  });

  it('returns null without a recognisable amount or currency', () => {
    assert.equal(parsePrice('Coming soon'), null);
    assert.equal(parsePrice('249'), null);
    assert.equal(parsePrice(''), null);
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
      offers: {
        '@type': 'Offer', price: '249', priceCurrency: 'EUR', url: 'http://localhost:3000/',
      },
    });
  });

  it('uses og:site_name as the brand', () => {
    document.head.innerHTML = '<meta property="og:site_name" content="Trailcraft">';
    addSchema(readFields(makeBlock([['Images', ''], ['Name', 'Basecamp 2']])), null);
    assert.equal(schema().brand.name, 'Trailcraft');
  });

  it('omits offers when the price cannot be read', () => {
    addSchema(readFields(makeBlock([['Images', ''], ['Name', 'Basecamp 2'], ['Category', ''], ['Price', 'Coming soon']])), null);
    assert.equal(schema().offers, undefined);
  });
});

describe('decorate', () => {
  it('keeps the description in the JSON-LD after moving it into the page', async () => {
    document.head.innerHTML = '';
    global.fetch = async () => ({ ok: false });
    const block = makeBlock([
      ['Images', ''], ['Name', 'Summit Shell'], ['Category', 'Outdoor'], ['Price', '$249'], ['Description', '<p>Waterproof shell.</p>'],
    ]);
    document.body.replaceChildren(block);
    await decorate(block);
    const schema = JSON.parse(document.head.querySelector('script[type="application/ld+json"]').textContent);
    assert.equal(schema.description, 'Waterproof shell.');
  });
});
