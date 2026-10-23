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

test('only the selected tab is in the tab order', async ({ page }) => {
  const tabs = page.locator('.tabs').getByRole('tab');
  const body = page.locator('main h1');

  await body.click();
  await page.keyboard.press('Tab');
  await expect(tabs.first()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(tabs.nth(1)).not.toBeFocused();
});

test('arrow, Home and End keys move focus and selection', async ({ page }) => {
  const block = page.locator('.tabs');
  const tabs = block.getByRole('tab');
  const count = await tabs.count();

  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('End');
  await expect(tabs.nth(count - 1)).toBeFocused();
  await expect(tabs.nth(count - 1)).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowRight');
  await expect(tabs.first()).toBeFocused();
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(count - 1)).toBeFocused();

  await page.keyboard.press('Home');
  await expect(tabs.first()).toBeFocused();
  await expect(block.getByRole('tabpanel')).toHaveCount(1);
});
