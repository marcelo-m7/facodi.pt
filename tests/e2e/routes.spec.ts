import { test, expect } from '@playwright/test';

test('home loads and shows mission statement', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Ensino superior acessível, aberto e comunitário')).toBeVisible();
});

test('courses page lists all degrees', async ({ page }) => {
  await page.goto('/courses');
  const cards = page.locator('[data-testid="course-card"]');
  // Wait for either course cards or the empty state message to appear
  await expect(
    cards.first().or(page.getByText('Nenhum curso disponível neste momento.'))
  ).toBeVisible({ timeout: 10000 });
  const count = await cards.count();
  if (count === 0) {
    await expect(page.getByText('Nenhum curso disponível neste momento.')).toBeVisible();
    return;
  }
  await expect(cards.first()).toBeVisible();
});

test('navigation to courses works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: 'Cursos' }).click();
  await expect(page).toHaveURL('/courses');
});

test('dark mode toggle updates theme', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Alternar tema' });
  await toggle.click();
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('lesson detail renders a video block state', async ({ page }) => {
  await page.goto('/courses/units');

  const cards = page.getByTestId('unit-card');
  const count = await cards.count();
  if (count === 0) {
    await expect(page.getByText('Nenhum resultado nos nós de dados.')).toBeVisible();
    return;
  }

  await cards.first().click();
  await expect(page).toHaveURL(/\/lessons\//);

  const player = page.getByTestId('lesson-video-player');
  const fallback = page.getByTestId('lesson-video-link-fallback');
  const placeholder = page.getByTestId('lesson-video-placeholder');

  const visibleCount =
    (await player.count()) +
    (await fallback.count()) +
    (await placeholder.count());

  expect(visibleCount).toBeGreaterThan(0);
});
