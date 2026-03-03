-- ============================================
-- DentalHire - Fix User Role Mismatch & Trigger
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. FIX THE TRIGGER FUNCTION
-- This ensures future users are created correctly by reading the metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role;
    v_type user_type;
    v_first_name text;
    v_last_name text;
    v_phone text;
BEGIN
    -- Extract values with defaults
    -- Note: keys in raw_user_meta_data match what is sent from frontend (register/page.tsx)
    -- Frontend sends: role, userType, firstName, lastName, phone
    
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'first_name', '');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'lastName', NEW.raw_user_meta_data->>'last_name', '');
    v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');

    -- Determine Role
    BEGIN
        v_role := (COALESCE(NEW.raw_user_meta_data->>'role', 'job_seeker'))::user_role;
    EXCEPTION WHEN OTHERS THEN
        v_role := 'job_seeker';
    END;

    -- Determine User Type
    BEGIN
        v_type := (COALESCE(NEW.raw_user_meta_data->>'userType', NEW.raw_user_meta_data->>'user_type', 'dental_assistant'))::user_type;
    EXCEPTION WHEN OTHERS THEN
        v_type := 'dental_assistant';
    END;

    INSERT INTO public.users (
        auth_id,
        email,
        first_name,
        last_name,
        phone,
        role,
        user_type,
        verified
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_first_name,
        v_last_name,
        v_phone,
        v_role,
        v_type,
        FALSE -- Default unverified
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallback to basic insert if something goes wrong to prevent sign-up blocking
    RAISE WARNING 'handle_new_user failed, using fallback. Error: %', SQLERRM;
    INSERT INTO public.users (auth_id, email, first_name, last_name, role, user_type)
    VALUES (NEW.id, NEW.email, '', '', 'job_seeker', 'dental_assistant');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. REPAIR EXISTING USERS
-- Update public.users where the role/type doesn't match the auth metadata

DO $$
DECLARE
    r RECORD;
    meta_role text;
    meta_type text;
    updated_count integer := 0;
BEGIN
    FOR r IN 
        SELECT u.id, u.auth_id, au.raw_user_meta_data 
        FROM public.users u
        JOIN auth.users au ON u.auth_id = au.id
    LOOP
        -- Get metadata values (handle both camelCase and snake_case keys just in case)
        meta_role := COALESCE(r.raw_user_meta_data->>'role', 'job_seeker');
        meta_type := COALESCE(r.raw_user_meta_data->>'userType', r.raw_user_meta_data->>'user_type', 'dental_assistant');

        -- Check for mismatch and update if necessary
        IF meta_type IS NOT NULL AND meta_type != '' THEN
            BEGIN
                -- Update if the current type in public.users is different from metadata
                -- AND the metadata value is a valid enum value (we cast to check)
                
                UPDATE public.users 
                SET 
                    user_type = meta_type::user_type,
                    role = meta_role::user_role,
                    -- Also fix names if they are missing in public but present in auth
                    first_name = CASE WHEN first_name = '' THEN COALESCE(r.raw_user_meta_data->>'firstName', r.raw_user_meta_data->>'first_name', first_name) ELSE first_name END,
                    last_name = CASE WHEN last_name = '' THEN COALESCE(r.raw_user_meta_data->>'lastName', r.raw_user_meta_data->>'last_name', last_name) ELSE last_name END
                WHERE id = r.id 
                AND (user_type::text != meta_type OR role::text != meta_role);
                
                IF FOUND THEN
                    updated_count := updated_count + 1;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- Ignore invalid enum values in metadata
                RAISE NOTICE 'Skipping user % due to invalid metadata values', r.id;
            END;
        END IF;
    END LOOP;

    RAISE NOTICE 'Fixed % user accounts', updated_count;
END;
$$;
