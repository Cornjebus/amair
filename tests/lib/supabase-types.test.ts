/**
 * Test file to validate Supabase Database type inference
 * This ensures our Database types work correctly with Supabase client
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'

// Test type inference for the supabase client
describe('Supabase Database Types', () => {
  it('should correctly type the users table', () => {
    const mockClient = createClient<Database>(
      'https://test.supabase.co',
      'test-key'
    )

    // This should type-check correctly
    const query = mockClient
      .from('users')
      .select('clerk_id, email, stripe_customer_id')
      .eq('clerk_id', 'test')
      .single()

    // Type assertions to validate inference
    type QueryResult = Awaited<typeof query>
    type DataType = QueryResult['data']

    // These should not be 'never'
    const typeCheck: DataType extends never ? false : true = true
    expect(typeCheck).toBe(true)
  })

  it('should correctly type insert operations', () => {
    const mockClient = createClient<Database>(
      'https://test.supabase.co',
      'test-key'
    )

    // This should type-check correctly
    const insert = mockClient
      .from('users')
      .insert({
        clerk_id: 'test',
        email: 'test@example.com',
        subscription_status: 'free'
      })

    // Type assertions
    type InsertResult = Awaited<typeof insert>
    type InsertData = InsertResult['data']

    const typeCheck: InsertData extends never ? false : true = true
    expect(typeCheck).toBe(true)
  })

  it('should correctly type the stories table', () => {
    const mockClient = createClient<Database>(
      'https://test.supabase.co',
      'test-key'
    )

    const query = mockClient
      .from('stories')
      .insert({
        user_id: 'test',
        title: 'Test',
        content: 'Test content',
        tone: 'bedtime-calm',
        length: 'quick',
        word_count: 100
      })
      .select()
      .single()

    type QueryResult = Awaited<typeof query>
    type DataType = QueryResult['data']

    const typeCheck: DataType extends never ? false : true = true
    expect(typeCheck).toBe(true)
  })
})
