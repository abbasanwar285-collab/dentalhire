-- ============================================
-- Fix RLS Policies for Jobs Table
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can view active jobs" ON jobs;
DROP POLICY IF EXISTS "Clinics can manage own jobs" ON jobs;

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
