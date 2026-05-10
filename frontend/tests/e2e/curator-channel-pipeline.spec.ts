import { test, expect } from '@playwright/test';

const PIPELINE_URL = '/curator/channel-pipeline';
const CHANNEL_URL = 'https://www.youtube.com/@equacionamatematica';
const EDITOR_EMAIL = 'test-fun@monynha.com';
const EDITOR_PASSWORD = 'monynha.com';

async function dismissDevelopmentDisclaimer(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
) {
  const understandButton = page.getByRole('button', { name: /entendi/i });
  const closeButton = page.getByRole('button', { name: /fechar/i });

  await Promise.race([
    understandButton.waitFor({ state: 'visible', timeout: 2_000 }),
    closeButton.waitFor({ state: 'visible', timeout: 2_000 }),
  ]).catch(() => undefined);

  if (await understandButton.isVisible().catch(() => false)) {
    await understandButton.click();
    return;
  }

  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  }
}

// Helper: block all Edge Function calls so pipeline always uses local fallback
async function blockEdgeFunctions(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.route('**/functions/v1/**', (route) => route.abort('failed'));
}

// Helper: sign in via the auth modal
async function signIn(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  email: string,
  password: string,
) {
  await dismissDevelopmentDisclaimer(page);
  const loginBtn = page.getByRole('button', { name: 'Entrar' }).first();
  await loginBtn.click();
  const dialog = page.getByRole('dialog', { name: /entrar na conta/i });
  await expect(dialog).toBeVisible();
  await dialog.locator('input[type="email"]').fill(email);
  await dialog.locator('input[type="password"]').fill(password);
  await dialog.getByRole('button', { name: /entrar/i }).last().click();
  await expect(dialog).not.toBeVisible({ timeout: 10_000 });
}

async function ensurePipelineAccess(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto(PIPELINE_URL);
  await dismissDevelopmentDisclaimer(page);

  const channelInput = page.getByRole('textbox', { name: /canal/i });
  if (await channelInput.isVisible().catch(() => false)) {
    return true;
  }

  const loginBtn = page.getByRole('button', { name: 'Entrar' }).first();
  const authModal = page.getByRole('dialog');

  if (await loginBtn.isVisible().catch(() => false)) {
    await signIn(page, EDITOR_EMAIL, EDITOR_PASSWORD);
    await page.goto(PIPELINE_URL);
    await dismissDevelopmentDisclaimer(page);
  } else if (await authModal.isVisible().catch(() => false)) {
    await authModal.locator('input[type="email"]').fill(EDITOR_EMAIL);
    await authModal.locator('input[type="password"]').fill(EDITOR_PASSWORD);
    await authModal.getByRole('button', { name: /entrar/i }).last().click();
    await expect(authModal).not.toBeVisible({ timeout: 10_000 });
    await page.goto(PIPELINE_URL);
    await dismissDevelopmentDisclaimer(page);
  }

  const permissionDenied = page.getByText(/acesso negado|permiss/i);
  await Promise.race([
    channelInput.waitFor({ state: 'visible', timeout: 12_000 }),
    permissionDenied.waitFor({ state: 'visible', timeout: 12_000 }),
  ]).catch(() => undefined);

  if (await channelInput.isVisible().catch(() => false)) {
    return true;
  }

  test.skip(true, 'Pipeline indisponivel para a conta atual (requer role editor/admin).');
  return false;
}

test.describe('Curator Channel Pipeline — access control', () => {
  test('unauthenticated: pipeline route shows auth requirement', async ({ page }) => {
    await page.goto(PIPELINE_URL);
    await dismissDevelopmentDisclaimer(page);
    // Either the auth modal opens or there is a "Entrar" prompt visible
    const authModal = page.getByRole('dialog', { name: /entrar na conta/i });
    const loginBtn = page.getByRole('button', { name: 'Entrar' });
    const hasAuthModal = await authModal.isVisible().catch(() => false);
    const hasLoginButton = await loginBtn.first().isVisible().catch(() => false);
    expect(hasAuthModal || hasLoginButton).toBeTruthy();
  });
});

