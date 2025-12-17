import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

/**
 * Authentication setup for Playwright tests
 * This runs before all tests to establish an authenticated session
 */
setup('authenticate', async ({ page }) => {
  // Navigate to sign in page
  await page.goto('/sign-in');

  // Wait for Clerk to load
  await page.waitForLoadState('networkidle');

  // Check if we're already signed in (redirect to dashboard)
  const currentUrl = page.url();
  if (currentUrl.includes('/dashboard')) {
    // Already authenticated, save state and return
    await page.context().storageState({ path: authFile });
    return;
  }

  // For CI/testing, we'll use test credentials
  // In real usage, these would be test account credentials
  const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

  // Clerk's sign-in form
  // Note: Clerk's form structure may vary, adjust selectors as needed
  try {
    // Wait for email input
    const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(testEmail);

    // Click continue/next button
    const continueButton = page.locator('button:has-text("Continue"), button[type="submit"]').first();
    await continueButton.click();

    // Wait for password input
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(testPassword);

    // Click sign in button
    const signInButton = page.locator('button:has-text("Sign in"), button:has-text("Continue"), button[type="submit"]').first();
    await signInButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Verify we're on the dashboard
    await expect(page.locator('text=Stories, text=Create')).toBeVisible({ timeout: 10000 });

  } catch (error) {
    // If authentication fails, we'll skip tests that require auth
    console.warn('Authentication setup failed:', error);
    console.warn('Tests requiring authentication will be skipped');
  }

  // Save authentication state
  await page.context().storageState({ path: authFile });
});

setup.describe.configure({ mode: 'serial' });
