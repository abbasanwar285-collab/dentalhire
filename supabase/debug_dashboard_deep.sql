-- Deep Debug Clinic Dashboard Stats
-- Run this in Supabase SQL Editor

-- Step 1: Count all active CVs (should match "Total Candidates")
SELECT COUNT(*) as active_cvs_count FROM cvs WHERE status = 'active';

-- Step 2: List all clinics and their user_id
SELECT id, user_id, name, favorites FROM clinics LIMIT 10;

-- Step 3: Find the specific user you're logging in as
-- Replace 'your_email@example.com' with the actual email
SELECT id, auth_id, email, role, user_type FROM users WHERE role = 'clinic' LIMIT 5;

-- Step 4: Check if the clinic profile is linked to the user
-- If this returns 0 rows, the clinic dashboard will show zeros
SELECT c.* FROM clinics c
JOIN users u ON c.user_id = u.id
WHERE u.role = 'clinic'
LIMIT 5;

-- Step 5: Check RLS policies for cvs table
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'cvs';

-- Step 6: Check RLS policies for clinics table  
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clinics';

-- Step 7: Debug specific user - replace with YOUR clinic user's email
-- Example: Replace 'clinic@example.com' with the actual clinic email
/*
SELECT 
    u.id as user_id,
    u.auth_id,
    u.email,
    c.id as clinic_id,
    c.name as clinic_name,
    array_length(c.favorites, 1) as favorites_count
FROM users u
LEFT JOIN clinics c ON c.user_id = u.id
WHERE u.email = 'clinic@example.com';
*/
