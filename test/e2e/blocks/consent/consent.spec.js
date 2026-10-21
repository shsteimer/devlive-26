import { test, expect } from '@playwright/test';

const banner = (page) => page.getByRole('complementary').filter({ has: page.locator('.consent') });

test.beforeEach(async ({ page }) => {
  await page.goto('/en/');
});

test('banner is a labelled landmark with two named choices', async ({ page }) => {
  await expect(banner(page)).toHaveAccessibleName(/.+/);
  const buttons = banner(page).getByRole('button');
  await expect(buttons).toHaveCount(2);
  for (const button of await buttons.all()) {
    await expect(button).toHaveAccessibleName(/.+/);
  }
});

test('a choice is remembered across pages', async ({ page }) => {
  await banner(page).getByRole('button').last().click();
  await expect(banner(page)).toHaveCount(0);
  await page.goto('/en/help');
  await page.waitForSelector('footer .footer.block[data-block-status="loaded"]', { state: 'attached' });
  await expect(banner(page)).toHaveCount(0);
});

test('footer link reopens the banner and moves focus into it', async ({ page }) => {
  await banner(page).getByRole('button').last().click();
  await page.locator('footer a[href$="/consent"]').click();
  await expect(banner(page).getByRole('button').first()).toBeVisible();
  await expect(banner(page).getByRole('button').first()).toBeFocused();
});
