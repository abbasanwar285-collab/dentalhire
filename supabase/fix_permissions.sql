-- =================================================================
-- FIX: Grants permissions for Clinics to update their logo
-- and for Job Seekers to view Clinic details.
-- Run this in your Supabase SQL Editor.
-- =================================================================

-- 1. Allow Clinics (and other entities) to UPDATE their own clinic profile (e.g. logo, description)
DROP POLICY IF EXISTS "Users can update their own clinic details" ON clinics;
CREATE POLICY "Users can update their own clinic details" ON clinics
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 2. Allow Everyone (Job Seekers, etc.) to VIEW clinic profiles (for job cards, details)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON clinics;
CREATE POLICY "Public profiles are viewable by everyone" ON clinics
    FOR SELECT
    USING (true);

-- 3. Ensure RLS is enabled (just in case)
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
