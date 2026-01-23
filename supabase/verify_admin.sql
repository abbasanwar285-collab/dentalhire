-- ============================================
-- VERIFY ADMIN STATUS
-- ============================================

SELECT id, email, role 
FROM public.users 
WHERE email = 'abbasanwar285@gmail.com';
