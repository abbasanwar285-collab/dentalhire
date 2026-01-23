-- ============================================
-- DIAGNOSE AND FIX ADMIN USER
-- ============================================

DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'abbasanwar285@gmail.com';
BEGIN
    -- 1. Find the user in auth.users (case insensitive)
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email ILIKE v_email;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User % not found in auth.users! Are you sure the email is correct?', v_email;
    ELSE
        RAISE NOTICE 'Found user in auth.users with ID: %', v_user_id;

        -- 2. Check if user exists in public.users
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
            RAISE NOTICE 'User missing from public.users. Creating entry...';
            
            INSERT INTO public.users (id, auth_id, email, role, user_type, first_name, last_name)
            VALUES (
                v_user_id, 
                v_user_id, 
                v_email, 
                'admin', 
                'clinic', -- defaulting to clinic type for admin
                'Admin', 
                'User'
            );
            RAISE NOTICE 'Created user in public.users with Admin role.';
        ELSE
            -- 3. Update existing user
            UPDATE public.users 
            SET role = 'admin' 
            WHERE id = v_user_id;
            RAISE NOTICE 'Updated existing user role to Admin.';
        END IF;
    END IF;
END $$;
