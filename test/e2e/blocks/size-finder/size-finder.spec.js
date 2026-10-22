import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/library/blocks/size-finder');
  await page.waitForSelector('.size-finder.block[data-block-status="loaded"]');
});

test('inputs are labelled and the fit choice is a named group', async ({ page }) => {
  const block = page.locator('.size-finder');
  const length = block.getByRole('spinbutton');
  await expect(length).toHaveAccessibleName(/.+/);
  await expect(length).toHaveAccessibleDescription(/.+/);
  await expect(block.getByRole('group')).toHaveAccessibleName(/.+/);
  await expect(block.getByRole('radio')).toHaveCount(3);
});

test('entering a foot length announces a size in the live region', async ({ page }) => {
  const block = page.locator('.size-finder');
  const result = block.getByRole('status');
  await expect(result).toHaveAttribute('aria-live', 'polite');
  await expect(result.getByRole('definition')).toHaveCount(0);

  await block.getByRole('spinbutton').fill('26.2');
  await expect(result.getByRole('definition')).toHaveCount(3);

  const regular = await result.innerText();
  await block.getByRole('radio').last().check();
  await expect(result).not.toHaveText(regular);
});
