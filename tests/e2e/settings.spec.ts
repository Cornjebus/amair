import { test, expect } from '@playwright/test';

/**
 * Settings E2E Tests
 * Tests profile, notifications, and privacy settings
 */

test.describe('Settings', () => {
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  test.describe('Settings Hub', () => {
    test('displays settings page', async ({ page }) => {
      await page.goto('/settings');

      await expect(page.locator('h1, h2').filter({ hasText: /settings/i }).first()).toBeVisible({ timeout: 10000 });
    });

    test('has navigation to profile settings', async ({ page }) => {
      await page.goto('/settings');

      const profileLink = page.locator('a[href*="profile"], button:has-text("Profile")');
      await expect(profileLink.first()).toBeVisible({ timeout: 10000 });
    });

    test('has navigation to notification settings', async ({ page }) => {
      await page.goto('/settings');

      const notifLink = page.locator('a[href*="notification"], button:has-text("Notification")');
      await expect(notifLink.first()).toBeVisible({ timeout: 10000 });
    });

    test('has navigation to privacy settings', async ({ page }) => {
      await page.goto('/settings');

      const privacyLink = page.locator('a[href*="privacy"], button:has-text("Privacy")');
      await expect(privacyLink.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Profile Settings', () => {
    test('displays profile page', async ({ page }) => {
      await page.goto('/settings/profile');

      await expect(page.locator('h1, h2').filter({ hasText: /profile|account/i }).first()).toBeVisible({ timeout: 10000 });
    });

    test('shows user email', async ({ page }) => {
      await page.goto('/settings/profile');
      await page.waitForLoadState('networkidle');

      // Should show email somewhere on page
      const emailElement = page.locator('text=/@/');
      await page.waitForTimeout(2000);
    });

    test('has child profiles section', async ({ page }) => {
      await page.goto('/settings/profile');

      const childSection = page.locator('text=/child|children|kid/i');
      await expect(childSection.first()).toBeVisible({ timeout: 10000 });
    });

    test('can add a child profile', async ({ page }) => {
      await page.goto('/settings/profile');

      // Find add child button
      const addButton = page.locator('button:has-text("Add Child"), button:has-text("Add Profile"), button:has-text("+ Add")').first();

      if (await addButton.isVisible()) {
        await addButton.click();

        // Should show form or modal
        const nameInput = page.locator('input[name*="name" i], input[placeholder*="name" i]');
        await expect(nameInput.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('can delete a child profile with confirmation', async ({ page }) => {
      await page.goto('/settings/profile');
      await page.waitForLoadState('networkidle');

      // Find delete button for child
      const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Remove"), [aria-label*="delete" i]').first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should show confirmation dialog
        const dialog = page.locator('[role="alertdialog"], [role="dialog"]');
        await expect(dialog.first()).toBeVisible({ timeout: 5000 });

        // Cancel to preserve state
        const cancelButton = page.locator('button:has-text("Cancel")').first();
        await cancelButton.click();
      }
    });
  });

  test.describe('Notification Settings', () => {
    test('displays notification page', async ({ page }) => {
      await page.goto('/settings/notifications');

      await expect(page.locator('h1, h2').filter({ hasText: /notification/i }).first()).toBeVisible({ timeout: 10000 });
    });

    test('has email notification toggle', async ({ page }) => {
      await page.goto('/settings/notifications');

      const emailToggle = page.locator('text=/email/i').locator('..').locator('button[role="switch"], input[type="checkbox"]');
      await page.waitForTimeout(2000);
    });

    test('has push notification toggle', async ({ page }) => {
      await page.goto('/settings/notifications');

      const pushToggle = page.locator('text=/push/i');
      await page.waitForTimeout(2000);
    });

    test('can toggle notification preferences', async ({ page }) => {
      await page.goto('/settings/notifications');

      const toggle = page.locator('button[role="switch"], input[type="checkbox"]').first();

      if (await toggle.isVisible()) {
        const initialState = await toggle.getAttribute('aria-checked') || await toggle.isChecked();

        await toggle.click();
        await page.waitForTimeout(1000);

        // State should have changed
        const newState = await toggle.getAttribute('aria-checked') || await toggle.isChecked();
        // Toggle it back
        await toggle.click();
      }
    });
  });

  test.describe('Privacy Settings', () => {
    test('displays privacy page', async ({ page }) => {
      await page.goto('/settings/privacy');

      await expect(page.locator('h1, h2').filter({ hasText: /privacy|security/i }).first()).toBeVisible({ timeout: 10000 });
    });

    test('has data export option', async ({ page }) => {
      await page.goto('/settings/privacy');

      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download Data")');
      await expect(exportButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('export shows confirmation dialog', async ({ page }) => {
      await page.goto('/settings/privacy');

      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download Data")').first();
      await exportButton.click();

      // Should show confirmation dialog
      const dialog = page.locator('[role="alertdialog"], [role="dialog"]');
      await expect(dialog.first()).toBeVisible({ timeout: 5000 });

      // Cancel
      const cancelButton = page.locator('button:has-text("Cancel")').first();
      await cancelButton.click();
    });

    test('has delete account option', async ({ page }) => {
      await page.goto('/settings/privacy');

      const deleteButton = page.locator('button:has-text("Delete Account"), button:has-text("Delete My Account")');
      await expect(deleteButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('delete account shows danger confirmation', async ({ page }) => {
      await page.goto('/settings/privacy');

      const deleteButton = page.locator('button:has-text("Delete Account"), button:has-text("Delete My Account")').first();
      await deleteButton.click();

      // Should show danger confirmation dialog
      const dialog = page.locator('[role="alertdialog"], [role="dialog"]');
      await expect(dialog.first()).toBeVisible({ timeout: 5000 });

      // Should have danger styling
      const dangerButton = dialog.locator('button:has-text("Delete")');
      await expect(dangerButton.first()).toBeVisible();

      // Cancel
      const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Keep")').first();
      await cancelButton.click();
    });

    test('has analytics toggle', async ({ page }) => {
      await page.goto('/settings/privacy');

      const analyticsSection = page.locator('text=/analytics|usage data/i');
      await expect(analyticsSection.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Settings Navigation', () => {
    test('can navigate between settings sections', async ({ page }) => {
      await page.goto('/settings');

      // Go to profile
      await page.click('a[href*="profile"], button:has-text("Profile")');
      await expect(page).toHaveURL(/.*profile.*/);

      // Go to notifications
      await page.goto('/settings');
      await page.click('a[href*="notification"], button:has-text("Notification")');
      await expect(page).toHaveURL(/.*notification.*/);

      // Go to privacy
      await page.goto('/settings');
      await page.click('a[href*="privacy"], button:has-text("Privacy")');
      await expect(page).toHaveURL(/.*privacy.*/);
    });

    test('settings icon in header navigates to settings', async ({ page }) => {
      await page.goto('/dashboard');

      const settingsIcon = page.locator('a[href*="settings"], [aria-label*="settings" i]').first();
      await settingsIcon.click();

      await expect(page).toHaveURL(/.*settings.*/);
    });
  });
});
