import { test, expect } from '@playwright/test';

async function load(page) {
  await page.goto('/library/blocks/header');
  await page.waitForSelector('header .header.block[data-block-status="loaded"]', { state: 'attached' });
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('main navigation is a named landmark', async ({ page }) => {
    await load(page);
    await expect(page.locator('header').getByRole('navigation').first()).toHaveAccessibleName(/.+/);
  });

  test('section menus expand on click and collapse on Escape with focus restored', async ({ page }) => {
    await load(page);
    const name = await page.locator('header nav').getByRole('button', { expanded: false }).first().textContent();
    const menu = page.locator('header nav').getByRole('button', { name, exact: true });
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeFocused();
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('menu button toggles the navigation and updates its name', async ({ page }) => {
    await load(page);
    const toggle = page.locator('header button[aria-controls="nav"]');
    const nav = page.locator('header').getByRole('navigation').first();
    const openName = await toggle.getAttribute('aria-label');

    await expect(nav).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(nav).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).not.toHaveAccessibleName(openName);
    await page.keyboard.press('Escape');
    await expect(nav).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });
});
