-- ============================================
-- Find and Fix Duplicate Clinics
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Find all clinics for your user
SELECT 
    c.id as clinic_id,
    c.name,
    c.user_id,
    u.email,
    u.auth_id,
    c.created_at
FROM clinics c
JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- Step 2: Find all jobs and their clinic IDs
SELECT 
    j.id as job_id,
    j.title,
    j.clinic_id,
    c.name as clinic_name,
    j.created_at
FROM jobs j
LEFT JOIN clinics c ON j.clinic_id = c.id
ORDER BY j.created_at DESC;

-- Step 3: If you see multiple clinics for the same user, 
-- you may need to:
-- a) Delete the duplicate clinic (keep the one with jobs)
-- b) Or update jobs to point to the correct clinic

-- To delete a specific duplicate clinic (replace CLINIC_ID_TO_DELETE):
-- DELETE FROM clinics WHERE id = 'CLINIC_ID_TO_DELETE';

-- To move jobs from old clinic to new clinic:
-- UPDATE jobs SET clinic_id = 'NEW_CLINIC_ID' WHERE clinic_id = 'OLD_CLINIC_ID';
