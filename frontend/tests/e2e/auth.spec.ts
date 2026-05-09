import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test-fun@monynha.com';
const TEST_PASSWORD = 'monynha.com';

test.describe('Auth – Modal', () => {
  test('nav shows "Entrar" button when logged out', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.getByRole('button', { name: 'Entrar' }).first();
    await expect(loginBtn).toBeVisible();
  });

  test('clicking Entrar opens the auth modal', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('input[type="email"]')).toBeVisible();
    await expect(dialog.locator('input[type="password"]')).toBeVisible();
  });

  test('modal closes on Escape key', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('modal closes on overlay click', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // Click top-left corner of overlay (outside the card)
    await page.mouse.click(5, 5);
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('switching to Criar conta tab changes form label', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Criar conta' }).click();
    // Submit button should now say "Criar conta"
    await expect(
      page.getByRole('dialog').getByRole('button', { name: 'Criar conta' }).last()
    ).toBeVisible();
  });

  test('wrong credentials shows error message', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[type="email"]').fill('wrong@example.com');
    await dialog.locator('input[type="password"]').fill('wrongpassword');
    await dialog.locator('button[type="submit"]').click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
    const alertText = await page.getByRole('alert').textContent();
    expect(alertText).toMatch(/incorretos|inválid/i);
  });
});

test.describe('Auth – Sign in flow', () => {
  test('successful login closes modal and shows profile button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[type="email"]').fill(TEST_EMAIL);
    await dialog.locator('input[type="password"]').fill(TEST_PASSWORD);
    await dialog.locator('button[type="submit"]').click();

    // Wait for success message
    await expect(page.getByRole('status')).toContainText('Sessão iniciada', { timeout: 15000 });

    // Modal should close after ~800ms
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Nav should now show "Meu Perfil" button instead of "Entrar"
    await expect(page.getByRole('button', { name: 'Meu Perfil' })).toBeVisible({ timeout: 5000 });
  });

  test('profile page loads after login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[type="email"]').fill(TEST_EMAIL);
    await dialog.locator('input[type="password"]').fill(TEST_PASSWORD);
    await dialog.locator('button[type="submit"]').click();

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Navigate to profile
    await page.getByRole('button', { name: 'Meu Perfil' }).click();
    await expect(page).toHaveURL('/profile');
    // Profile page has a save button
    await expect(page.getByRole('button', { name: /Guardar/i })).toBeVisible({ timeout: 5000 });
  });

  test('sign out from profile page returns to home and shows Entrar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[type="email"]').fill(TEST_EMAIL);
    await dialog.locator('input[type="password"]').fill(TEST_PASSWORD);
    await dialog.locator('button[type="submit"]').click();

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Meu Perfil' }).click();
    await expect(page).toHaveURL('/profile');

    // Click sign-out button on profile page
    const signOutBtn = page.getByRole('button', { name: /Sair|Sign out|logout/i });
    await expect(signOutBtn).toBeVisible({ timeout: 5000 });
    await signOutBtn.click();

    // Should return to home and show Entrar again
    await expect(page.getByRole('button', { name: 'Entrar' }).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Auth – Profile page', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test in this group
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[type="email"]').fill(TEST_EMAIL);
    await dialog.locator('input[type="password"]').fill(TEST_PASSWORD);
    await dialog.locator('button[type="submit"]').click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: 'Meu Perfil' }).click();
    await expect(page).toHaveURL('/profile');
  });

  test('profile page shows edit form fields', async ({ page }) => {
    await expect(page.locator('input[name="displayName"], input[id="displayName"], input[placeholder*="nome" i], input[type="text"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('profile page shows unit favorites section', async ({ page }) => {
    // Section with favorites heading should be present
    await expect(page.getByText(/favorit/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('navigating to /profile without auth shows session-not-found message', async ({ page: unauthPage }) => {
    // Fresh page without login — app renders the profile page but shows gated content
    await unauthPage.goto('/profile');
    await expect(unauthPage.getByText(/Sessão não encontrada/i)).toBeVisible({ timeout: 5000 });
  });
});
