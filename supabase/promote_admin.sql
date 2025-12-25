
-- Promote user to Admin
-- Run this in Supabase SQL Editor

UPDATE public.users
SET role = 'admin'
WHERE email = 'tym2001lian@gmail.com';

-- Verify the change
SELECT id, email, role, first_name, last_name 
FROM public.users 
WHERE email = 'tym2001lian@gmail.com';
