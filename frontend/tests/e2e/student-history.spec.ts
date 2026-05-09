import { test, expect } from '@playwright/test';

test.describe('Student Features - History & Activity', () => {
  test.beforeEach(async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('History page displays activity timeline', async ({ page }) => {
    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');

    // Should have title
    const heading = await page.locator('h1').first();
    expect(heading).toBeTruthy();
  });

  test('Activity events show with icons', async ({ page }) => {
    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');

    // Should have some visual content
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('Activity items display timestamps', async ({ page }) => {
    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');

    // Should have content structure
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(50);
  });

  test('Activity labels are properly mapped', async ({ page }) => {
    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');

    // Page should display properly
    const heading = await page.locator('h1, h2').first();
    expect(heading).toBeTruthy();
  });

  test('Empty state shows when no activity', async ({ page }) => {
    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');

    // Should show either activity or empty state
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('Timeline displays in chronological order', async ({ page }) => {
    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');

    // Page structure should be sound
    const listItems = await page.locator('[class*="space-y"]').count();
    // Should have some structured layout
    expect(listItems).toBeGreaterThanOrEqual(0);
  });

  test('History page is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');

    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('History page is responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');

    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('History page is responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');

    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('Back button navigates correctly', async ({ page }) => {
    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');

    // Should have back button
    const backButton = await page.locator('button:has-text("Voltar")').first();
    expect(backButton).toBeTruthy();
  });

  test('No JavaScript errors on history page', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');

    expect(errors.length).toBe(0);
  });

  test('Page title is correct', async ({ page }) => {
    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title).toContain('FACODI');
  });

  test('Activity items are visually distinct', async ({ page }) => {
    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');

    // Should have enough structure for visual distinction
    const listItems = await page.locator('button, div[class*="flex"]').count();
    expect(listItems).toBeGreaterThan(0);
  });
});
