# Post-Migration Steps

After running the database migration, you MUST regenerate TypeScript types.

## Required: Regenerate Database Types

```bash
# Option 1: Using Supabase CLI
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/supabase/database.types.ts

# Option 2: If linked locally
supabase gen types typescript --local > lib/supabase/database.types.ts
```

## Why This Is Critical

The migration adds new tables and columns:
- `subscription_tier` column on users
- `tier_limits` table
- `usage_tracking` table
- `voice_provider` column on stories

Without regenerating types, TypeScript will show errors because the types don't match the actual database schema.

## Verify Types Are Correct

After regenerating, check that these types exist in `lib/supabase/database.types.ts`:

```typescript
// Should have subscription_tier in users Row type
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          // ...existing fields...
          subscription_tier?: 'free' | 'dream_weaver' | 'magic_circle' | 'enchanted_library'
          stripe_subscription_id?: string | null
          subscription_period_start?: string | null
          current_period_end?: string | null
          // ...
        }
      }
      // Should have new tables
      tier_limits: {
        Row: {
          tier_name: string
          monthly_stories: number
          monthly_premium_voices: number
          // ...
        }
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          billing_period_start: string
          billing_period_end: string
          stories_generated: number
          premium_voices_used: number
          // ...
        }
      }
    }
  }
}
```

## Then Run Type Check

```bash
npm run type-check
# Should have 0 errors
```

## If Types Still Don't Match

1. Verify migration was applied:
   ```sql
   SELECT * FROM tier_limits;
   -- Should return 4 rows
   ```

2. Check table exists:
   ```sql
   \d usage_tracking
   -- Should show table structure
   ```

3. Re-run type generation with verbose flag:
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_REF --debug
   ```
