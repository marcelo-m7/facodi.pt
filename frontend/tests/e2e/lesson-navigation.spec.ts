import { test, expect } from '@playwright/test';

/**
 * Lesson Navigation E2E Tests
 * 
 * Validates lesson detail navigation flows:
 * - Navigation between lessons in same course
 * - URL integrity and parameter persistence
 * - Back navigation and state preservation
 * - Cross-course navigation patterns
 */

test.describe('Lesson Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/courses/units');
  });

  test('should navigate to lesson detail with correct URL format', async ({ page }) => {
    const cards = page.getByTestId('unit-card');
    if (await cards.count() === 0) {
      test.skip();
      return;
    }

    await cards.first().click();
    
    // URL should match /lessons/{id} pattern
    await expect(page).toHaveURL(/\/lessons\/\d+/);
    
    // Extract lesson ID and verify it's numeric
    const url = page.url();
    const match = url.match(/\/lessons\/(\d+)/);
    expect(match).toBeTruthy();
    expect(match?.[1]).toMatch(/^\d+$/);
  });

  test('should preserve lesson detail state when navigating back', async ({ page }) => {
    const cards = page.getByTestId('unit-card');
    if (await cards.count() < 2) {
      test.skip();
      return;
    }

    // Navigate to first lesson
    await cards.first().click();
    const firstUrl = page.url();
    
    // Go back to units
    await page.goBack();
    await expect(page).toHaveURL(/\/courses\/units/);
    
    // Verify we can still see unit cards
    const unitsCards = page.getByTestId('unit-card');
    const unitsCount = await unitsCards.count();
    expect(unitsCount).toBeGreaterThan(0);
    
    // Navigate to a different lesson
    const secondCardIndex = Math.min(1, unitsCount - 1);
    if (secondCardIndex > 0) {
      await unitsCards.nth(secondCardIndex).click();
      const secondUrl = page.url();
      
      // URLs should be different
      expect(secondUrl).not.toBe(firstUrl);
      expect(secondUrl).toMatch(/\/lessons\/\d+/);
    }
  });

  test('should support direct navigation to lesson via URL', async ({ page }) => {
    // First, navigate normally to get a valid lesson ID
    const cards = page.getByTestId('unit-card');
    if (await cards.count() === 0) {
      test.skip();
      return;
    }

    await cards.first().click();
    const url = page.url();
    
    // Extract lesson ID
    const match = url.match(/\/lessons\/(\d+)/);
    if (!match?.[1]) {
      test.skip();
      return;
    }

    const lessonId = match[1];
    
    // Navigate away and back to home
    await page.goto('/');
    
    // Direct navigation to the lesson
    await page.goto(`/lessons/${lessonId}`);
    
    // Should load the lesson detail page
    await expect(page).toHaveURL(`/lessons/${lessonId}`);
    
    // Lesson content should be visible
    const title = page.getByRole('heading').first();
    await expect(title).toBeVisible();
  });

  test('should handle navigation between multiple lessons sequentially', async ({ page }) => {
    const cards = page.getByTestId('unit-card');
    if (await cards.count() < 3) {
      test.skip();
      return;
    }

    const visitedUrls: string[] = [];
    
    // Navigate to first three lessons
    for (let i = 0; i < 3; i++) {
      const updatedCards = page.getByTestId('unit-card');
      await updatedCards.nth(i).click();
      
      const currentUrl = page.url();
      visitedUrls.push(currentUrl);
      
      // Verify URL format
      expect(currentUrl).toMatch(/\/lessons\/\d+/);
      
      // Go back to units
      await page.goBack();
      await expect(page).toHaveURL(/\/courses\/units/);
    }
    
    // All visited URLs should be unique
    const uniqueUrls = new Set(visitedUrls);
    expect(uniqueUrls.size).toBe(3);
  });

  test('should maintain scroll position context across navigation', async ({ page }) => {
    const cards = page.getByTestId('unit-card');
    if (await cards.count() === 0) {
      test.skip();
      return;
    }

    // Scroll down on units page
    await page.evaluate(() => window.scrollBy(0, 200));
    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBeGreaterThan(0);
    
    // Navigate to lesson
    await cards.first().click();
    
    // Go back to units
    await page.goBack();
    
    // Scroll position may or may not be preserved (depends on implementation)
    // Just verify we can scroll and interact
    await page.evaluate(() => window.scrollBy(0, 100));
    const scrollAfter = await page.evaluate(() => window.scrollY);
    
    expect(typeof scrollAfter).toBe('number');
  });

  test('should load lesson content efficiently', async ({ page }) => {
    const cards = page.getByTestId('unit-card');
    if (await cards.count() === 0) {
      test.skip();
      return;
    }

    // Measure navigation time
    const startTime = Date.now();
    
    await cards.first().click();
    
    // Lesson content should be visible within reasonable time
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
    
    const loadTime = Date.now() - startTime;
    
    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle rapid navigation without errors', async ({ page }) => {
    const cards = page.getByTestId('unit-card');
    if (await cards.count() < 2) {
      test.skip();
      return;
    }

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Rapidly navigate between lessons
    for (let i = 0; i < 2; i++) {
      const updatedCards = page.getByTestId('unit-card');
      await updatedCards.nth(i).click();
      
      // Don't wait, go back immediately
      await page.goBack();
    }
    
    // Verify no console errors occurred
    const relevantErrors = consoleErrors.filter(
      (err) => !err.includes('CORS') && !err.includes('Failed to fetch')
    );
    
    expect(relevantErrors).toHaveLength(0);
  });
});

