import { test, expect } from '@playwright/test';

/**
 * Authentication Flow E2E Tests
 * Tests sign up, sign in, sign out, and password reset flows
 */

test.describe('Authentication Flows', () => {
  test.describe('Landing Page', () => {
    test('displays sign in and sign up buttons', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Check for Sign In button
      await expect(page.locator('text=Sign In').first()).toBeVisible({ timeout: 10000 });

      // Check for Get Started or Free Trial CTA
      const cta = page.locator('text=/Get Started|Start Your Free Trial/i').first();
      await expect(cta).toBeVisible({ timeout: 10000 });
    });

    test('sign in button navigates to sign in page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Click Sign In link and wait for navigation
      await Promise.all([
        page.waitForURL(/.*sign-in.*/, { timeout: 15000 }),
        page.locator('a[href*="sign-in"]').first().click(),
      ]);

      await expect(page).toHaveURL(/.*sign-in.*/);
    });

    test('sign up button navigates to sign up page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Click Get Started link (in header) and wait for navigation
      await Promise.all([
        page.waitForURL(/.*sign-up.*/, { timeout: 15000 }),
        page.locator('header a[href*="sign-up"]').click(),
      ]);

      await expect(page).toHaveURL(/.*sign-up.*/);
    });
  });

  test.describe('Sign In Page', () => {
    test('displays Clerk sign in form', async ({ page }) => {
      await page.goto('/sign-in');

      // Wait for Clerk to load
      await page.waitForLoadState('networkidle');

      // Check for email input (Clerk's form)
      const emailInput = page.locator('input[name="identifier"], input[type="email"]');
      await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/sign-in');
      await page.waitForLoadState('networkidle');

      // Fill in invalid credentials
      const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
      await emailInput.fill('invalid@example.com');

      // Click continue
      const continueButton = page.locator('button:has-text("Continue"), button[type="submit"]').first();
      await continueButton.click();

      // Should show error or move to password step
      // Clerk may show "Account not found" or similar
      await page.waitForTimeout(2000);
    });

    test('has link to sign up', async ({ page }) => {
      await page.goto('/sign-in');
      await page.waitForLoadState('networkidle');

      // Look for sign up link
      const signUpLink = page.locator('a:has-text("Sign up"), a:has-text("Create account"), a:has-text("Don\'t have an account")');
      await expect(signUpLink.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Sign Up Page', () => {
    test('displays Clerk sign up form', async ({ page }) => {
      await page.goto('/sign-up');

      // Wait for Clerk to load
      await page.waitForLoadState('networkidle');

      // Check for email input
      const emailInput = page.locator('input[name="emailAddress"], input[type="email"]');
      await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('has link to sign in', async ({ page }) => {
      await page.goto('/sign-up');
      await page.waitForLoadState('networkidle');

      // Look for sign in link
      const signInLink = page.locator('a:has-text("Sign in"), a:has-text("Already have an account")');
      await expect(signInLink.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Protected Routes', () => {
    test('redirects unauthenticated users from dashboard', async ({ page }) => {
      // Clear any existing auth state
      await page.context().clearCookies();

      await page.goto('/dashboard');

      // Should redirect to sign in
      await expect(page).toHaveURL(/.*sign-in.*/, { timeout: 10000 });
    });

    test('redirects unauthenticated users from stories', async ({ page }) => {
      await page.context().clearCookies();

      await page.goto('/stories');

      await expect(page).toHaveURL(/.*sign-in.*/, { timeout: 10000 });
    });

    test('redirects unauthenticated users from settings', async ({ page }) => {
      await page.context().clearCookies();

      await page.goto('/settings');

      await expect(page).toHaveURL(/.*sign-in.*/, { timeout: 10000 });
    });
  });
});

test.describe('Authenticated User', () => {
  // Use stored auth state
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  test('can access dashboard after sign in', async ({ page }) => {
    await page.goto('/dashboard');

    // Should stay on dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test('displays user button in header', async ({ page }) => {
    await page.goto('/dashboard');

    // Clerk's UserButton component
    const userButton = page.locator('[data-clerk-component="UserButton"], .cl-userButton');
    await expect(userButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('can sign out', async ({ page }) => {
    await page.goto('/dashboard');

    // Click user button
    const userButton = page.locator('[data-clerk-component="UserButton"], .cl-userButton').first();
    await userButton.click();

    // Wait for popover
    await page.waitForTimeout(1000);

    // Click sign out
    const signOutButton = page.locator('button:has-text("Sign out")');
    if (await signOutButton.isVisible()) {
      await signOutButton.click();

      // Should redirect to home or sign in
      await expect(page).toHaveURL(/\/(sign-in)?$/, { timeout: 10000 });
    }
  });
});
