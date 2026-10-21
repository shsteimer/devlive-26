import { test, expect } from '@playwright/test';

const pages = ['/en/', '/en/run', '/en/help', '/de/de/'];

for (const path of pages) {
  test(`${path} renders with landmarks, one h1 and alt on every image @regression`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(path);
    await page.waitForSelector('footer .footer.block[data-block-status="loaded"]', { state: 'attached' });

    await expect(page.getByRole('banner')).toBeAttached();
    await expect(page.getByRole('main')).toBeAttached();
    await expect(page.getByRole('contentinfo')).toBeAttached();
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main img:not([alt])')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
