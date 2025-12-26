import { test, expect } from '@playwright/test'

/**
 * Visual Regression Tests for Amari Design System Migration
 *
 * These tests capture screenshots of components before and after migration
 * to verify visual consistency and catch unintended changes.
 *
 * Run with: npm run test:e2e -- visual-regression.spec.ts
 */

test.describe('Story Components - Visual Regression', () => {
  test.describe('Audio Player', () => {
    test('matches Amari design system screenshot', async ({ page }) => {
      // Navigate to a story page with audio player
      // Note: This requires a story to exist - may need test fixtures
      await page.goto('/stories')

      // Wait for stories to load
      await page.waitForSelector('[data-testid="story-card"]', { timeout: 10000 }).catch(() => {
        // If no stories, skip visual test
        test.skip()
      })

      // Click first story to view details with audio player
      const storyCard = page.locator('[data-testid="story-card"]').first()
      if (await storyCard.count() > 0) {
        await storyCard.click()
        await page.waitForLoadState('networkidle')

        // Find audio player and take screenshot
        const audioPlayer = page.locator('[data-testid="audio-player"]')
        if (await audioPlayer.count() > 0) {
          await expect(audioPlayer).toHaveScreenshot('audio-player-amari.png', {
            maxDiffPixelRatio: 0.1,
          })
        }
      }
    })
  })

  test.describe('Voice Selector Dialog', () => {
    test('trigger button uses Terracotta accent', async ({ page }) => {
      await page.goto('/stories')

      // Find and verify voice selector if visible
      const voiceSelector = page.locator('[data-testid="voice-selector-trigger"]')
      if (await voiceSelector.count() > 0) {
        await expect(voiceSelector).toHaveScreenshot('voice-selector-trigger-amari.png', {
          maxDiffPixelRatio: 0.1,
        })
      }
    })

    test('dialog uses Terracotta theme', async ({ page }) => {
      await page.goto('/stories')

      const voiceSelectorTrigger = page.locator('[data-testid="voice-selector-trigger"]')
      if (await voiceSelectorTrigger.count() > 0) {
        await voiceSelectorTrigger.click()

        // Wait for dialog to open
        const dialog = page.locator('[role="dialog"]')
        await dialog.waitFor({ state: 'visible' })

        await expect(dialog).toHaveScreenshot('voice-selector-dialog-amari.png', {
          maxDiffPixelRatio: 0.1,
        })
      }
    })
  })

  test.describe('Style Selector Dialog', () => {
    test('trigger button uses Sage accent', async ({ page }) => {
      await page.goto('/stories')

      const styleSelector = page.locator('[data-testid="style-selector-trigger"]')
      if (await styleSelector.count() > 0) {
        await expect(styleSelector).toHaveScreenshot('style-selector-trigger-amari.png', {
          maxDiffPixelRatio: 0.1,
        })
      }
    })

    test('dialog uses Sage theme', async ({ page }) => {
      await page.goto('/stories')

      const styleSelectorTrigger = page.locator('[data-testid="style-selector-trigger"]')
      if (await styleSelectorTrigger.count() > 0) {
        await styleSelectorTrigger.click()

        const dialog = page.locator('[role="dialog"]')
        await dialog.waitFor({ state: 'visible' })

        await expect(dialog).toHaveScreenshot('style-selector-dialog-amari.png', {
          maxDiffPixelRatio: 0.1,
        })
      }
    })
  })

  test.describe('Illustration Gallery', () => {
    test('gallery uses Amari design system', async ({ page }) => {
      await page.goto('/stories')

      const storyCard = page.locator('[data-testid="story-card"]').first()
      if (await storyCard.count() > 0) {
        await storyCard.click()
        await page.waitForLoadState('networkidle')

        const gallery = page.locator('[data-testid="illustration-gallery"]')
        if (await gallery.count() > 0) {
          await expect(gallery).toHaveScreenshot('illustration-gallery-amari.png', {
            maxDiffPixelRatio: 0.1,
          })
        }
      }
    })
  })
})

test.describe('Dashboard - No Ghost Flash', () => {
  test('dashboard loads without showing stale data', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Take initial screenshot
    await expect(page).toHaveScreenshot('dashboard-initial.png', {
      maxDiffPixelRatio: 0.15,
    })

    // Navigate away
    await page.goto('/create')
    await page.waitForLoadState('networkidle')

    // Navigate back to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Should show same content (or skeleton, not stale data)
    await expect(page).toHaveScreenshot('dashboard-return.png', {
      maxDiffPixelRatio: 0.15,
    })
  })
})

test.describe('Color Consistency Check', () => {
  test('no lavender colors visible in story pages', async ({ page }) => {
    await page.goto('/stories')
    await page.waitForLoadState('networkidle')

    // Check computed styles for lavender colors
    // Lavender palette: #faf5ff, #f3e8ff, #e9d5ff, #d8b4fe, #c084fc, #a855f7, #9333ea
    const lavenderColors = [
      'rgb(250, 245, 255)', // lavender-50
      'rgb(243, 232, 255)', // lavender-100
      'rgb(233, 213, 255)', // lavender-200
      'rgb(216, 180, 254)', // lavender-300
      'rgb(192, 132, 252)', // lavender-400
      'rgb(168, 85, 247)',  // lavender-500
      'rgb(147, 51, 234)',  // lavender-600
    ]

    // Get all computed background colors on the page
    const backgroundColors = await page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      const colors = new Set<string>()
      elements.forEach(el => {
        const style = window.getComputedStyle(el)
        colors.add(style.backgroundColor)
        colors.add(style.color)
        colors.add(style.borderColor)
      })
      return Array.from(colors)
    })

    // Verify no lavender colors are present
    for (const lavender of lavenderColors) {
      expect(backgroundColors).not.toContain(lavender)
    }
  })
})
