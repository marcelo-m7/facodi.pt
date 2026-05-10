import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.USER_EMAIL ?? '';
const TEST_PASSWORD = process.env.USER_PASSWORD ?? '';
const HAS_TEST_CREDENTIALS = Boolean(TEST_EMAIL && TEST_PASSWORD);

async function signIn(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar' }).first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.locator('input[type="email"]').fill(TEST_EMAIL);
  await dialog.locator('input[type="password"]').fill(TEST_PASSWORD);
  await dialog.locator('button[type="submit"]').click();

  await expect(dialog).not.toBeVisible({ timeout: 10_000 });
}

test.describe('Curator Flow - Route Access', () => {
  test('unauthenticated user cannot access private curator routes directly', async ({ page }) => {
    await page.goto('/curator/channel-pipeline');

    const authModal = page.getByRole('dialog');
    const loginButton = page.getByRole('button', { name: 'Entrar' }).first();
    const isHomeRedirect = page.url().endsWith('/');

    const hasAuthPrompt =
      (await authModal.isVisible().catch(() => false)) ||
      (await loginButton.isVisible().catch(() => false));

    expect(hasAuthPrompt || isHomeRedirect).toBeTruthy();
  });

  test.skip(!HAS_TEST_CREDENTIALS, 'Set USER_EMAIL and USER_PASSWORD to run login-dependent tests.');

  test('authenticated user can access channel pipeline and submissions routes', async ({ page }) => {
    await signIn(page);

    await page.goto('/curator/channel-pipeline');
    await expect(page).toHaveURL(/\/curator\/channel-pipeline$/);
    await expect(page.getByRole('textbox', { name: /canal/i })).toBeVisible({ timeout: 10_000 });

    await page.goto('/curator/submissions');
    await expect(page).toHaveURL(/\/curator\/submissions$/);
    await expect(page.locator('body')).toContainText(/submiss|curador|conte. do/i);
  });

  test('authenticated editor/admin can access curator submit route', async ({ page }) => {
    await signIn(page);

    await page.goto('/curator/submit');
    await expect(page).toHaveURL(/\/curator\/submit$/);
    await expect(page.locator('form')).toBeVisible({ timeout: 10_000 });
  });

  test('non-admin authenticated user is denied admin review route', async ({ page }) => {
    await signIn(page);

    await page.goto('/curator/admin-review');

    const stayedOnAdmin = /\/curator\/admin-review$/.test(page.url());
    const isRedirectedHome = page.url().endsWith('/');
    const deniedText = page.locator('body').getByText(/acesso negado|sem permiss|permission denied/i);
    const hasDeniedMessage = await deniedText.isVisible().catch(() => false);

    // Current route guard behavior may either redirect or render denied state.
    expect((!stayedOnAdmin && isRedirectedHome) || hasDeniedMessage).toBeTruthy();
  });
});
