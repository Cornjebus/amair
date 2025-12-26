import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

/**
 * StyleSelector Component Tests - Amari Theme Migration (SAGE Accent)
 *
 * TDD: These tests define the expected behavior AFTER migration.
 * They will FAIL initially and pass after Phase 4 migration.
 *
 * StyleSelector uses SAGE as its primary accent color (differentiated from VoiceSelector).
 */
describe('StyleSelector - Amari Theme Migration (Sage)', () => {
  const componentPath = path.resolve(process.cwd(), 'components/story/style-selector.tsx')

  describe('Legacy Color Absence (Static Analysis)', () => {
    it('component source should not contain lavender classes', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).not.toContain('lavender-')
      expect(source).not.toContain('border-lavender')
      expect(source).not.toContain('bg-lavender')
      expect(source).not.toContain('text-lavender')
    })

    it('component source should not contain peach classes', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).not.toContain('peach-')
      expect(source).not.toContain('border-peach')
      expect(source).not.toContain('bg-peach')
    })

    it('component source should not use font-playfair', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).not.toContain('font-playfair')
    })
  })

  describe('Sage Accent Color Usage', () => {
    it('should use amari-sage for trigger button styling', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      // Trigger should have sage accent (different from VoiceSelector's terracotta)
      expect(source).toContain('amari-sage')
    })

    it('should use amari-sage for selected state', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      // Selected style card should use sage
      expect(source).toMatch(/border-amari-sage|bg-amari-sage/)
    })

    it('should use amari-terracotta as secondary accent', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      // Secondary accent for highlights
      expect(source).toContain('amari-terracotta')
    })
  })

  describe('Typography Migration', () => {
    it('should use font-display instead of font-playfair', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).toContain('font-display')
    })

    it('should use amari-charcoal for primary text', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).toContain('amari-charcoal')
    })
  })

  describe('Border and Background Migration', () => {
    it('should use amari-sand for borders', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).toContain('amari-sand')
    })
  })
})
