import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

let supabaseAdminInstance: SupabaseClient<Database> | null = null

export const getSupabaseAdmin = (): SupabaseClient<Database> => {
  if (!supabaseAdminInstance) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
    }

    supabaseAdminInstance = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }
  return supabaseAdminInstance
}

// For backwards compatibility
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get: (target, prop) => {
    return getSupabaseAdmin()[prop as keyof SupabaseClient<Database>]
  }
})
