import { test, expect } from '@playwright/test';

test.describe('Unified Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('dashboard is protected and requests authentication when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText('Entrar');
  });

  test('desktop navigation exposes only unified progress entry', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: 'Meu Progresso' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Meus Cursos' })).toHaveCount(0);
  });

  test('legacy student routes are removed and resolve to not found', async ({ page }) => {
    const legacyRoutes = [
      '/student/dashboard',
      '/student/my-courses',
      '/student/progress',
      '/student/history',
    ];

    for (const route of legacyRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toContainText('Página não encontrada');
    }
  });

  test('dashboard route redirects unauthenticated users to home', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/$/);
    await expect(page).toHaveTitle(/FACODI/);
  });

  test('dashboard page has no critical console errors during unauthenticated render', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    expect(errors).toEqual([]);
  });

  test('mobile view keeps unified navigation entry available', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: 'Meu progresso' })).toBeVisible();
  });
});
