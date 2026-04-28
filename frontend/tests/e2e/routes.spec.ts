import { test, expect } from '@playwright/test';

test('home loads and shows mission statement', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Ensino superior acessível, aberto e comunitário')).toBeVisible();
});

test('courses page lists all degrees', async ({ page }) => {
  await page.goto('/courses');
  const cards = page.locator('[data-testid="course-card"]');
  const count = await cards.count();
  if (count === 0) {
    await expect(page.getByText('Sem cursos sincronizados do Odoo neste momento.')).toBeVisible();
    return;
  }
  await expect(cards.first()).toBeVisible();
});

test('navigation to courses works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: 'Cursos' }).click();
  await expect(page).toHaveURL('/courses');
});

test('roadmap page renders', async ({ page }) => {
  await page.goto('/roadmap');
  await expect(page.getByRole('heading', { name: /Roadmap/i })).toBeVisible();
});

test('dark mode toggle updates theme', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Alternar tema' });
  await toggle.click();
  await expect(page.locator('html')).toHaveClass(/dark/);
});
