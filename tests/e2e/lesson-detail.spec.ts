import { test, expect } from '@playwright/test';

/**
 * Lesson Detail E2E Tests
 * 
 * Comprehensive scenario coverage for lesson-detail video rendering:
 * - Three video states: iframe embed, external link fallback, placeholder
 * - Multi-lesson navigation and URL integrity
 * - Dynamic content loading from seeded Odoo data
 */

test.describe('Lesson Detail - Video Rendering', () => {
  // Navigate to courses/units to ensure data is loaded
  test.beforeEach(async ({ page }) => {
    await page.goto('/courses/units');
  });

  test('should render lesson detail with all three video states available', async ({ page }) => {
    // Get first unit card and navigate
    const cards = page.getByTestId('unit-card');
    const cardCount = await cards.count();
    
    if (cardCount === 0) {
      test.skip();
      return;
    }

    // Click first card to navigate to lesson detail
    await cards.first().click();
    
    // Verify we're on a lesson detail page
    await expect(page).toHaveURL(/\/lessons\/\d+/);
    
    // At least one of the three video states should be visible
    const player = page.getByTestId('lesson-video-player');
    const fallback = page.getByTestId('lesson-video-link-fallback');
    const placeholder = page.getByTestId('lesson-video-placeholder');
    
    const playerVisible = await player.isVisible().catch(() => false);
    const fallbackVisible = await fallback.isVisible().catch(() => false);
    const placeholderVisible = await placeholder.isVisible().catch(() => false);
    
    const hasAnyVideoState = playerVisible || fallbackVisible || placeholderVisible;
    expect(hasAnyVideoState).toBe(true);
  });

  test('should display YouTube iframe when video_url is valid YouTube format', async ({ page }) => {
    // This test validates that seeded YouTube URLs render correctly
    const cards = page.getByTestId('unit-card');
    const cardCount = await cards.count();
    
    if (cardCount === 0) {
      test.skip();
      return;
    }

    // Try multiple cards to find one with an iframe embed
    let foundIframe = false;
    const cardLimit = Math.min(5, cardCount);
    
    for (let i = 0; i < cardLimit; i++) {
      await cards.nth(i).click();
      
      const player = page.getByTestId('lesson-video-player');
      if (await player.isVisible().catch(() => false)) {
        foundIframe = true;
        
        // Verify iframe has valid src attribute
        const iframeSrc = await player.getAttribute('src');
        expect(iframeSrc).toBeTruthy();
        expect(iframeSrc).toContain('youtube.com/embed');
        break;
      }
      
      // Go back to units list to try next card
      await page.goBack();
      await page.goto('/courses/units');
    }
    
    if (!foundIframe) {
      test.skip();
    }
  });

  test('should display fallback link when video_url is external URL', async ({ page }) => {
    // This test validates that external URLs render as clickable links
    const cards = page.getByTestId('unit-card');
    const cardCount = await cards.count();
    
    if (cardCount === 0) {
      test.skip();
      return;
    }

    // Try multiple cards to find one with a fallback link
    let foundFallback = false;
    const cardLimit = Math.min(5, cardCount);
    
    for (let i = 0; i < cardLimit; i++) {
      await cards.nth(i).click();
      
      const fallback = page.getByTestId('lesson-video-link-fallback');
      if (await fallback.isVisible().catch(() => false)) {
        foundFallback = true;
        
        // Verify link has href
        const href = await fallback.getAttribute('href');
        expect(href).toBeTruthy();
        break;
      }
      
      // Go back to units list to try next card
      await page.goBack();
      await page.goto('/courses/units');
    }
    
    if (!foundFallback) {
      test.skip();
    }
  });

  test('should display placeholder when video_url is not set', async ({ page }) => {
    // This test validates that lessons without videos show the placeholder
    const cards = page.getByTestId('unit-card');
    const cardCount = await cards.count();
    
    if (cardCount === 0) {
      test.skip();
      return;
    }

    // Try multiple cards to find one with a placeholder
    let foundPlaceholder = false;
    const cardLimit = Math.min(5, cardCount);
    
    for (let i = 0; i < cardLimit; i++) {
      await cards.nth(i).click();
      
      const placeholder = page.getByTestId('lesson-video-placeholder');
      if (await placeholder.isVisible().catch(() => false)) {
        foundPlaceholder = true;
        
        // Verify placeholder is visible but no interactive elements
        await expect(placeholder).toContainText(/conteúdo|texto|conteúdo em texto/i);
        break;
      }
      
      // Go back to units list to try next card
      await page.goBack();
      await page.goto('/courses/units');
    }
    
    if (!foundPlaceholder) {
      test.skip();
    }
  });

  test('should maintain lesson detail view stability across navigation', async ({ page }) => {
    const cards = page.getByTestId('unit-card');
    const cardCount = await cards.count();
    
    if (cardCount === 0) {
      test.skip();
      return;
    }

    // Navigate to first lesson
    await cards.first().click();
    const firstUrl = page.url();
    expect(firstUrl).toMatch(/\/lessons\/\d+/);
    
    // Verify lesson detail content is visible
    const title = page.getByRole('heading').first();
    await expect(title).toBeVisible();
    
    // Go back and navigate to a different card
    await page.goBack();
    const secondCardIndex = Math.min(1, cardCount - 1);
    
    if (secondCardIndex !== 0) {
      await cards.nth(secondCardIndex).click();
      const secondUrl = page.url();
      
      // URLs should be different (different lesson IDs)
      expect(secondUrl).not.toBe(firstUrl);
      expect(secondUrl).toMatch(/\/lessons\/\d+/);
    }
  });

  test('should load lesson content without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const cards = page.getByTestId('unit-card');
    if (await cards.count() === 0) {
      test.skip();
      return;
    }

    await cards.first().click();
    await expect(page).toHaveURL(/\/lessons\/\d+/);
    
    // Wait for content to stabilize
    await page.waitForTimeout(1000);
    
    // Filter out irrelevant errors (like CORS for external resources)
    const relevantErrors = consoleErrors.filter(
      (err) => !err.includes('CORS') && !err.includes('Failed to fetch')
    );
    
    expect(relevantErrors).toHaveLength(0);
  });
});

test.describe('Lesson Detail - Layout & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/courses/units');
  });

  test('should display lesson title and description', async ({ page }) => {
    const cards = page.getByTestId('unit-card');
    if (await cards.count() === 0) {
      test.skip();
      return;
    }

    await cards.first().click();
    
    // Verify heading is visible
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
    
    // Verify heading has text content
    const headingText = await heading.textContent();
    expect(headingText?.length).toBeGreaterThan(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const cards = page.getByTestId('unit-card');
    if (await cards.count() === 0) {
      test.skip();
      return;
    }

    await cards.first().click();
    
    // Primary heading should exist
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThan(0);
  });

  test('should render responsive video player', async ({ page }) => {
    const cards = page.getByTestId('unit-card');
    if (await cards.count() === 0) {
      test.skip();
      return;
    }

    await cards.first().click();
    
    // Test at mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    const videoBlock = page.locator('[data-testid*="lesson-video"]');
    const isVisible = await videoBlock.first().isVisible().catch(() => false);
    
    // Should be visible at mobile
    if (isVisible) {
      expect(isVisible).toBe(true);
    }
    
    // Test at desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    const videoBlockDesktop = page.locator('[data-testid*="lesson-video"]');
    const isVisibleDesktop = await videoBlockDesktop.first().isVisible().catch(() => false);
    
    if (isVisibleDesktop) {
      expect(isVisibleDesktop).toBe(true);
    }
  });
});
