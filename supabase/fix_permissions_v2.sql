-- =================================================================
-- FIX V2: Grants permissions for Clinics to update their logo
-- Corrects the previous policy which compared UUIDs incorrectly.
-- Run this in your Supabase SQL Editor.
-- =================================================================

-- 1. Drop the incorrect policy if it exists
DROP POLICY IF EXISTS "Users can update their own clinic details" ON clinics;

-- 2. Create the CORRECT policy
-- Checks if the clinic belongs to the currently logged-in user (resolving auth_id -> user_id)
CREATE POLICY "Users can update their own clinic details" ON clinics
    FOR UPDATE
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- 3. Ensure public view policy is there (this one was likely fine, but good to ensure)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON clinics;
CREATE POLICY "Public profiles are viewable by everyone" ON clinics
    FOR SELECT
    USING (true);

-- 4. Ensure RLS is enabled
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
