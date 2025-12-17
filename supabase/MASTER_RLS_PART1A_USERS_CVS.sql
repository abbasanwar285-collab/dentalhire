-- ============================================
-- MASTER RLS FIX - PART 1A: USERS & CVS
-- DentalHire Security Policies
-- Run this FIRST in Supabase SQL Editor
-- ============================================

-- ==================== USERS ====================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = auth_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_id);

-- Allow new user creation during registration
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- NOTE: Admin view policy removed to avoid infinite recursion
-- Admins should use service_role key or RPC functions for admin operations

-- ==================== CVS ====================
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own CV" ON cvs;
DROP POLICY IF EXISTS "Users can update own CV" ON cvs;
DROP POLICY IF EXISTS "Users can insert own CV" ON cvs;
DROP POLICY IF EXISTS "Users can delete own CV" ON cvs;
DROP POLICY IF EXISTS "Clinics can view active CVs" ON cvs;

-- Users can view their own CV
CREATE POLICY "Users can view own CV" ON cvs
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can update their own CV
CREATE POLICY "Users can update own CV" ON cvs
    FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can insert their own CV
CREATE POLICY "Users can insert own CV" ON cvs
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can delete their own CV
CREATE POLICY "Users can delete own CV" ON cvs
    FOR DELETE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Clinics can view active CVs
CREATE POLICY "Clinics can view active CVs" ON cvs
    FOR SELECT USING (status = 'active');

-- ==================== VERIFICATION ====================
SELECT 'Part 1A Complete - Users & CVs Fixed' AS status;
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('users', 'cvs') ORDER BY tablename;
