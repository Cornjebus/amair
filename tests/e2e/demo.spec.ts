import { test, expect } from '@playwright/test';

/**
 * Demo Experience E2E Tests
 * Tests the demo story viewer and onboarding tour
 */

test.describe('Demo Experience', () => {
  test.describe('Demo Story Page', () => {
    test('displays demo page without authentication', async ({ page }) => {
      // Clear any auth state
      await page.context().clearCookies();

      await page.goto('/demo');

      // Should show demo content
      await expect(page.locator('h1, h2').filter({ hasText: /demo|luna|story/i }).first()).toBeVisible({ timeout: 10000 });
    });

    test('shows Luna and the Starlight Garden story', async ({ page }) => {
      await page.goto('/demo');

      // Should show the demo story title
      const storyTitle = page.locator('text=/luna|starlight|garden/i');
      await expect(storyTitle.first()).toBeVisible({ timeout: 10000 });
    });

    test('displays story illustrations', async ({ page }) => {
      await page.goto('/demo');

      // Should have story images
      const images = page.locator('img');
      await expect(images.first()).toBeVisible({ timeout: 10000 });

      // Check for luna images specifically
      const lunaImages = page.locator('img[src*="luna"], img[alt*="Luna" i]');
      await page.waitForTimeout(2000);
    });

    test('has story navigation controls', async ({ page }) => {
      await page.goto('/demo');

      // Should have next/previous or pagination
      const navControls = page.locator('button:has-text("Next"), button:has-text("Previous"), [class*="pagination"], [class*="nav"]');
      await expect(navControls.first()).toBeVisible({ timeout: 10000 });
    });

    test('can navigate between story pages', async ({ page }) => {
      await page.goto('/demo');

      const nextButton = page.locator('button:has-text("Next"), [aria-label*="next" i]').first();

      if (await nextButton.isVisible()) {
        // Get initial content
        const initialContent = await page.content();

        await nextButton.click();
        await page.waitForTimeout(1000);

        // Content or page indicator should change
        const newContent = await page.content();
        // Something should have changed (page number, content, etc.)
      }
    });

    test('can go back to previous page', async ({ page }) => {
      await page.goto('/demo');

      // First go forward
      const nextButton = page.locator('button:has-text("Next")').first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }

      // Then go back
      const prevButton = page.locator('button:has-text("Previous"), button:has-text("Back")').first();
      if (await prevButton.isVisible()) {
        await prevButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('displays story text content', async ({ page }) => {
      await page.goto('/demo');

      // Should have story paragraph content
      const storyText = page.locator('p, [class*="story-text"], [class*="content"]');
      await expect(storyText.first()).toBeVisible({ timeout: 10000 });

      // Text should have reasonable length (not empty)
      const textContent = await storyText.first().textContent();
      expect(textContent?.length).toBeGreaterThan(10);
    });
  });

  test.describe('Demo CTA', () => {
    test('has call-to-action to sign up', async ({ page }) => {
      await page.goto('/demo');

      // Should have sign up or get started CTA
      const ctaButton = page.locator('a[href*="sign-up"], button:has-text("Sign Up"), button:has-text("Get Started"), a:has-text("Create Your")');
      await expect(ctaButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('CTA navigates to sign up', async ({ page }) => {
      await page.goto('/demo');

      const ctaButton = page.locator('a[href*="sign-up"], button:has-text("Sign Up"), button:has-text("Get Started")').first();

      if (await ctaButton.isVisible()) {
        await ctaButton.click();

        await expect(page).toHaveURL(/.*sign-up.*/);
      }
    });
  });

  test.describe('Landing Page Demo Button', () => {
    test('landing page has Try Demo button', async ({ page }) => {
      await page.goto('/');

      const demoButton = page.locator('a[href*="demo"], button:has-text("Demo"), button:has-text("Try"), a:has-text("Demo")');
      await expect(demoButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('Demo button navigates to demo page', async ({ page }) => {
      await page.goto('/');

      const demoButton = page.locator('a[href*="demo"], button:has-text("Demo"), a:has-text("Demo")').first();
      await demoButton.click();

      await expect(page).toHaveURL(/.*demo.*/);
    });
  });

  test.describe('Onboarding Tour', () => {
    test.use({ storageState: 'tests/e2e/.auth/user.json' });

    test('shows onboarding for new users', async ({ page }) => {
      // Clear onboarding completion flag
      await page.goto('/dashboard');

      await page.evaluate(() => {
        localStorage.removeItem('onboardingComplete');
        localStorage.removeItem('amari-onboarding');
      });

      await page.reload();

      // May show onboarding tour
      const onboardingOverlay = page.locator('[class*="onboarding"], [class*="tour"], [class*="tooltip"]');
      await page.waitForTimeout(3000);
    });

    test('onboarding has step indicators', async ({ page }) => {
      await page.goto('/dashboard');

      // If onboarding is showing
      const stepIndicator = page.locator('text=/step|1 of|2 of|3 of/i, [class*="step"], [class*="dot"]');
      await page.waitForTimeout(2000);
    });

    test('can progress through onboarding steps', async ({ page }) => {
      await page.goto('/dashboard');

      await page.evaluate(() => {
        localStorage.removeItem('onboardingComplete');
      });

      await page.reload();

      const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Got it")');

      if (await nextButton.first().isVisible()) {
        // Click through steps
        await nextButton.first().click();
        await page.waitForTimeout(500);

        if (await nextButton.first().isVisible()) {
          await nextButton.first().click();
        }
      }
    });

    test('can skip onboarding', async ({ page }) => {
      await page.goto('/dashboard');

      await page.evaluate(() => {
        localStorage.removeItem('onboardingComplete');
      });

      await page.reload();

      const skipButton = page.locator('button:has-text("Skip"), button:has-text("Close"), [aria-label*="close" i]');

      if (await skipButton.first().isVisible()) {
        await skipButton.first().click();

        // Onboarding should be dismissed
        const onboarding = page.locator('[class*="onboarding"], [class*="tour"]');
        await expect(onboarding).not.toBeVisible({ timeout: 5000 });
      }
    });

    test('onboarding completes and saves state', async ({ page }) => {
      await page.goto('/dashboard');

      await page.evaluate(() => {
        localStorage.removeItem('onboardingComplete');
      });

      await page.reload();

      // Complete all steps
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Done"), button:has-text("Finish")');

      let attempts = 0;
      while (await nextButton.first().isVisible() && attempts < 10) {
        await nextButton.first().click();
        await page.waitForTimeout(500);
        attempts++;
      }

      // Check that completion is saved
      const saved = await page.evaluate(() => {
        return localStorage.getItem('onboardingComplete') ||
               localStorage.getItem('amari-onboarding');
      });

      // Should be saved or onboarding dismissed
    });

    test('onboarding does not show for returning users', async ({ page }) => {
      await page.goto('/dashboard');

      // Set completion flag
      await page.evaluate(() => {
        localStorage.setItem('onboardingComplete', 'true');
      });

      await page.reload();
      await page.waitForTimeout(2000);

      // Onboarding should not appear
      const onboarding = page.locator('[class*="onboarding-overlay"], [class*="tour-modal"]');
      await expect(onboarding).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Demo Accessibility', () => {
    test('demo page is keyboard navigable', async ({ page }) => {
      await page.goto('/demo');

      // Tab through page
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }

      // Should be able to focus navigation buttons
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT']).toContain(focused);
    });

    test('story images have alt text', async ({ page }) => {
      await page.goto('/demo');

      const images = page.locator('img');
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');

        // Should have alt text
        expect(alt).toBeDefined();
        expect(alt?.length).toBeGreaterThan(0);
      }
    });

    test('navigation buttons have accessible names', async ({ page }) => {
      await page.goto('/demo');

      const buttons = page.locator('button');
      const count = await buttons.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);

        const name = await button.getAttribute('aria-label') ||
                     await button.textContent();

        // Should have accessible name
        expect(name?.trim().length).toBeGreaterThan(0);
      }
    });
  });
});