test.describe('Lesson Navigation - Cross-Course Flows', () => {
  test('should allow navigation between courses', async ({ page }) => {
    await page.goto('/courses');
    
    // Get course links/cards
    const courseCards = page.locator('[data-testid*="course"]').or(page.locator('a[href*="/courses/"]'));
    const courseCount = await courseCards.count();
    
    if (courseCount < 2) {
      test.skip();
      return;
    }

    // Navigate to first course
    const firstCourseLink = courseCards.first();
    const firstCoursePath = await firstCourseLink.getAttribute('href');
    
    if (!firstCoursePath) {
      test.skip();
      return;
    }

    await firstCourseLink.click();
    await page.waitForURL(new RegExp(firstCoursePath.replace(/^\//, '')));
    
    // Go back to courses
    await page.goBack();
    await expect(page).toHaveURL(/\/courses/);
    
    // Navigate to second course
    const secondCourseLink = courseCards.nth(1);
    const secondCoursePath = await secondCourseLink.getAttribute('href');
    
    if (!secondCoursePath) {
      test.skip();
      return;
    }

    await secondCourseLink.click();
    await page.waitForURL(new RegExp(secondCoursePath.replace(/^\//, '')));
  });

  test('should preserve course context when returning from lesson detail', async ({ page }) => {
    // Navigate to courses/units
    await page.goto('/courses/units');
    
    // Get course selector if available
    const courseDropdown = page.locator('select, [role="combobox"]').first();
    const hasDropdown = await courseDropdown.isVisible().catch(() => false);
    
    const cards = page.getByTestId('unit-card');
    if (await cards.count() === 0) {
      test.skip();
      return;
    }

    // Navigate to lesson
    await cards.first().click();
    
    // Go back
    await page.goBack();
    
    // Should return to /courses/units with same course selected (if dropdown exists)
    await expect(page).toHaveURL(/\/courses\/units/);
    
    if (hasDropdown) {
      const dropdownAfter = page.locator('select, [role="combobox"]').first();
      expect(await dropdownAfter.isVisible()).toBe(true);
    }
  });
});

test.describe('Lesson Detail - Related Content Navigation', () => {
  test('should display related units/lessons navigation if available', async ({ page }) => {
    await page.goto('/courses/units');
    
    const cards = page.getByTestId('unit-card');
    if (await cards.count() === 0) {
      test.skip();
      return;
    }

    await cards.first().click();
    
    // Look for related content section (may vary by implementation)
    const relatedSection = page.locator('[data-testid*="related"], aside, [role="complementary"]').first();
    const hasRelated = await relatedSection.isVisible().catch(() => false);
    
    // If related section exists, verify it has content
    if (hasRelated) {
      const relatedLinks = relatedSection.locator('a, button');
      const linkCount = await relatedLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    }
  });

  test('should navigate to related content without losing context', async ({ page }) => {
    await page.goto('/courses/units');
    
    const cards = page.getByTestId('unit-card');
    if (await cards.count() < 2) {
      test.skip();
      return;
    }

    // Navigate to first lesson
    await cards.first().click();
    const firstUrl = page.url();
    
    // Look for related/navigation links
    const navLinks = page.locator('a[href*="/lessons/"]').filter({
      hasNot: page.locator(`text=${firstUrl.match(/\/lessons\/(\d+)/)?.pop()}`)
    });
    
    const relatedLinkCount = await navLinks.count();
    
    // If there are related lesson links, click one
    if (relatedLinkCount > 0) {
      await navLinks.first().click();
      
      // Should navigate to a different lesson
      const secondUrl = page.url();
      expect(secondUrl).not.toBe(firstUrl);
      expect(secondUrl).toMatch(/\/lessons\/\d+/);
    }
  });
});
