-- ============================================
-- DentalHire - Fix Registration Trigger
-- Run this in Supabase SQL Editor to fix "Database error saving new user"
-- ============================================

-- 1. Drop existing trigger and function to ensure clean state
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Create a robust function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role;
    v_type user_type;
    v_first_name text;
    v_last_name text;
BEGIN
    -- Extract and validate data with safe defaults
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    
    -- Safe Role Casting
    BEGIN
        v_role := (NEW.raw_user_meta_data->>'role')::user_role;
    EXCEPTION WHEN OTHERS THEN
        v_role := 'job_seeker'; -- Default fallback
    END;

    -- Safe User Type Casting
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
    -- In case of any other error, log it (if possible) but try to succeed with minimal data
    -- or re-raise if it's critical. For Auth triggers, raising an error aborts signup.
    -- We'll try one last fallback insert if the main one failed.
    BEGIN
        INSERT INTO public.users (auth_id, email, first_name, last_name, role, user_type)
        VALUES (NEW.id, NEW.email, '', '', 'job_seeker', 'dental_assistant');
    EXCEPTION WHEN OTHERS THEN
        -- If even fallback fails, raise the original error to let Supabase Auth know
        RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Ensure RLS doesn't block the trigger (SECURITY DEFINER bypasses RLS, but good to be safe)
-- The function runs as the owner (usually postgres/admin), so it bypasses RLS.
