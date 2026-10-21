import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/library/blocks/tabs');
  await page.waitForSelector('.tabs.block[data-block-status="loaded"]');
});

test('first tab is selected and its panel is the only one exposed', async ({ page }) => {
  const block = page.locator('.tabs');
  const tabs = block.getByRole('tablist').getByRole('tab');
  const firstName = await tabs.first().textContent();

  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await expect(block.getByRole('tabpanel')).toHaveCount(1);
  await expect(block.getByRole('tabpanel')).toHaveAccessibleName(firstName.trim());
});

test('selecting a tab exposes its panel and deselects the others', async ({ page }) => {
  const block = page.locator('.tabs');
  const tabs = block.getByRole('tab');
  const second = tabs.nth(1);
  const secondName = (await second.textContent()).trim();

  await second.click();
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'false');
  await expect(block.getByRole('tabpanel')).toHaveCount(1);
  await expect(block.getByRole('tabpanel')).toHaveAccessibleName(secondName);
});