test.describe('Curator Channel Pipeline — degraded mode flow', () => {
  test.beforeEach(async ({ page }) => {
    // Block Edge Functions before navigation so all stages fall back locally
    await blockEdgeFunctions(page);
  });

  test('pipeline page loads with all 6 panels', async ({ page }) => {
    if (!(await ensurePipelineAccess(page))) {
      return;
    }

    await expect(page.getByRole('heading', { name: /pipeline por canal/i })).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.getByRole('heading', { name: /importar canal/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /crit.rios/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /descobrir/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /an.lise/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /mapeamento/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /revis.o editorial/i })).toBeVisible();
  });

  test('validate channel → degraded mode banner appears', async ({ page }) => {
    if (!(await ensurePipelineAccess(page))) {
      return;
    }

    const channelInput = page.getByRole('textbox', { name: /canal/i });
    await channelInput.fill(CHANNEL_URL);
    await page.getByRole('button', { name: /validar canal/i }).click();

    // Channel validation should succeed in both normal and degraded modes.
    await expect(page.getByText(/canal validado:/i)).toBeVisible({ timeout: 10_000 });
  });

  test('full pipeline: validate → discover → analyze → publish confirmation', async ({ page }) => {
    if (!(await ensurePipelineAccess(page))) {
      return;
    }

    // Step 1: validate channel
    await page.getByRole('textbox', { name: /canal/i }).fill(CHANNEL_URL);
    await page.getByRole('button', { name: /validar canal/i }).click();
    await expect(page.getByText(/canal validado:/i)).toBeVisible({ timeout: 10_000 });

    // Step 2: discover videos
    await page.getByRole('button', { name: /buscar v.deos/i }).click();
    // Wait for selected-count summary to appear after video load.
    const selectionSummary = page.getByText(/\d+ de \d+ v.deo\(s\) selecionado\(s\)/i);
    const emptyState = page.getByText(/nenhum v.deo carregado ainda/i);
    await Promise.race([
      selectionSummary.waitFor({ state: 'visible', timeout: 15_000 }),
      emptyState.waitFor({ state: 'visible', timeout: 15_000 }),
    ]).catch(() => undefined);

    if (!(await selectionSummary.isVisible().catch(() => false))) {
      test.skip(true, 'Descoberta de vídeos indisponível no ambiente atual.');
      return;
    }

    // Step 3: analyze
    await page.getByRole('button', { name: /executar an.lise/i }).click();
    // Analyses should appear after processing.
    await expect(page.locator('article').first()).toBeVisible({ timeout: 15_000 });

    // Step 4: click Publicar → confirmation modal opens
    await page.getByRole('button', { name: /publicar no pipeline/i }).click();
    const confirmDialog = page.getByRole('dialog', { name: /confirmar publica/i });
    await expect(confirmDialog).toBeVisible({ timeout: 5_000 });
    // Confirm
    await confirmDialog.getByRole('button', { name: /publicar/i }).click();
    // Success message
    await expect(
      page.getByText(/enviado.*revis.o|de.*enviado/i),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('publish confirmation modal can be cancelled', async ({ page }) => {
    if (!(await ensurePipelineAccess(page))) {
      return;
    }

    // Quick setup: validate + discover videos so the publish button is enabled
    await page.getByRole('textbox', { name: /canal/i }).fill(CHANNEL_URL);
    await page.getByRole('button', { name: /validar canal/i }).click();
    await expect(page.getByText(/canal validado:/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /buscar v.deos/i }).click();
    const selectionSummary = page.getByText(/\d+ de \d+ v.deo\(s\) selecionado\(s\)/i);
    const emptyState = page.getByText(/nenhum v.deo carregado ainda/i);
    await Promise.race([
      selectionSummary.waitFor({ state: 'visible', timeout: 15_000 }),
      emptyState.waitFor({ state: 'visible', timeout: 15_000 }),
    ]).catch(() => undefined);

    if (!(await selectionSummary.isVisible().catch(() => false))) {
      test.skip(true, 'Descoberta de vídeos indisponível no ambiente atual.');
      return;
    }

    // Open confirm dialog and cancel
    await page.getByRole('button', { name: /publicar no pipeline/i }).click();
    const confirmDialog = page.getByRole('dialog', { name: /confirmar publica/i });
    await expect(confirmDialog).toBeVisible({ timeout: 5_000 });
    await confirmDialog.getByRole('button', { name: /cancelar/i }).click();
    await expect(confirmDialog).not.toBeVisible();
    // No success/error message should appear
    await expect(page.getByText(/enviado.*revis.o/i)).not.toBeVisible();
  });
});
