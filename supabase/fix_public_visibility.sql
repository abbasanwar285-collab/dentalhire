-- ============================================
-- Fix Public Visibility for Jobs & Clinics
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure PUBLIC can see ALL clinics
-- (Crucial for the 'inner join' in the jobs query to work)
DROP POLICY IF EXISTS "Anyone can view clinics" ON clinics;
CREATE POLICY "Anyone can view clinics" ON clinics
    FOR SELECT USING (true);

-- 2. Ensure PUBLIC can see ACTIVE jobs
DROP POLICY IF EXISTS "Anyone can view active jobs" ON jobs;
CREATE POLICY "Anyone can view active jobs" ON jobs
    FOR SELECT USING (status = 'active');

-- 3. Verify polices are active
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('clinics', 'jobs');
