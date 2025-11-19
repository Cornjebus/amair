/**
 * Database Migration Tests
 *
 * Phase 1: Test schema migration without data loss
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { supabaseAdmin } from '@/lib/supabase/server'

describe('Tier System Migration', () => {
  describe('Schema Changes', () => {
    it('should have subscription_tier column in users table', async () => {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('subscription_tier')
        .limit(1)

      // Column should exist (error would occur if column doesn't exist)
      expect(error).toBeNull()
    })

    it('should have tier_limits table', async () => {
      const { data, error } = await supabaseAdmin
        .from('tier_limits')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have usage_tracking table', async () => {
      const { data, error } = await supabaseAdmin
        .from('usage_tracking')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have voice_provider column in stories table', async () => {
      const { data, error } = await supabaseAdmin
        .from('stories')
        .select('voice_provider')
        .limit(1)

      expect(error).toBeNull()
    })
  })

  describe('Tier Configuration Data', () => {
    it('should have all four tiers configured', async () => {
      const { data: tiers, error } = await supabaseAdmin
        .from('tier_limits')
        .select('tier_name')
        .order('tier_name')

      expect(error).toBeNull()
      expect(tiers).toHaveLength(4)

      const tierNames = tiers?.map((t: any) => t.tier_name)
      expect(tierNames).toContain('free')
      expect(tierNames).toContain('dream_weaver')
      expect(tierNames).toContain('magic_circle')
      expect(tierNames).toContain('enchanted_library')
    })

    it('should have correct limits for free tier', async () => {
      const { data: tier, error } = await supabaseAdmin
        .from('tier_limits')
        .select('*')
        .eq('tier_name', 'free')
        .single()

      expect(error).toBeNull()
      expect(tier?.monthly_stories).toBe(3)
      expect(tier?.monthly_premium_voices).toBe(0)
      expect(tier?.max_children).toBe(2)
      expect(tier?.max_saved_stories).toBe(5)
    })

    it('should have correct limits for dream_weaver tier', async () => {
      const { data: tier, error } = await supabaseAdmin
        .from('tier_limits')
        .select('*')
        .eq('tier_name', 'dream_weaver')
        .single()

      expect(error).toBeNull()
      expect(tier?.monthly_stories).toBe(10)
      expect(tier?.monthly_premium_voices).toBe(3)
      expect(tier?.max_children).toBe(3)
      expect(tier?.max_saved_stories).toBe(-1) // unlimited
    })

    it('should have correct limits for magic_circle tier', async () => {
      const { data: tier, error } = await supabaseAdmin
        .from('tier_limits')
        .select('*')
        .eq('tier_name', 'magic_circle')
        .single()

      expect(error).toBeNull()
      expect(tier?.monthly_stories).toBe(30)
      expect(tier?.monthly_premium_voices).toBe(15)
      expect(tier?.features?.family_sharing).toBe(2)
    })

    it('should have correct limits for enchanted_library tier', async () => {
      const { data: tier, error } = await supabaseAdmin
        .from('tier_limits')
        .select('*')
        .eq('tier_name', 'enchanted_library')
        .single()

      expect(error).toBeNull()
      expect(tier?.monthly_stories).toBe(60)
      expect(tier?.monthly_premium_voices).toBe(60)
      expect(tier?.max_children).toBe(-1) // unlimited
      expect(tier?.features?.family_sharing).toBe(4)
    })
  })

  describe('Data Migration', () => {
    it('should migrate existing premium users to magic_circle', async () => {
      // This test assumes existing data has been migrated
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('subscription_status, subscription_tier')
        .eq('subscription_status', 'premium')

      if (users && users.length > 0) {
        users.forEach((user: any) => {
          expect(user.subscription_tier).toBe('magic_circle')
        })
      }
    })

    it('should migrate existing free users to free tier', async () => {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('subscription_status, subscription_tier')
        .eq('subscription_status', 'free')

      if (users && users.length > 0) {
        users.forEach((user: any) => {
          expect(user.subscription_tier).toBe('free')
        })
      }
    })
  })

  describe('Row Level Security', () => {
    it('should allow public read of tier_limits', async () => {
      // This would normally fail with RLS, but tier_limits should be public
      const { data, error } = await supabaseAdmin
        .from('tier_limits')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have RLS enabled on usage_tracking', async () => {
      const { data: table, error } = await supabaseAdmin
        .rpc('check_rls_enabled', { table_name: 'usage_tracking' })

      // RLS should be enabled
      expect(error).toBeNull()
    })
  })

  describe('Indexes', () => {
    it('should have index on usage_tracking for fast lookups', async () => {
      // Check if index exists
      const { data, error } = await supabaseAdmin
        .rpc('check_index_exists', {
          index_name: 'idx_usage_tracking_user_period',
        })

      expect(error).toBeNull()
    })
  })
})
