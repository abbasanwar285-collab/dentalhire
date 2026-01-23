-- ============================================
-- EMERGENCY PASSWORD RESET
-- ============================================

-- This script forces a new password for the specific user.
-- Use this ONLY when email delivery is not working.

UPDATE auth.users
SET encrypted_password = crypt('DentalHire2024!', gen_salt('bf'))
WHERE email = 'abbasanwar285@gmail.com';

-- Verify the update time changed
SELECT email, last_sign_in_at, updated_at 
FROM auth.users 
WHERE email = 'abbasanwar285@gmail.com';
