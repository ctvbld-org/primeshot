# Sign-In Issue Fix: Language Constraint Violation

## Issue Summary
Users were unable to sign in on production, receiving error:
```
error=server_error&error_code=unexpected_failure&error_description=Database+error+saving+new+user
```

## Root Cause
The `handle_new_user()` trigger function was trying to insert `'en-GB'` as the default language into `user_settings.preferred_language`, but the check constraint only accepts these values:
- `us, gb, cn, es, fr, pt, de, jp, it, nl` (or NULL)

The mismatch between the default value (`'en-GB'`) and the allowed values (`'gb'`) caused the constraint violation.

## Error Details
From auth logs:
```
ERROR: new row for relation "user_settings" violates check constraint "user_settings_preferred_language_check" (SQLSTATE 23514)
```

## Fix Applied
Changed the default language in the `handle_new_user()` trigger from `'en-GB'` to `'gb'` to match the check constraint.

### Files Modified
1. **`supabase/migrations/20251006031125_add_logging_to_handle_new_user.sql`**
   - Line 53: Changed default from `'en-GB'` to `'gb'`
   - Lines 68-71: Fixed logging bug (removed duplicate SQLERRM)

2. **`supabase/migrations/20251014000000_fix_handle_new_user_language_default.sql`** (new)
   - Migration to apply the fix to production

### Changes
```sql
-- Before (line 53)
_preferred_language := coalesce(
  NEW.raw_user_meta_data->>'preferred_language',
  NEW.raw_user_meta_data->>'locale',
  'en-GB'  -- ❌ This doesn't match the check constraint
);

-- After (line 53)
_preferred_language := coalesce(
  NEW.raw_user_meta_data->>'preferred_language',
  NEW.raw_user_meta_data->>'locale',
  'gb'  -- ✅ Fixed to match the check constraint
);
```

## Verification
✅ Migration applied successfully to production (project: `uwwmpfyhbakrxmlmkqut`)
✅ Function definition verified in production database
✅ Local migration file updated to match production

## Prevention
Future check constraint modifications should be validated against all code that inserts into those tables, especially:
- Trigger functions
- Default values
- Application-level inserts

## Testing
To verify the fix works:
1. Try signing in with Google OAuth on production
2. User should be created successfully with language set to `'gb'`
3. No "Database error saving new user" error should occur

## Related Files
- Migration: `supabase/migrations/20251006031125_add_logging_to_handle_new_user.sql`
- Fix Migration: `supabase/migrations/20251014000000_fix_handle_new_user_language_default.sql`
- Table: `public.user_settings`
- Trigger: `on_auth_user_created` on `auth.users`
- Function: `public.handle_new_user()`

