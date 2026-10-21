import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../../support/setup-dom.js';

setupDom();
const { filterData, highlightTextElements } = await import('../../../blocks/search/search.js');

const index = [
  { path: '/en/products/summit-shell', title: 'Summit Shell', description: 'Waterproof shell for alpine days' },
  { path: '/en/stories/trail-running', title: 'Trail running basics', description: 'Start running off-road' },
  { path: '/en/products/aerostride-3', title: 'Aerostride 3', description: 'Daily running shoe' },
];
const paths = (results) => results.map((r) => r.path);

describe('filterData', () => {
  it('ranks title matches above description matches', () => {
    assert.deepEqual(paths(filterData(['running'], index)), [
      '/en/stories/trail-running',
      '/en/products/aerostride-3',
    ]);
  });

  it('ranks earlier title matches first', () => {
    const data = [
      { path: '/b', title: 'Best trail shoe' },
      { path: '/a', title: 'Trail shoe' },
    ];
    assert.deepEqual(paths(filterData(['trail'], data)), ['/a', '/b']);
  });

  it('matches the last path segment', () => {
    assert.deepEqual(paths(filterData(['aerostride-3'], index)), ['/en/products/aerostride-3']);
  });

  it('returns nothing when no term matches', () => {
    assert.deepEqual(filterData(['tent'], index), []);
  });
});

describe('highlightTextElements', () => {
  it('wraps every match in <mark>, keeping the original casing', () => {
    const p = document.createElement('p');
    p.textContent = 'Trail shoes for the trail';
    highlightTextElements(['trail'], [p]);
    assert.deepEqual([...p.querySelectorAll('mark')].map((m) => m.textContent), ['Trail', 'trail']);
    assert.equal(p.textContent, 'Trail shoes for the trail');
  });

  it('escapes markup in the source text', () => {
    const p = document.createElement('p');
    p.textContent = '<img src=x onerror=alert(1)> trail';
    highlightTextElements(['trail'], [p]);
    assert.equal(p.querySelector('img'), null);
    assert.equal(p.querySelector('mark').textContent, 'trail');
  });

  it('leaves elements without a match untouched', () => {
    const p = document.createElement('p');
    p.innerHTML = '<span>Road shoe</span>';
    highlightTextElements(['trail'], [p]);
    assert.equal(p.innerHTML, '<span>Road shoe</span>');
  });
});
