-- ============================================
-- Fix Admin Role for specific user
-- ============================================

-- Updates the user's role to 'admin' based on their email
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'abbasanwar285@gmail.com';

-- Optional: Verify the update
SELECT * FROM public.users WHERE email = 'abbasanwar285@gmail.com';
