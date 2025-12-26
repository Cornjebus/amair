import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

/**
 * IllustrationGallery Component Tests - Amari Theme Migration
 *
 * TDD: These tests define the expected behavior AFTER migration.
 * They will FAIL initially and pass after Phase 5 migration.
 */
describe('IllustrationGallery - Amari Theme Migration', () => {
  const componentPath = path.resolve(process.cwd(), 'components/story/illustration-gallery.tsx')

  describe('Legacy Color Absence (Static Analysis)', () => {
    it('component source should not contain lavender classes', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).not.toContain('lavender-')
      expect(source).not.toContain('text-lavender')
      expect(source).not.toContain('border-lavender')
    })
  })

  describe('Amari Color Usage', () => {
    it('should use amari-charcoal for title text', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).toContain('amari-charcoal')
    })

    it('should use amari-muted for secondary text', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).toContain('amari-muted')
    })

    it('should use amari-sand for thumbnail borders', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).toContain('amari-sand')
    })

    it('should use amari-terracotta for hover/active states', () => {
      const source = fs.readFileSync(componentPath, 'utf-8')

      expect(source).toContain('amari-terracotta')
    })
  })
})
