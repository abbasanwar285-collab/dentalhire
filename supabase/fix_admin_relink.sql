-- ============================================
-- FIX ADMIN USER: FORCE RELINK
-- ============================================

DO $$
DECLARE
    v_email TEXT := 'abbasanwar285@gmail.com';
    v_correct_auth_id UUID;
    v_public_user_id UUID;
BEGIN
    -- 1. Get the correct Auth ID from the system
    SELECT id INTO v_correct_auth_id
    FROM auth.users
    WHERE email = v_email;

    IF v_correct_auth_id IS NULL THEN
        RAISE EXCEPTION 'This email does not exist in the Auth system. Please sign up first.';
    END IF;

    RAISE NOTICE 'Correct Auth ID is: %', v_correct_auth_id;

    -- 2. Find the existing profile in public.users (even if ID doesn't match)
    SELECT id INTO v_public_user_id
    FROM public.users
    WHERE email = v_email;

    IF v_public_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found existing profile with ID: %. Updating linkage...', v_public_user_id;

        -- Update the profile to point to the correct Auth User and be Admin
        UPDATE public.users
        SET 
            auth_id = v_correct_auth_id,
            role = 'admin',
            user_type = 'clinic' -- Ensure valid type
        WHERE email = v_email;
        
        RAISE NOTICE 'SUCCESS: Profile relinked and promoted to Admin.';
    ELSE
        RAISE NOTICE 'No profile found in public.users. Creating new one...';
        
        -- Insert new profile with correct IDs
        INSERT INTO public.users (id, auth_id, email, role, user_type, first_name, last_name)
        VALUES (
            v_correct_auth_id, -- Keep ID same as Auth ID if possible
            v_correct_auth_id, 
            v_email, 
            'admin', 
            'clinic', 
            'Admin', 
            'User'
        );
        RAISE NOTICE 'SUCCESS: New Admin profile created.';
    END IF;
END $$;
