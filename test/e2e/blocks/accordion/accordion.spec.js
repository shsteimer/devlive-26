import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/library/blocks/accordion');
  await page.waitForSelector('.accordion.block[data-block-status="loaded"]');
});

test('items start collapsed and toggle from the keyboard', async ({ page }) => {
  const item = page.locator('.accordion details').first();
  const label = item.locator('summary');
  const body = item.locator(':scope > :not(summary)');

  await expect(body).toBeHidden();
  await label.focus();
  await expect(label).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(body).toBeVisible();
  await page.keyboard.press('Space');
  await expect(body).toBeHidden();
});

test('every item label is reachable with Tab', async ({ page }) => {
  const labels = page.locator('.accordion summary');
  const count = await labels.count();
  await labels.first().focus();
  for (let i = 1; i < count; i += 1) {
    await page.keyboard.press('Tab');
    await expect(labels.nth(i)).toBeFocused();
  }
});
