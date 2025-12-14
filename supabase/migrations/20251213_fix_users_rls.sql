-- Fix RLS policies for users table to allow updates
-- Drop existing policies to be safe
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Re-create policies with explicit permissions
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = auth_id);

-- Allow users to update their own profile
-- Using USING for the row selection and WITH CHECK to validate the new row
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (auth.uid() = auth_id)
    WITH CHECK (auth.uid() = auth_id);

-- Also ensure INSERT permission is there if needed (handled by trigger usually, but good to have if manual)
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = auth_id);
