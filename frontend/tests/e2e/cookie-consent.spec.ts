import { expect, test } from '@playwright/test';

test.describe('Cookie consent', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('shows banner on first access and allows reject non-essential', async ({ page }) => {
    await page.goto('/');

    const bannerTitle = page.getByRole('heading', { name: /privacy|privacidade/i });
    await expect(bannerTitle).toBeVisible();

    await page.getByRole('button', { name: /rejeitar|reject/i }).first().click();
    await expect(bannerTitle).not.toBeVisible();
  });

  test('opens preferences modal from banner', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /personalizar|customize/i }).click();

    await expect(page.getByRole('dialog', { name: /preferencias|preferences/i })).toBeVisible();

    await page.getByRole('button', { name: /guardar|save preferences/i }).click();
    await expect(page.getByRole('dialog', { name: /preferencias|preferences/i })).not.toBeVisible();
  });
});
