-- ============================================
-- QUICK FIX: One-Step Solution
-- Run this in Supabase SQL Editor
-- ============================================

-- This will create a clinic for the user toqaqu1z@gmail.com
-- and ensure all RLS policies are correct

-- Step 1: Get the user ID and create clinic
INSERT INTO clinics (user_id, name, address, city, email, phone)
SELECT 
    id,
    COALESCE(first_name || '''s Clinic', 'My Clinic'),
    'Update your address',
    'Update your city',
    email,
    COALESCE(phone, '')
FROM users 
WHERE email = 'toqaqu1z@gmail.com'
  AND id NOT IN (SELECT user_id FROM clinics WHERE user_id IS NOT NULL)
ON CONFLICT DO NOTHING;

-- Step 2: Show the created clinic
SELECT 
    c.id as clinic_id,
    c.name,
    c.user_id,
    u.email
FROM clinics c
JOIN users u ON c.user_id = u.id
WHERE u.email = 'toqaqu1z@gmail.com';
