import { test, expect } from '@playwright/test';
import worker from '../../../../workers/api/index.js';

const cf = {
  latitude: '55.68', longitude: '12.57', city: 'Copenhagen', country: 'DK',
};

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 40.72, longitude: -74.0 });
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
  await page.goto('/library/blocks/store-finder');
  await page.waitForSelector('.store-finder.block[data-block-status="loaded"]');
});

test('lists stores nearest to the edge location, with status', async ({ page }) => {
  const block = page.locator('.store-finder');
  await expect(block.getByRole('status')).toHaveText(/.+/);
  const items = block.getByRole('listitem');
  await expect(items).toHaveCount(8);
  await expect(items.first().getByRole('heading', { level: 3 })).toContainText('Copenhagen');
});

test('use my location re-sorts by browser position', async ({ page }) => {
  const block = page.locator('.store-finder');
  const heading = block.getByRole('status');
  const before = await heading.innerText();
  await block.getByRole('button').click();
  await expect(heading).not.toHaveText(before);
  await expect(block.getByRole('listitem').first().getByRole('heading', { level: 3 })).toContainText('New York');
});

test('API failure leaves the page usable with a message', async ({ page }) => {
  await page.unroute('**/api/stores*');
  await page.route('**/api/stores*', (route) => route.fulfill({ status: 503 }));
  await page.reload();
  const block = page.locator('.store-finder');
  await expect(block.getByRole('status')).toHaveText(/.+/);
  await expect(block.getByRole('listitem')).toHaveCount(0);
});
