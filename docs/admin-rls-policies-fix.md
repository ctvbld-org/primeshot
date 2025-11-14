# Admin Dashboard RLS Policies Fix

## Issue
The admin dashboard was showing incorrect counts because Row Level Security (RLS) policies prevented admin users from viewing data across all users:
- **User Analytics**: Showed only 1 user (the logged-in admin)
- **Subscription Analytics**: Showed only 1 subscription (the admin's subscription)
- **Revenue Analytics**: Incomplete data due to RLS restrictions
- **Usage Analytics**: Incomplete data due to RLS restrictions
- **Waitlist Widget**: Could not view all waitlist entries

## Root Cause
The RLS policies on various tables only allowed users to view their own data:
- `users` table: `auth.uid() = id` (users can only see themselves)
- `user_subscriptions` table: `auth.uid() = user_id` (users can only see their own subscriptions)
- Similar restrictions on other tables

**Exception**: The "Top Users" leaderboard worked correctly because it used a `SECURITY DEFINER` RPC function (`get_top_users_by_generations()`), which bypasses RLS.

## Solution
Created migrations to add permissive RLS policies allowing users with `admin = true` to SELECT from all relevant tables.

### Key Innovation: SECURITY DEFINER Function
To avoid infinite recursion (which occurs when a policy on the `users` table queries the `users` table), we created a `SECURITY DEFINER` function:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND admin = true
  );
$$;
```

This function:
- Executes with elevated privileges (bypasses RLS)
- Returns a simple boolean
- Prevents recursion when used in policies

### Tables with New Admin Policies:
1. **`public.users`** - "Admins can view all users"
2. **`public.user_subscriptions`** - "Admins can view all subscriptions"
3. **`public.inference_jobs`** - "Admins can view all inference jobs"
4. **`public.training_jobs`** - "Admins can view all training jobs"
5. **`public.credit_pack_purchases`** - "Admins can view all credit pack purchases"
6. **`public.user_credits`** - "Admins can view all user credits"
7. **`public.waitlist`** - "Admins can view all waitlist signups"

### Policy Pattern
All policies use the `is_admin()` function:

```sql
CREATE POLICY "Admins can view all [table]"
ON "public".[table_name]
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (is_admin());
```

This approach is safe from infinite recursion because `is_admin()` executes with `SECURITY DEFINER` privileges.

## Security Considerations
- Policies are **permissive** (additive with existing policies)
- Only allows **SELECT** operations (read-only)
- Only applies to **authenticated** users
- Requires explicit `admin = true` flag in user record
- Existing user policies remain unchanged (users can still view their own data)

## Testing
After applying the migration:
1. Log in to the admin dashboard as an admin user
2. Verify the User Analytics card shows the correct total user count
3. Verify the Subscription Distribution chart shows all subscriptions
4. Verify the Revenue Analytics shows complete data
5. Verify the Usage Analytics shows all jobs
6. Verify the Waitlist Widget shows all entries

## Files Modified
- `supabase/migrations/20251114000050_rollback_broken_admin_policies.sql` (created - removes broken policies)
- `supabase/migrations/20251114000100_add_admin_rls_policies.sql` (created - correct implementation with SECURITY DEFINER)

## Deployment
The migration has been applied to the **staging** environment. To apply to production:

```bash
# Connect to production
supabase link --project-ref [production-ref]

# Apply migration
supabase db push
```

## Alternative Approaches Considered
1. **SECURITY DEFINER RPC Functions** (like Top Users): Would work but requires code changes and creates multiple RPC functions
2. **Server-side API Endpoints**: More complex, adds unnecessary abstraction layer
3. **Service Role in Dashboard**: Security risk, exposes service role key to client

The chosen approach (Admin RLS Policies) is the cleanest and most maintainable solution.

