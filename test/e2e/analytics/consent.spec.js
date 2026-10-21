import { test, expect } from '@playwright/test';

const consentCommands = (page) => page.evaluate(() => (window.dataLayer || [])
  .filter((entry) => entry[0] === 'consent')
  .map((entry) => [entry[1], entry[2].analytics_storage]));

async function loadWithGtm(page, path = '/en/') {
  const gtm = page.waitForRequest(/googletagmanager\.com\/gtm\.js/);
  await page.goto(path);
  await gtm;
}

test('GTM loads in consent mode with tracking denied before a choice @analytics', async ({ page }) => {
  await loadWithGtm(page);
  await expect(page.locator('aside .consent')).toBeVisible();
  expect(await consentCommands(page)).toEqual([['default', 'denied']]);
});

test('accepting grants consent @analytics', async ({ page }) => {
  await loadWithGtm(page);
  await page.locator('aside .consent').getByRole('button').first().click();
  await expect.poll(() => consentCommands(page)).toEqual([['default', 'denied'], ['update', 'granted']]);
});

test('declining keeps consent denied @analytics', async ({ page }) => {
  await loadWithGtm(page);
  await page.locator('aside .consent').getByRole('button').last().click();
  await page.waitForTimeout(500);
  expect(await consentCommands(page)).toEqual([['default', 'denied']]);
});

test('an earlier accept is applied from the start @analytics', async ({ page }) => {
  await loadWithGtm(page, '/en/?consent=accept');
  await expect.poll(() => consentCommands(page)).toEqual([['default', 'granted'], ['update', 'granted']]);
});
