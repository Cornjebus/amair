import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

/**
 * VoiceSelector Component Tests - Amari Theme Migration (TERRACOTTA Accent)
 *
 * TDD: These tests define the expected behavior AFTER migration.
 * They will FAIL initially and pass after Phase 4 migration.
 *
 * VoiceSelector uses TERRACOTTA as its primary accent color.
 */
describe('VoiceSelector - Amari Theme Migration (Terracotta)', () => {
  const componentPath = path.resolve(process.cwd(), 'components/story/voice-selector.tsx')

  describe('Legacy Color Absence (Static Analysis)', () => {
    it('component source should not contain lavender classes', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      // Check for ANY lavender reference
      expect(source).not.toContain('lavender-')
      expect(source).not.toContain('border-lavender')
      expect(source).not.toContain('bg-lavender')
      expect(source).not.toContain('text-lavender')
    })

    it('component source should not use font-playfair', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).not.toContain('font-playfair')
    })
  })

  describe('Terracotta Accent Color Usage', () => {
    it('should use amari-terracotta for trigger button styling', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      // Trigger should have terracotta accent
      expect(source).toContain('amari-terracotta')
    })

    it('should use amari-terracotta for selected state', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      // Selected voice card should use terracotta
      expect(source).toMatch(/border-amari-terracotta|bg-amari-terracotta/)
    })

    it('should use amari-rose for premium badge accent', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      // Premium voices should have rose accent
      expect(source).toContain('amari-rose')
    })
  })

  describe('Typography Migration', () => {
    it('should use font-display instead of font-playfair', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      // Should use new font-display class for headings
      expect(source).toContain('font-display')
    })

    it('should use amari-charcoal for primary text', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).toContain('amari-charcoal')
    })

    it('should use amari-muted for secondary text', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).toContain('amari-muted')
    })
  })

  describe('Border and Background Migration', () => {
    it('should use amari-sand for borders', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).toContain('amari-sand')
    })
  })
})
