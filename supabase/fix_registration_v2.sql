-- ============================================
-- DentalHire - Fix Registration V2 (Robust)
-- Run this in Supabase SQL Editor
-- This fixes the "Database error" by ensuring the trigger has correct permissions and paths
-- ============================================

-- 1. ENSURE ENUMS EXIST (Explicit Schema)
-- We run these individually to ensure they apply even if some exist
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'company';
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'lab';
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'sales_rep';
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'secretary';
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'media';
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'dental_technician';

-- 2. RECREATE TRIGGER FUNCTION (With Search Path & Explicit Casts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public, extensions -- Critical for security and finding types
LANGUAGE plpgsql
AS $$
DECLARE
    v_role public.user_role;
    v_type public.user_type;
    v_first_name text;
    v_last_name text;
    v_role_str text;
    v_type_str text;
BEGIN
    -- Extract raw strings first
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    v_role_str := NEW.raw_user_meta_data->>'role';
    v_type_str := NEW.raw_user_meta_data->>'user_type';

    -- Safe Role Casting
    BEGIN
        IF v_role_str IS NULL THEN
            v_role := 'job_seeker'::public.user_role;
        ELSE
            v_role := v_role_str::public.user_role;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_role := 'job_seeker'::public.user_role;
    END;

    -- Safe User Type Casting
    BEGIN
        IF v_type_str IS NULL THEN
            v_type := 'dental_assistant'::public.user_type;
        ELSE
            v_type := v_type_str::public.user_type;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_type := 'dental_assistant'::public.user_type;
    END;

    -- Insert into public.users with explicit schema
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
    -- Emergency Fallback: If anything above fails, try a minimal insert
    -- This ensures the Auth User isn't orphaned without a Profile
    BEGIN
        INSERT INTO public.users (auth_id, email, first_name, last_name, role, user_type, verified)
        VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            'job_seeker'::public.user_role, 
            'dental_assistant'::public.user_type,
            FALSE
        );
    EXCEPTION WHEN OTHERS THEN
        -- If even this fails, raise a warning but don't crash auth
        RAISE WARNING 'Profile creation failed for Auth ID %: %', NEW.id, SQLERRM;
    END;
    RETURN NEW;
END;
$$;

-- 3. RECREATE TRIGGER
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
