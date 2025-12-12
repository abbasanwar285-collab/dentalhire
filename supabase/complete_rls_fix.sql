-- ============================================
-- Complete RLS Fix for Clinics and Jobs Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Fix CLINICS Table RLS
-- ============================================

-- Drop all existing clinics policies
DROP POLICY IF EXISTS "Anyone can view clinic data" ON clinics;
DROP POLICY IF EXISTS "Anyone can view clinics" ON clinics;
DROP POLICY IF EXISTS "Public read access to clinics" ON clinics;
DROP POLICY IF EXISTS "Clinics can view own profile" ON clinics;
DROP POLICY IF EXISTS "Clinics can update own profile" ON clinics;
DROP POLICY IF EXISTS "Clinics can insert own profile" ON clinics;
DROP POLICY IF EXISTS "Users can insert own clinic" ON clinics;
DROP POLICY IF EXISTS "Users can view own clinic" ON clinics;
DROP POLICY IF EXISTS "Users can update own clinic" ON clinics;
DROP POLICY IF EXISTS "Users can create clinic" ON clinics;
DROP POLICY IF EXISTS "Users can delete own clinic" ON clinics;

-- Allow public read access to all clinics (needed for job listings)
CREATE POLICY "Anyone can view clinics" ON clinics
    FOR SELECT USING (true);

-- Allow authenticated users to insert their own clinic
CREATE POLICY "Users can create clinic" ON clinics
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Allow users to update their own clinic
CREATE POLICY "Users can update own clinic" ON clinics
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Allow users to delete their own clinic
CREATE POLICY "Users can delete own clinic" ON clinics
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

-- ============================================
-- STEP 2: Fix JOBS Table RLS
-- ============================================

-- Drop all existing jobs policies
DROP POLICY IF EXISTS "Anyone can view active jobs" ON jobs;
DROP POLICY IF EXISTS "Clinics can manage own jobs" ON jobs;
DROP POLICY IF EXISTS "Clinics can view own jobs" ON jobs;
DROP POLICY IF EXISTS "Clinics can insert own jobs" ON jobs;
DROP POLICY IF EXISTS "Clinics can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Clinics can delete own jobs" ON jobs;

-- Allow anyone to view active jobs
CREATE POLICY "Anyone can view active jobs" ON jobs
    FOR SELECT USING (status = 'active');

-- Allow clinics to view ALL their own jobs (including non-active)
CREATE POLICY "Clinics can view own jobs" ON jobs
    FOR SELECT USING (
        clinic_id IN (
            SELECT c.id FROM clinics c
            JOIN users u ON c.user_id = u.id
            WHERE u.auth_id = auth.uid()
        )
    );

-- Allow clinics to insert jobs for their own clinic
CREATE POLICY "Clinics can insert own jobs" ON jobs
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT c.id FROM clinics c
            JOIN users u ON c.user_id = u.id
            WHERE u.auth_id = auth.uid()
        )
    );

-- Allow clinics to update their own jobs
CREATE POLICY "Clinics can update own jobs" ON jobs
    FOR UPDATE USING (
        clinic_id IN (
            SELECT c.id FROM clinics c
            JOIN users u ON c.user_id = u.id
            WHERE u.auth_id = auth.uid()
        )
    );

-- Allow clinics to delete their own jobs
CREATE POLICY "Clinics can delete own jobs" ON jobs
    FOR DELETE USING (
        clinic_id IN (
            SELECT c.id FROM clinics c
            JOIN users u ON c.user_id = u.id
            WHERE u.auth_id = auth.uid()
        )
    );

-- ============================================
-- STEP 3: Verify Policies
-- ============================================

-- Show all policies on clinics table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('clinics', 'jobs');
