import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Automated Accessibility Audit using axe-core
 * Tests WCAG 2.1 AA compliance across all major pages
 */

// Store violations for reporting
const allViolations: { page: string; violations: any[] }[] = [];

test.describe('Accessibility Audit - WCAG 2.1 AA', () => {
  test.afterAll(async () => {
    // Log summary at the end
    console.log('\n========================================');
    console.log('ACCESSIBILITY AUDIT SUMMARY');
    console.log('========================================\n');

    let totalViolations = 0;
    for (const result of allViolations) {
      if (result.violations.length > 0) {
        console.log(`\n${result.page}: ${result.violations.length} violation(s)`);
        result.violations.forEach((v) => {
          console.log(`  - [${v.impact}] ${v.id}: ${v.description}`);
          console.log(`    Help: ${v.helpUrl}`);
        });
        totalViolations += result.violations.length;
      } else {
        console.log(`${result.page}: ✓ No violations`);
      }
    }

    console.log('\n========================================');
    console.log(`TOTAL VIOLATIONS: ${totalViolations}`);
    console.log('========================================\n');
  });

  test.describe('Public Pages', () => {
    test('Landing page is accessible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      allViolations.push({ page: 'Landing Page (/)', violations: results.violations });

      // Log violations for debugging
      if (results.violations.length > 0) {
        console.log('Landing page violations:', JSON.stringify(results.violations, null, 2));
      }

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });

    test('Pricing page is accessible', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      allViolations.push({ page: 'Pricing Page (/pricing)', violations: results.violations });

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });

    test('Demo page is accessible', async ({ page }) => {
      await page.goto('/demo');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      allViolations.push({ page: 'Demo Page (/demo)', violations: results.violations });

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });

    test('Sign in page is accessible', async ({ page }) => {
      await page.goto('/sign-in');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.cl-internal-element') // Exclude Clerk internal elements
        .analyze();

      allViolations.push({ page: 'Sign In Page (/sign-in)', violations: results.violations });

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });

    test('Sign up page is accessible', async ({ page }) => {
      await page.goto('/sign-up');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.cl-internal-element')
        .analyze();

      allViolations.push({ page: 'Sign Up Page (/sign-up)', violations: results.violations });

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });

    test('Gifts page is accessible', async ({ page }) => {
      await page.goto('/gifts');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      allViolations.push({ page: 'Gifts Page (/gifts)', violations: results.violations });

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });
  });

  test.describe('Authenticated Pages', () => {
    test.use({ storageState: 'tests/e2e/.auth/user.json' });

    test('Dashboard is accessible', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.cl-userButton') // Exclude Clerk components
        .analyze();

      allViolations.push({ page: 'Dashboard (/dashboard)', violations: results.violations });

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });

    test('Stories page is accessible', async ({ page }) => {
      await page.goto('/stories');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.cl-userButton')
        .analyze();

      allViolations.push({ page: 'Stories Page (/stories)', violations: results.violations });

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });

    test('Create story page is accessible', async ({ page }) => {
      await page.goto('/create');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.cl-userButton')
        .analyze();

      allViolations.push({ page: 'Create Story (/create)', violations: results.violations });

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });

    test('Settings page is accessible', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.cl-userButton')
        .analyze();

      allViolations.push({ page: 'Settings (/settings)', violations: results.violations });

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });

    test('Profile settings is accessible', async ({ page }) => {
      await page.goto('/settings/profile');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.cl-userButton')
        .analyze();

      allViolations.push({ page: 'Profile Settings (/settings/profile)', violations: results.violations });

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });

    test('Notification settings is accessible', async ({ page }) => {
      await page.goto('/settings/notifications');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.cl-userButton')
        .analyze();

      allViolations.push({ page: 'Notifications (/settings/notifications)', violations: results.violations });

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });

    test('Privacy settings is accessible', async ({ page }) => {
      await page.goto('/settings/privacy');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.cl-userButton')
        .analyze();

      allViolations.push({ page: 'Privacy Settings (/settings/privacy)', violations: results.violations });

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });
  });

  test.describe('Specific WCAG Criteria', () => {
    test('Color contrast meets AA standards', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();

      allViolations.push({ page: 'Color Contrast Check', violations: results.violations });

      // Allow some minor contrast issues but flag them
      const criticalContrast = results.violations.filter(v =>
        v.nodes.some(n => n.impact === 'critical' || n.impact === 'serious')
      );

      expect(criticalContrast).toHaveLength(0);
    });

    test('Images have alternative text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withRules(['image-alt'])
        .analyze();

      allViolations.push({ page: 'Image Alt Text Check', violations: results.violations });

      expect(results.violations).toHaveLength(0);
    });

    test('Form inputs have labels', async ({ page }) => {
      await page.goto('/sign-in');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withRules(['label', 'label-title-only'])
        .exclude('.cl-internal-element')
        .analyze();

      allViolations.push({ page: 'Form Labels Check', violations: results.violations });

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });

    test('Links have discernible text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withRules(['link-name'])
        .analyze();

      allViolations.push({ page: 'Link Text Check', violations: results.violations });

      expect(results.violations).toHaveLength(0);
    });

    test('Buttons have accessible names', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withRules(['button-name'])
        .analyze();

      allViolations.push({ page: 'Button Names Check', violations: results.violations });

      expect(results.violations).toHaveLength(0);
    });

    test('Page has valid heading structure', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withRules(['heading-order', 'page-has-heading-one'])
        .analyze();

      allViolations.push({ page: 'Heading Structure Check', violations: results.violations });

      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    });

    test('ARIA attributes are valid', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withRules([
          'aria-valid-attr',
          'aria-valid-attr-value',
          'aria-roles',
          'aria-required-attr',
        ])
        .exclude('.cl-userButton')
        .analyze();

      allViolations.push({ page: 'ARIA Validation', violations: results.violations });

      expect(results.violations).toHaveLength(0);
    });

    test('Focus order is logical', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withRules(['tabindex', 'focus-order-semantics'])
        .analyze();

      allViolations.push({ page: 'Focus Order Check', violations: results.violations });

      expect(results.violations).toHaveLength(0);
    });
  });

  test.describe('Interactive Components', () => {
    test.use({ storageState: 'tests/e2e/.auth/user.json' });

    test('Dialog components are accessible', async ({ page }) => {
      await page.goto('/settings/privacy');
      await page.waitForLoadState('networkidle');

      // Trigger a dialog
      const exportButton = page.locator('button:has-text("Export")').first();
      if (await exportButton.isVisible()) {
        await exportButton.click();
        await page.waitForTimeout(500);

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();

        allViolations.push({ page: 'Dialog Accessibility', violations: results.violations });

        expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);

        // Close dialog
        await page.keyboard.press('Escape');
      }
    });

    test('Toast notifications are accessible', async ({ page }) => {
      await page.goto('/settings/privacy');
      await page.waitForLoadState('networkidle');

      // Trigger an action that shows toast
      const exportButton = page.locator('button:has-text("Export")').first();
      if (await exportButton.isVisible()) {
        await exportButton.click();
        await page.waitForTimeout(500);

        const confirmButton = page.locator('button:has-text("Request")').first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(1000);

          const results = await new AxeBuilder({ page })
            .include('[class*="toast"], [role="alert"], [role="status"]')
            .analyze();

          allViolations.push({ page: 'Toast Accessibility', violations: results.violations });

          expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
        }
      }
    });
  });
});
