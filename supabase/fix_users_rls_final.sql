-- ============================================
-- Fix USERS Table RLS (Crucial for other policies)
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on users table (if not already)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop generic/broken policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Public profile view" ON users;

-- 1. Allow users to view their OWN profile (Crucial for JOINs in other policies)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth_id = auth.uid());

-- 2. Allow users to update their OWN profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth_id = auth.uid());

-- 3. OPTIONAL: Allow public to view minimal profile info (for job seeker visibility)
-- This is often needed if you join users for public job listings
CREATE POLICY "Public profile view" ON users
    FOR SELECT USING (true); -- Or restrict columns if possible, but PG RLS is row-based.
    
-- ============================================
-- Verify proper access exists
-- ============================================
SELECT * FROM users WHERE auth_id = auth.uid();
