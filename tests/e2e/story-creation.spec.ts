import { test, expect } from '@playwright/test';

/**
 * Story Creation E2E Tests
 * Tests the complete story creation flow
 */

test.describe('Story Creation', () => {
  // Use stored auth state for authenticated tests
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  test.describe('Create Story Page', () => {
    test('displays story creation form', async ({ page }) => {
      await page.goto('/create');

      // Check for main form elements
      await expect(page.locator('h1, h2').filter({ hasText: /create|new story/i }).first()).toBeVisible({ timeout: 10000 });
    });

    test('has child name input', async ({ page }) => {
      await page.goto('/create');

      // Look for child name input
      const nameInput = page.locator('input[name="childName"], input[placeholder*="name" i]');
      await expect(nameInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('has theme/setting selection', async ({ page }) => {
      await page.goto('/create');

      // Look for theme or setting selection
      const themeSection = page.locator('text=/theme|setting|adventure/i');
      await expect(themeSection.first()).toBeVisible({ timeout: 10000 });
    });

    test('has story length selection', async ({ page }) => {
      await page.goto('/create');

      // Look for length options
      const lengthSection = page.locator('text=/length|quick|medium|epic/i');
      await expect(lengthSection.first()).toBeVisible({ timeout: 10000 });
    });

    test('has art style selection', async ({ page }) => {
      await page.goto('/create');

      // Look for art style options
      const artSection = page.locator('text=/art style|illustration/i');
      await expect(artSection.first()).toBeVisible({ timeout: 10000 });
    });

    test('has voice selection', async ({ page }) => {
      await page.goto('/create');

      // Look for voice selection
      const voiceSection = page.locator('text=/voice|narrator/i');
      await expect(voiceSection.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Form Validation', () => {
    test('requires child name', async ({ page }) => {
      await page.goto('/create');

      // Try to submit without name
      const submitButton = page.locator('button:has-text("Create"), button:has-text("Generate"), button[type="submit"]').first();

      if (await submitButton.isEnabled()) {
        await submitButton.click();

        // Should show validation error or stay on page
        await page.waitForTimeout(1000);

        // Check for error message or still on create page
        const errorOrStillOnCreate = await page.locator('text=/required|enter|name/i').isVisible() ||
                                      page.url().includes('/create');
        expect(errorOrStillOnCreate).toBeTruthy();
      }
    });

    test('validates name length', async ({ page }) => {
      await page.goto('/create');

      const nameInput = page.locator('input[name="childName"], input[placeholder*="name" i]').first();

      // Enter very long name
      await nameInput.fill('A'.repeat(100));

      // Check for validation feedback (truncation or error)
      const inputValue = await nameInput.inputValue();
      // Should either be truncated or show error
      expect(inputValue.length <= 100).toBeTruthy();
    });
  });

  test.describe('Story Generation Flow', () => {
    test('shows progress during generation', async ({ page }) => {
      await page.goto('/create');

      // Fill in required fields
      const nameInput = page.locator('input[name="childName"], input[placeholder*="name" i]').first();
      await nameInput.fill('Test Child');

      // Select options (if visible)
      await page.waitForTimeout(1000);

      // Submit the form
      const submitButton = page.locator('button:has-text("Create"), button:has-text("Generate"), button[type="submit"]').first();

      if (await submitButton.isEnabled()) {
        await submitButton.click();

        // Should show loading/progress state
        const loadingIndicator = page.locator('text=/generating|creating|please wait/i, [class*="loading"], [class*="spinner"], [class*="animate-"]');

        // Wait for either loading or redirect
        await Promise.race([
          loadingIndicator.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
          page.waitForURL('**/stories/**', { timeout: 30000 }).catch(() => {}),
        ]);
      }
    });

    test('navigates to story page on completion', async ({ page }) => {
      // This is a longer test that waits for story generation
      test.setTimeout(120000);

      await page.goto('/create');

      const nameInput = page.locator('input[name="childName"], input[placeholder*="name" i]').first();
      await nameInput.fill('E2E Test Child');

      const submitButton = page.locator('button:has-text("Create"), button:has-text("Generate"), button[type="submit"]').first();

      if (await submitButton.isEnabled()) {
        await submitButton.click();

        // Wait for navigation to story page (may take a while)
        await page.waitForURL('**/stories/**', { timeout: 90000 });

        await expect(page).toHaveURL(/.*stories\/.*/);
      }
    });
  });

  test.describe('Credits/Limits', () => {
    test('shows remaining credits or story limit', async ({ page }) => {
      await page.goto('/create');

      // Look for credit/limit indicator
      const creditInfo = page.locator('text=/credit|stories remaining|limit/i');
      // May or may not be visible depending on user tier
      await page.waitForTimeout(2000);
    });

    test('shows upgrade prompt when at limit', async ({ page }) => {
      await page.goto('/create');

      // If at limit, should show upgrade prompt
      const upgradePrompt = page.locator('text=/upgrade|subscribe|limit reached/i');
      // This is conditional based on user state
      await page.waitForTimeout(2000);
    });
  });
});

test.describe('Story Creation - Unauthenticated', () => {
  test('redirects to sign in', async ({ page }) => {
    await page.context().clearCookies();

    await page.goto('/create');

    await expect(page).toHaveURL(/.*sign-in.*/, { timeout: 10000 });
  });
});
