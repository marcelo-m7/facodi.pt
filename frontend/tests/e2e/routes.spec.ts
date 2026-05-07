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
    cards.first().or(page.getByText('Sem cursos sincronizados do Odoo neste momento.'))
  ).toBeVisible({ timeout: 10000 });
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

test('navigation to videos works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: /Vídeos|Videos/ }).click();
  await expect(page).toHaveURL('/videos');
});

test('videos page renders list or state feedback', async ({ page }) => {
  await page.goto('/videos');
  const cards = page.getByTestId('video-card');
  const loadingState = page.getByTestId('video-state-loading');
  const emptyState = page.getByTestId('video-state-empty');
  const errorState = page.getByTestId('video-state-error');

  await expect(cards.first().or(loadingState).or(emptyState).or(errorState)).toBeVisible({ timeout: 12000 });
});

test('video detail opens and renders player', async ({ page }) => {
  await page.goto('/videos');

  const cards = page.getByTestId('video-card');
  const emptyState = page.getByTestId('video-state-empty');
  const errorState = page.getByTestId('video-state-error');

  await expect(cards.first().or(emptyState).or(errorState)).toBeVisible({ timeout: 12000 });

  if (await cards.count() === 0) {
    await expect(emptyState.or(errorState)).toBeVisible();
    return;
  }

  await cards.first().click();
  await expect(page).toHaveURL(/\/videos\//);
  await expect(page.getByTestId('video-player').or(page.getByTestId('video-player-placeholder'))).toBeVisible();
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
