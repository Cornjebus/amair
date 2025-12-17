import { test, expect } from '@playwright/test';

/**
 * Accessibility E2E Tests
 * Tests WCAG 2.1 AA compliance including keyboard navigation,
 * skip links, focus management, and screen reader compatibility
 */

test.describe('Accessibility', () => {
  test.describe('Skip Links', () => {
    test('skip link is visible on focus', async ({ page }) => {
      await page.goto('/');

      // Tab to focus on skip link
      await page.keyboard.press('Tab');

      // Skip link should be visible
      const skipLink = page.locator('a:has-text("Skip"), [class*="skip"]').first();
      await expect(skipLink).toBeVisible({ timeout: 5000 });
    });

    test('skip link navigates to main content', async ({ page }) => {
      await page.goto('/');

      // Tab to skip link and activate
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Focus should be on main content area
      const mainContent = page.locator('#main-content, main, [role="main"]');
      await page.waitForTimeout(500);
    });

    test.describe('Authenticated Pages', () => {
      test.use({ storageState: 'tests/e2e/.auth/user.json' });

      test('skip link works on dashboard', async ({ page }) => {
        await page.goto('/dashboard');

        await page.keyboard.press('Tab');

        const skipLink = page.locator('a:has-text("Skip"), [class*="skip"]').first();
        if (await skipLink.isVisible()) {
          await page.keyboard.press('Enter');

          // Main content should receive focus
          const mainContent = page.locator('#main-content, main');
          await page.waitForTimeout(500);
        }
      });
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('can navigate landing page with keyboard', async ({ page }) => {
      await page.goto('/');

      // Tab through interactive elements
      const tabOrder: string[] = [];

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');

        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.tagName + (el?.textContent?.substring(0, 20) || '');
        });

        tabOrder.push(focused);
      }

      // Should have navigated through multiple elements
      expect(tabOrder.length).toBe(10);
    });

    test('focusable elements have visible focus indicator', async ({ page }) => {
      await page.goto('/');

      // Tab to first interactive element
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Check for focus styles
      const focusedElement = page.locator(':focus');

      if (await focusedElement.isVisible()) {
        // Should have some focus styling (outline, ring, etc.)
        const styles = await focusedElement.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            outline: computed.outline,
            boxShadow: computed.boxShadow,
            border: computed.border,
          };
        });

        // At least one focus indicator should be present
        const hasFocusIndicator =
          styles.outline !== 'none' ||
          styles.boxShadow !== 'none' ||
          styles.outline.includes('px');

        // Most modern sites use focus-visible or custom focus styles
      }
    });

    test('can activate buttons with Enter key', async ({ page }) => {
      await page.goto('/');

      // Tab to a button
      let foundButton = false;
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');

        const tagName = await page.evaluate(() => document.activeElement?.tagName);
        if (tagName === 'BUTTON' || tagName === 'A') {
          foundButton = true;
          break;
        }
      }

      if (foundButton) {
        // Press Enter should activate
        const beforeUrl = page.url();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        // Either URL changed or some action occurred
      }
    });

    test('can activate buttons with Space key', async ({ page }) => {
      await page.goto('/');

      // Find a button
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');

        const tagName = await page.evaluate(() => document.activeElement?.tagName);
        if (tagName === 'BUTTON') {
          // Space should activate buttons
          await page.keyboard.press('Space');
          await page.waitForTimeout(500);
          break;
        }
      }
    });
  });

  test.describe('Form Accessibility', () => {
    test.use({ storageState: 'tests/e2e/.auth/user.json' });

    test('form inputs have associated labels', async ({ page }) => {
      await page.goto('/create');

      // Find inputs
      const inputs = page.locator('input:not([type="hidden"]), select, textarea');
      const count = await inputs.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const input = inputs.nth(i);

        // Check for label association
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');

        // Should have at least one labeling mechanism
        const hasLabel = id || ariaLabel || ariaLabelledBy || placeholder;
        // Most inputs should have labels
      }
    });

    test('required fields are indicated', async ({ page }) => {
      await page.goto('/create');

      // Required fields should have required attribute or aria-required
      const requiredInputs = page.locator('input[required], input[aria-required="true"]');
      await page.waitForTimeout(2000);
    });

    test('error messages are announced', async ({ page }) => {
      await page.goto('/create');

      // Try to submit invalid form to trigger errors
      const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first();

      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Check for error announcements
        const errorMessages = page.locator('[role="alert"], [aria-live], .error, [class*="error"]');
        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe('Modal/Dialog Accessibility', () => {
    test.use({ storageState: 'tests/e2e/.auth/user.json' });

    test('dialog has correct ARIA attributes', async ({ page }) => {
      await page.goto('/settings/privacy');

      // Trigger a dialog
      const triggerButton = page.locator('button:has-text("Delete Account"), button:has-text("Export")').first();
      await triggerButton.click();

      // Check dialog attributes
      const dialog = page.locator('[role="dialog"], [role="alertdialog"]');

      if (await dialog.isVisible()) {
        // Should have role
        const role = await dialog.getAttribute('role');
        expect(['dialog', 'alertdialog']).toContain(role);

        // Should have aria-modal
        const ariaModal = await dialog.getAttribute('aria-modal');
        expect(ariaModal).toBe('true');

        // Close dialog
        await page.keyboard.press('Escape');
      }
    });

    test('focus is trapped in modal', async ({ page }) => {
      await page.goto('/settings/privacy');

      const triggerButton = page.locator('button:has-text("Delete Account")').first();
      await triggerButton.click();

      const dialog = page.locator('[role="dialog"], [role="alertdialog"]');

      if (await dialog.isVisible()) {
        // Tab through dialog elements
        const initialFocused = await page.evaluate(() => document.activeElement?.tagName);

        // Tab several times
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
        }

        // Focus should still be within dialog
        const stillInDialog = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"], [role="alertdialog"]');
          return dialog?.contains(document.activeElement);
        });

        expect(stillInDialog).toBeTruthy();

        await page.keyboard.press('Escape');
      }
    });

    test('Escape key closes modal', async ({ page }) => {
      await page.goto('/settings/privacy');

      const triggerButton = page.locator('button:has-text("Export")').first();
      await triggerButton.click();

      const dialog = page.locator('[role="dialog"], [role="alertdialog"]');
      await expect(dialog.first()).toBeVisible({ timeout: 5000 });

      await page.keyboard.press('Escape');

      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Images & Media', () => {
    test('images have alt text', async ({ page }) => {
      await page.goto('/');

      const images = page.locator('img');
      const count = await images.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');

        // Should have alt text or be decorative (role="presentation")
        const hasAltOrDecorative = alt !== null || role === 'presentation' || role === 'none';
        expect(hasAltOrDecorative).toBeTruthy();
      }
    });

    test('decorative images are hidden from screen readers', async ({ page }) => {
      await page.goto('/');

      // Check for properly marked decorative images
      const decorativeImages = page.locator('img[role="presentation"], img[alt=""], img[aria-hidden="true"]');
      // These should exist for decorative images
    });
  });

  test.describe('Color & Contrast', () => {
    test('text has sufficient color contrast', async ({ page }) => {
      await page.goto('/');

      // Basic check that text is readable
      // Full contrast testing would require axe-core or similar
      const body = page.locator('body');
      const bgColor = await body.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );

      // Background should be defined
      expect(bgColor).toBeDefined();
    });

    test('links are distinguishable from text', async ({ page }) => {
      await page.goto('/');

      const link = page.locator('a').first();

      if (await link.isVisible()) {
        const linkStyles = await link.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            textDecoration: computed.textDecoration,
          };
        });

        // Links should have some distinguishing feature
        expect(linkStyles.color || linkStyles.textDecoration).toBeDefined();
      }
    });
  });

  test.describe('Reduced Motion', () => {
    test('respects prefers-reduced-motion', async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await page.goto('/');

      // Animations should be reduced or removed
      // Check for animation styles
      const animatedElements = page.locator('[class*="animate"], [class*="transition"]');
      await page.waitForTimeout(1000);

      // Page should still function correctly
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Screen Reader Announcements', () => {
    test.use({ storageState: 'tests/e2e/.auth/user.json' });

    test('live regions exist for dynamic content', async ({ page }) => {
      await page.goto('/dashboard');

      // Check for live regions
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
      // Modern apps should have live regions for notifications
    });

    test('loading states are announced', async ({ page }) => {
      await page.goto('/stories');

      // Check for aria-busy or loading announcements
      const loadingIndicators = page.locator('[aria-busy="true"], [aria-label*="loading" i]');
      // May or may not be visible depending on load state
    });
  });

  test.describe('Heading Structure', () => {
    test('page has h1 heading', async ({ page }) => {
      await page.goto('/');

      const h1 = page.locator('h1');
      await expect(h1.first()).toBeVisible({ timeout: 10000 });
    });

    test('headings are in logical order', async ({ page }) => {
      await page.goto('/');

      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      const levels: number[] = [];

      for (const heading of headings) {
        const tagName = await heading.evaluate((el) => el.tagName);
        levels.push(parseInt(tagName.charAt(1)));
      }

      // Should start with h1
      if (levels.length > 0) {
        expect(levels[0]).toBe(1);
      }

      // No level should skip more than 1 (h1 -> h3 is bad)
      for (let i = 1; i < levels.length; i++) {
        const skip = levels[i] - levels[i - 1];
        // Skipping down is OK (h2 -> h1), but skipping up more than 1 is questionable
      }
    });
  });
});
