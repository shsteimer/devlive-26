import { test, expect } from '@playwright/test';
import worker from '../../../../workers/api/index.js';

async function mockApi(page, cf) {
  await page.route('**/api/stores*', async (route) => {
    const request = new Request(route.request().url(), { headers: { origin: 'http://localhost:3000' } });
    Object.defineProperty(request, 'cf', { value: cf });
    const resp = await worker.fetch(request);
    await route.fulfill({
      status: resp.status,
      headers: Object.fromEntries(resp.headers),
      body: await resp.text(),
    });
  });
}

async function open(page) {
  await page.goto('/library/blocks/store-finder');
  await page.waitForSelector('.store-finder.block[data-block-status="loaded"]');
  return page.locator('.store-finder');
}

test('lists stores nearest to the edge location, then all stores', async ({ page }) => {
  await mockApi(page, {
    latitude: '37.33', longitude: '-121.89', city: 'San Jose', country: 'US',
  });
  const block = await open(page);
  const nearest = block.getByRole('list').first();
  await expect(nearest.getByRole('listitem')).toHaveCount(6);
  await expect(nearest.getByRole('heading', { level: 3 }).first()).toContainText('San Jose');
  const all = block.locator('details');
  await all.locator('summary').click();
  await expect(all.getByRole('heading', { level: 3 }).first()).toBeVisible();
});

test('without an edge location, groups all stores by country', async ({ page }) => {
  await mockApi(page, {});
  const block = await open(page);
  await expect(block.locator('details')).toHaveCount(0);
  const countries = block.getByRole('heading', { level: 3 });
  await expect(countries.first()).toBeVisible();
  expect(await countries.count()).toBeGreaterThan(5);
  await expect(block.getByRole('heading', { level: 4 }).first()).toBeVisible();
});

test('API failure leaves the page usable with a message', async ({ page }) => {
  await page.route('**/api/stores*', (route) => route.fulfill({ status: 503 }));
  const block = await open(page);
  await expect(block.getByRole('listitem')).toHaveCount(0);
  await expect(block).toContainText(/.+/);
});
