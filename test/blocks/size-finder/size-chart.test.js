import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseChart, findSize } from '../../../blocks/size-finder/size-chart.js';

const rows = [
  { EU: '41', US: '8', UK: '7', 'Foot length (cm)': '26.0' },
  { EU: '40', US: '7', UK: '6.5', 'Foot length (cm)': '25.3' },
  { EU: '42', US: '8.5', UK: '8', 'Foot length (cm)': '26,6' },
  { EU: '', US: '', UK: '', 'Foot length (cm)': '' },
];

describe('parseChart', () => {
  it('sorts by foot length, accepts decimal commas and drops empty rows', () => {
    assert.deepEqual(parseChart(rows), [
      { eu: '40', us: '7', uk: '6.5', maxLength: 25.3 },
      { eu: '41', us: '8', uk: '7', maxLength: 26 },
      { eu: '42', us: '8.5', uk: '8', maxLength: 26.6 },
    ]);
  });

  it('handles a missing sheet', () => {
    assert.deepEqual(parseChart(undefined), []);
  });
});

describe('findSize', () => {
  const chart = parseChart(rows);

  it('picks the smallest size that fits the foot', () => {
    assert.equal(findSize(chart, 25.3, 'regular').eu, '40');
    assert.equal(findSize(chart, 25.4, 'regular').eu, '41');
  });

  it('sizes down for a snug fit and up for a roomy fit', () => {
    assert.equal(findSize(chart, 25.5, 'snug').eu, '40');
    assert.equal(findSize(chart, 25.0, 'roomy').eu, '41');
  });

  it('returns null outside the chart or without a valid length', () => {
    assert.equal(findSize(chart, 27, 'regular'), null);
    assert.equal(findSize(chart, Number.NaN, 'regular'), null);
    assert.equal(findSize(chart, 0, 'regular'), null);
  });
});
