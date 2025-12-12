-- ============================================
-- FIX: Clinics Table RLS Policies
-- Run this in Supabase SQL Editor to fix the "new row violates row-level security policy" error.
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts (optional, but safer for re-running)
DROP POLICY IF EXISTS "Users can view own clinic" ON clinics;
DROP POLICY IF EXISTS "Users can update own clinic" ON clinics;
DROP POLICY IF EXISTS "Users can insert own clinic" ON clinics;
DROP POLICY IF EXISTS "Anyone can view verified clinics" ON clinics;

-- 1. Users can view their own clinic profile
CREATE POLICY "Users can view own clinic" ON clinics
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- 2. Users can update their own clinic profile
CREATE POLICY "Users can update own clinic" ON clinics
    FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- 3. Users can insert their own clinic profile (This is the one causing your error)
CREATE POLICY "Users can insert own clinic" ON clinics
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- 4. Public can view verified clinics
CREATE POLICY "Anyone can view verified clinics" ON clinics
    FOR SELECT USING (verified = true);
