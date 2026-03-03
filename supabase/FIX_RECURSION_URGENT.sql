-- ============================================
-- FIX: Remove Recursive Admin Policy
-- Run this IMMEDIATELY in Supabase SQL Editor
-- ============================================

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Verify the fix
SELECT 'Recursive policy removed successfully!' AS status;
SELECT policyname FROM pg_policies WHERE tablename = 'users';
