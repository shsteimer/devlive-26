import { test, expect } from '@playwright/test';

const TAG_HOSTS = /googletagmanager\.com|clarity\.ms|tawk\.to/;

async function trackTags(page) {
  const requests = [];
  await page.route(TAG_HOSTS, (route) => {
    requests.push(route.request().url());
    route.abort();
  });
  return requests;
}

test('no tags load before consent @analytics', async ({ page }) => {
  const requests = await trackTags(page);
  await page.goto('/en/');
  await expect(page.locator('aside .consent')).toBeVisible();
  await page.waitForTimeout(1000);
  expect(requests).toEqual([]);
});

test('tags load after accepting @analytics', async ({ page }) => {
  const requests = await trackTags(page);
  await page.goto('/en/');
  await page.locator('aside .consent').getByRole('button').first().click();
  await expect.poll(() => requests.length).toBeGreaterThan(0);
});

test('declining loads no tags @analytics', async ({ page }) => {
  const requests = await trackTags(page);
  await page.goto('/en/');
  await page.locator('aside .consent').getByRole('button').last().click();
  await page.waitForTimeout(1000);
  expect(requests).toEqual([]);
});
