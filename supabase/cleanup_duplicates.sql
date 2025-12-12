-- ============================================
-- Cleanup Duplicate Clinics and Verify Data
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Show all clinics with their user info
SELECT 
    c.id as clinic_id,
    c.name as clinic_name,
    c.user_id,
    u.email,
    u.first_name,
    c.created_at
FROM clinics c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- STEP 2: Show all jobs with their clinic info
SELECT 
    j.id as job_id,
    j.title,
    j.clinic_id,
    j.status,
    j.created_at
FROM jobs j
ORDER BY j.created_at DESC;

-- STEP 3: Find the user ID for your current logged-in user
-- (Check the users table for your email)
SELECT id, auth_id, email, first_name, role 
FROM users 
WHERE role = 'clinic'
ORDER BY created_at DESC;

-- ============================================
-- AFTER REVIEWING THE ABOVE RESULTS:
-- If you see multiple clinics for the same user,
-- uncomment and run ONE of the fixes below
-- ============================================

-- FIX OPTION A: Delete ALL clinics and jobs for a fresh start
-- WARNING: This will delete all your posted jobs too!
-- DELETE FROM jobs;
-- DELETE FROM clinics;

-- FIX OPTION B: Keep only the most recent clinic
-- First, get the clinic ID you want to KEEP (the most recent one)
-- Then uncomment and modify:
-- DELETE FROM clinics WHERE id != 'YOUR_CLINIC_ID_TO_KEEP' AND user_id = 'YOUR_USER_ID';
