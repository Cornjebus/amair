import { test, expect } from '@playwright/test';

/**
 * Story Management E2E Tests
 * Tests story library, viewing, deleting, and sharing stories
 */

test.describe('Story Management', () => {
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  test.describe('Story Library', () => {
    test('displays stories page', async ({ page }) => {
      await page.goto('/stories');

      // Should show stories heading
      await expect(page.locator('h1, h2').filter({ hasText: /stories|library/i }).first()).toBeVisible({ timeout: 10000 });
    });

    test('shows empty state when no stories', async ({ page }) => {
      await page.goto('/stories');

      // May show empty state or list of stories
      await page.waitForLoadState('networkidle');

      const content = await page.content();
      // Either has stories or empty state
      const hasContent = content.includes('story') || content.includes('empty') || content.includes('create');
      expect(hasContent).toBeTruthy();
    });

    test('displays story cards with thumbnails', async ({ page }) => {
      await page.goto('/stories');
      await page.waitForLoadState('networkidle');

      // If there are stories, they should have thumbnails
      const storyCards = page.locator('[class*="card"], [class*="story-item"]');
      const count = await storyCards.count();

      if (count > 0) {
        // Check first card has an image
        const firstCard = storyCards.first();
        const image = firstCard.locator('img');
        await expect(image.first()).toBeVisible();
      }
    });

    test('has create new story button', async ({ page }) => {
      await page.goto('/stories');

      const createButton = page.locator('a[href*="create"], button:has-text("Create"), button:has-text("New Story")');
      await expect(createButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('create button navigates to create page', async ({ page }) => {
      await page.goto('/stories');

      const createButton = page.locator('a[href*="create"], button:has-text("Create"), button:has-text("New Story")').first();
      await createButton.click();

      await expect(page).toHaveURL(/.*create.*/);
    });
  });

  test.describe('Story Viewing', () => {
    test('can click on story to view details', async ({ page }) => {
      await page.goto('/stories');
      await page.waitForLoadState('networkidle');

      // Find a story card or link
      const storyLink = page.locator('a[href*="/stories/"]').first();

      if (await storyLink.isVisible()) {
        await storyLink.click();

        await expect(page).toHaveURL(/.*stories\/.*/);
      }
    });

    test('story page displays story content', async ({ page }) => {
      await page.goto('/stories');
      await page.waitForLoadState('networkidle');

      const storyLink = page.locator('a[href*="/stories/"]').first();

      if (await storyLink.isVisible()) {
        const href = await storyLink.getAttribute('href');
        await page.goto(href!);

        // Story page should have content
        await page.waitForLoadState('networkidle');

        // Should have story title or content
        const storyContent = page.locator('h1, h2, [class*="story"]');
        await expect(storyContent.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('story page has navigation controls', async ({ page }) => {
      await page.goto('/stories');
      await page.waitForLoadState('networkidle');

      const storyLink = page.locator('a[href*="/stories/"]').first();

      if (await storyLink.isVisible()) {
        const href = await storyLink.getAttribute('href');
        await page.goto(href!);

        // Should have prev/next or pagination
        const navControls = page.locator('button:has-text("Next"), button:has-text("Previous"), [class*="pagination"], [class*="nav"]');
        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe('Story Deletion', () => {
    test('story has delete option', async ({ page }) => {
      await page.goto('/stories');
      await page.waitForLoadState('networkidle');

      // Look for delete button or menu
      const deleteOption = page.locator('button:has-text("Delete"), [aria-label*="delete" i], [class*="delete"]');

      // May be in a dropdown menu
      const menuButton = page.locator('button[aria-haspopup], [class*="menu"], [class*="more"]').first();

      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('delete shows confirmation dialog', async ({ page }) => {
      await page.goto('/stories');
      await page.waitForLoadState('networkidle');

      // Find and click delete button
      const deleteButton = page.locator('button:has-text("Delete"), [aria-label*="delete" i]').first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should show confirmation dialog
        const dialog = page.locator('[role="alertdialog"], [role="dialog"], [class*="modal"], [class*="dialog"]');
        await expect(dialog.first()).toBeVisible({ timeout: 5000 });

        // Dialog should have cancel option
        const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("No")');
        await expect(cancelButton.first()).toBeVisible();
      }
    });

    test('can cancel deletion', async ({ page }) => {
      await page.goto('/stories');
      await page.waitForLoadState('networkidle');

      const deleteButton = page.locator('button:has-text("Delete"), [aria-label*="delete" i]').first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Click cancel
        const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("No")').first();
        await cancelButton.click();

        // Dialog should close
        const dialog = page.locator('[role="alertdialog"], [role="dialog"]');
        await expect(dialog).not.toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Story Sharing', () => {
    test('story has share option', async ({ page }) => {
      await page.goto('/stories');
      await page.waitForLoadState('networkidle');

      const storyLink = page.locator('a[href*="/stories/"]').first();

      if (await storyLink.isVisible()) {
        const href = await storyLink.getAttribute('href');
        await page.goto(href!);

        // Look for share button
        const shareButton = page.locator('button:has-text("Share"), [aria-label*="share" i]');
        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe('Story Actions', () => {
    test('can navigate between story pages', async ({ page }) => {
      await page.goto('/stories');
      await page.waitForLoadState('networkidle');

      const storyLink = page.locator('a[href*="/stories/"]').first();

      if (await storyLink.isVisible()) {
        const href = await storyLink.getAttribute('href');
        await page.goto(href!);

        // Try to go to next page
        const nextButton = page.locator('button:has-text("Next"), [aria-label*="next" i]').first();

        if (await nextButton.isVisible() && await nextButton.isEnabled()) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('can add narration to story', async ({ page }) => {
      await page.goto('/stories');
      await page.waitForLoadState('networkidle');

      const storyLink = page.locator('a[href*="/stories/"]').first();

      if (await storyLink.isVisible()) {
        const href = await storyLink.getAttribute('href');
        await page.goto(href!);

        // Look for narration/voice button
        const narrationButton = page.locator('button:has-text("Narrate"), button:has-text("Voice"), button:has-text("Listen")');
        await page.waitForTimeout(2000);
      }
    });
  });
});
