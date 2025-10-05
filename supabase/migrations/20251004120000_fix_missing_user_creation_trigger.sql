-- Fix missing trigger for automatic user creation
-- This trigger was missing, causing users not to be created in public.users table after signup

-- Create the main trigger that calls handle_new_user when a new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
