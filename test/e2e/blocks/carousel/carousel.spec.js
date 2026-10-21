import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/library/blocks/carousel');
  await page.waitForSelector('.carousel.block[data-block-status="loaded"]');
});

test('is a labelled carousel region with named controls', async ({ page }) => {
  const block = page.locator('.carousel');
  await expect(block).toHaveRole('region');
  await expect(block).toHaveAttribute('aria-roledescription', /.+/);

  const indicators = page.locator('.carousel').getByRole('navigation');
  await expect(indicators).toHaveAccessibleName(/.+/);
  const buttons = page.locator('.carousel').getByRole('button');
  for (const button of await buttons.all()) {
    await expect(button).toHaveAccessibleName(/.+/);
  }
});

test('next control advances the current slide indicator', async ({ page }) => {
  const block = page.locator('.carousel');
  const indicators = block.getByRole('navigation').getByRole('button');
  const next = block.locator('button:not(nav button)').nth(1);

  await expect(indicators.first()).toHaveAttribute('aria-current', 'true');
  await next.click();
  await expect(indicators.nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(indicators.first()).not.toHaveAttribute('aria-current', 'true');
});
