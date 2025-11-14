import { supabaseAdmin } from './server'

/**
 * Syncs a Clerk user to Supabase.
 * Creates the user if they don't exist, updates if they do.
 */
export async function syncUserToSupabase(clerkUserId: string, email: string) {
  // Check if user exists
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('clerk_id', clerkUserId)
    .single()

  if (existingUser) {
    return existingUser
  }

  // Create new user
  const { data: newUser, error } = await supabaseAdmin
    .from('users')
    .insert({
      clerk_id: clerkUserId,
      email: email,
      subscription_status: 'free',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user in Supabase:', error)
    throw new Error('Failed to create user')
  }

  return newUser
}
