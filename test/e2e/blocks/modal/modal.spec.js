import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/library/blocks/modal');
  await page.waitForSelector('main .section[data-section-status="loaded"]');
});

test('modal link opens a dialog with a named close button', async ({ page }) => {
  await page.locator('main a[href*="/modals/"]').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button')).toHaveAccessibleName(/.+/);
});

test('Escape closes the dialog and returns focus to the link', async ({ page }) => {
  const link = page.locator('main a[href*="/modals/"]');
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(link).toBeFocused();
});
