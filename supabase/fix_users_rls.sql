-- ============================================
-- DentalHire - Fix RLS Policies for Users Table
-- Run this in Supabase SQL Editor
-- ============================================

-- First, drop existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view public user data" ON users;

-- Create new policies that work correctly

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth_id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth_id = auth.uid());

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth_id = auth.uid());

-- Also allow reading all users for matching purposes (public profiles)
CREATE POLICY "Anyone can view public user data" ON users
    FOR SELECT USING (true);

-- ============================================
-- Fix the handle_new_user trigger function
-- ============================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function that handles user metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        auth_id, 
        email, 
        first_name, 
        last_name, 
        role, 
        user_type
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'job_seeker')::user_role,
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'dental_assistant')::user_type
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
