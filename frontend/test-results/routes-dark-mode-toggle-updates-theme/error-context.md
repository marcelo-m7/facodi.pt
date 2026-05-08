# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: routes.spec.ts >> dark mode toggle updates theme
- Location: tests/e2e/routes.spec.ts:29:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Alternar tema' })

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('home loads and shows mission statement', async ({ page }) => {
  4  |   await page.goto('/');
  5  |   await expect(page.getByText('Ensino superior acessível, aberto e comunitário')).toBeVisible();
  6  | });
  7  | 
  8  | test('courses page lists all degrees', async ({ page }) => {
  9  |   await page.goto('/courses');
  10 |   const cards = page.locator('[data-testid="course-card"]');
  11 |   // Wait for either course cards or the empty state message to appear
  12 |   await expect(
  13 |     cards.first().or(page.getByText('Sem cursos sincronizados do Odoo neste momento.'))
  14 |   ).toBeVisible({ timeout: 10000 });
  15 |   const count = await cards.count();
  16 |   if (count === 0) {
  17 |     await expect(page.getByText('Sem cursos sincronizados do Odoo neste momento.')).toBeVisible();
  18 |     return;
  19 |   }
  20 |   await expect(cards.first()).toBeVisible();
  21 | });
  22 | 
  23 | test('navigation to courses works', async ({ page }) => {
  24 |   await page.goto('/');
  25 |   await page.getByRole('navigation').getByRole('button', { name: 'Cursos' }).click();
  26 |   await expect(page).toHaveURL('/courses');
  27 | });
  28 | 
  29 | test('dark mode toggle updates theme', async ({ page }) => {
  30 |   await page.goto('/');
  31 |   const toggle = page.getByRole('button', { name: 'Alternar tema' });
> 32 |   await toggle.click();
     |                ^ Error: locator.click: Test timeout of 60000ms exceeded.
  33 |   await expect(page.locator('html')).toHaveClass(/dark/);
  34 | });
  35 | 
  36 | test('lesson detail renders a video block state', async ({ page }) => {
  37 |   await page.goto('/courses/units');
  38 | 
  39 |   const cards = page.getByTestId('unit-card');
  40 |   const count = await cards.count();
  41 |   if (count === 0) {
  42 |     await expect(page.getByText('Nenhum resultado nos nós de dados.')).toBeVisible();
  43 |     return;
  44 |   }
  45 | 
  46 |   await cards.first().click();
  47 |   await expect(page).toHaveURL(/\/lessons\//);
  48 | 
  49 |   const player = page.getByTestId('lesson-video-player');
  50 |   const fallback = page.getByTestId('lesson-video-link-fallback');
  51 |   const placeholder = page.getByTestId('lesson-video-placeholder');
  52 | 
  53 |   const visibleCount =
  54 |     (await player.count()) +
  55 |     (await fallback.count()) +
  56 |     (await placeholder.count());
  57 | 
  58 |   expect(visibleCount).toBeGreaterThan(0);
  59 | });
  60 | 
```