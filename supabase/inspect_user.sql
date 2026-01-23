-- ============================================
-- INSPECT USER DATA
-- ============================================

-- Check public.users for the email
SELECT id, email, role, created_at 
FROM public.users 
WHERE email ILIKE '%abbasanwar285%';

-- Check auth.users for the email
SELECT id, email, created_at 
FROM auth.users 
WHERE email ILIKE '%abbasanwar285%';
