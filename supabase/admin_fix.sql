-- ============================================
-- DentalHire - Final Dashboard Logic Fix
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create a Secure Admin Check Function (Bypasses RLS)
-- This fixes the "Recursion" issue where the admin check couldn't read the users table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE auth_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Admin Policies to use the new function

-- Users Directory
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (is_admin());

-- CVs
DROP POLICY IF EXISTS "Admins can view all cvs" ON cvs;
CREATE POLICY "Admins can view all cvs" ON cvs
    FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all cvs" ON cvs;
CREATE POLICY "Admins can update all cvs" ON cvs
    FOR UPDATE USING (is_admin());

-- Clinics
DROP POLICY IF EXISTS "Admins can view all clinics" ON clinics;
CREATE POLICY "Admins can view all clinics" ON clinics
    FOR SELECT USING (is_admin());

-- Jobs
DROP POLICY IF EXISTS "Admins can view all jobs" ON jobs;
CREATE POLICY "Admins can view all jobs" ON jobs
    FOR SELECT USING (is_admin());

-- Job Applications
DROP POLICY IF EXISTS "Admins can view all applications" ON job_applications;
CREATE POLICY "Admins can view all applications" ON job_applications
    FOR SELECT USING (is_admin());

-- Announcements
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements" ON announcements
    FOR ALL USING (is_admin());
