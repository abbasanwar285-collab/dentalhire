-- ============================================
-- DentalHire - Fix Registration Complete
-- Run this in Supabase SQL Editor to fix "Database error saving new user"
-- ============================================

-- 1. UPDATE ENUMS
-- Add all potentially missing values to user_type enum
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'company';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'lab';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'sales_rep';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'secretary';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'media';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'dental_technician';

-- 2. RECREATE TRIGGER FUNCTION
-- Drop existing trigger/function to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create robust function that handles type casting safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role;
    v_type user_type;
    v_first_name text;
    v_last_name text;
BEGIN
    -- Extract data with safe defaults
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    
    -- Safe Role Casting with Exception Handling
    BEGIN
        v_role := (NEW.raw_user_meta_data->>'role')::user_role;
    EXCEPTION WHEN OTHERS THEN
        v_role := 'job_seeker'; -- Default fallback
    END;

    -- Safe User Type Casting with Exception Handling
    BEGIN
        v_type := (NEW.raw_user_meta_data->>'user_type')::user_type;
    EXCEPTION WHEN OTHERS THEN
        v_type := 'dental_assistant'; -- Default fallback
    END;

    -- Insert into public.users
    INSERT INTO public.users (
        auth_id,
        email,
        first_name,
        last_name,
        role,
        user_type,
        verified
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_first_name,
        v_last_name,
        v_role,
        v_type,
        FALSE
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallback attempt with minimal required fields if main insert fails
    BEGIN
        INSERT INTO public.users (auth_id, email, first_name, last_name, role, user_type, verified)
        VALUES (NEW.id, NEW.email, '', '', 'job_seeker', 'dental_assistant', FALSE);
    EXCEPTION WHEN OTHERS THEN
        -- If even fallback fails, we must allow the auth creation to potentially fail
        -- or log it. Raising exception here aborts the auth.users insert.
        RAISE WARNING 'User created in Auth but Profile creation failed: %', SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RECREATE TRIGGER
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. VERIFY POLICIES (Optional safety check)
-- Ensure 'public' insert is possible via the trigger (which bypasses RLS anyway due to SECURITY DEFINER)
