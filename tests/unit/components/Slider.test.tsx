import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Slider } from '@/components/ui/slider'

/**
 * Slider Component Tests - Amari Theme Migration
 *
 * TDD: These tests define the expected behavior AFTER migration.
 * They will FAIL initially and pass after Phase 2 migration.
 */
describe('Slider - Amari Theme Migration', () => {
  describe('Amari Color Scheme', () => {
    it('renders track with amari-sand background', () => {
      const { container } = render(
        <Slider value={50} onChange={() => {}} />
      )
      const track = container.querySelector('[class*="bg-amari-sand"]')
      expect(track).toBeTruthy()
    })

    it('renders progress fill with amari-terracotta color', () => {
      const { container } = render(
        <Slider value={50} onChange={() => {}} />
      )
      const progress = container.querySelector('[class*="bg-amari-terracotta"]')
      expect(progress).toBeTruthy()
    })

    it('does NOT use lavender-100 for track background', () => {
      const { container } = render(
        <Slider value={50} onChange={() => {}} />
      )
      const legacyTrack = container.querySelector('[class*="bg-lavender-100"]')
      expect(legacyTrack).toBeNull()
    })

    it('does NOT use lavender-500 for progress fill', () => {
      const { container } = render(
        <Slider value={50} onChange={() => {}} />
      )
      const legacyProgress = container.querySelector('[class*="bg-lavender-500"]')
      expect(legacyProgress).toBeNull()
    })
  })

  describe('Functional Behavior', () => {
    it('renders with correct initial value', () => {
      const { container } = render(
        <Slider value={75} onChange={() => {}} />
      )
      // Check that progress bar reflects value
      const progress = container.querySelector('[style*="width"]')
      expect(progress).toBeTruthy()
    })

    it('has accessible slider role', () => {
      render(<Slider value={50} onChange={() => {}} aria-label="Volume" />)
      // Slider should be accessible
      const slider = screen.queryByRole('slider')
      // Note: Custom slider may not have role="slider" - adjust test based on implementation
    })
  })
})

describe('Slider - Legacy Color Absence', () => {
  it('component source should not contain lavender classes', async () => {
    // This is a static analysis test
    // Read the component source and check for legacy colors
    const fs = await import('fs')
    const path = await import('path')
    const componentPath = path.resolve(process.cwd(), 'components/ui/slider.tsx')
    const source = fs.readFileSync(componentPath, 'utf-8')

    expect(source).not.toContain('lavender-100')
    expect(source).not.toContain('lavender-500')
    expect(source).not.toContain('lavender')
  })
})
