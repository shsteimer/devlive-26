import { test, expect } from '@playwright/test';

async function pressUntilCurrent(page, key, dot) {
  await expect(async () => {
    if (await dot.getAttribute('aria-current') !== 'true') await page.keyboard.press(key);
    await expect(dot).toHaveAttribute('aria-current', 'true', { timeout: 1000 });
  }).toPass({ timeout: 10000 });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/library/blocks/carousel-swiper');
  await page.waitForSelector('.carousel-swiper.block[data-block-status="loaded"]');
});

test('controls are named buttons', async ({ page }) => {
  const buttons = page.locator('.carousel-swiper').getByRole('button');
  await expect(buttons.first()).toBeVisible();
  for (const button of await buttons.all()) {
    await expect(button).toHaveAccessibleName(/.+/);
  }
});

test('keyboard arrows move the current slide and wrap around', async ({ page }) => {
  const block = page.locator('.carousel-swiper');
  const dots = block.locator('[role="button"]');

  await expect(dots.first()).toHaveAttribute('aria-current', 'true');
  await block.getByRole('button').first().focus();
  await pressUntilCurrent(page, 'ArrowRight', dots.nth(1));
  await pressUntilCurrent(page, 'ArrowLeft', dots.first());
  await pressUntilCurrent(page, 'ArrowLeft', dots.last());
});
