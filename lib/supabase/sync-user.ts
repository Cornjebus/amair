import { supabaseAdmin } from './server'

/**
 * Syncs a Clerk user to Supabase.
 * Creates the user if they don't exist, updates if they do.
 *
 * NOTE: New users start with 'free' status but NO stripe_subscription_id.
 * The app checks for an active subscription (stripe_subscription_id present)
 * before allowing access to features. Users must subscribe to a trial to use the app.
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

  // Create new user - requires subscription to use app
  // The absence of stripe_subscription_id indicates they need to subscribe
  const { data: newUser, error } = await supabaseAdmin
    .from('users')
    .insert({
      clerk_id: clerkUserId,
      email: email,
      subscription_status: 'free', // Will be updated to 'trial' or 'premium' after checkout
      // stripe_subscription_id is null - this indicates no active subscription
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user in Supabase:', error)
    throw new Error('Failed to create user')
  }

  return newUser
}
