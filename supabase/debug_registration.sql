-- ============================================
-- DentalHire - Debug Registration Issue
-- Run this to check for existing users and errors
-- ============================================

-- 1. Check if the email already exists in users table (duplicate check)
-- Replace 'starbinbar@gmail.com' with the email you're trying to use
SELECT * FROM public.users WHERE email = 'starbinbar@gmail.com';

-- 2. Check all user types currently in the enum
SELECT enum_range(NULL::user_type) AS all_user_types;

-- 3. Check all user roles currently in the enum
SELECT enum_range(NULL::user_role) AS all_user_roles;

-- 4. Check the trigger function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 5. Check if trigger exists
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 6. If there's a duplicate user, delete it to allow re-registration:
-- UNCOMMENT THE LINE BELOW ONLY IF STEP 1 SHOWS A RESULT
-- DELETE FROM public.users WHERE email = 'starbinbar@gmail.com';
