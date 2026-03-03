-- ============================================
-- Delete users by email
-- Run this in Supabase SQL Editor
-- ============================================

-- Delete from auth.users (this should cascade to public.users and other tables if foreign keys are set up correctly with ON DELETE CASCADE)
DELETE FROM auth.users 
WHERE email IN ('plustrader64@gmail.com', 'starbinbar@gmail.com');

-- If you need to manually clean up public.users (in case cascade isn't set)
DELETE FROM public.users 
WHERE email IN ('plustrader64@gmail.com', 'starbinbar@gmail.com');

-- Check result
SELECT email, id FROM auth.users WHERE email IN ('plustrader64@gmail.com', 'starbinbar@gmail.com');
