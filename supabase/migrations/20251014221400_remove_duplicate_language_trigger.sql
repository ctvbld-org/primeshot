-- Remove duplicate language initialization trigger
-- The init_user_language() function was conflicting with handle_new_user()
-- Both were trying to insert/update user_settings, causing constraint violations
-- handle_new_user() already handles user_settings initialization correctly

DROP TRIGGER IF EXISTS on_auth_user_created_language ON auth.users;
DROP FUNCTION IF EXISTS init_user_language();

