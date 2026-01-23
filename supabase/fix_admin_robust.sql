-- ============================================
-- FIX ADMIN USER (Robust Version)
-- ============================================

DO $$
DECLARE
    v_target_email TEXT := 'abbasanwar285@gmail.com';
BEGIN
    -- 1. Try to update using Case-Insensitive search (ILIKE) and TRIM to handle spaces
    UPDATE public.users
    SET role = 'admin'
    WHERE TRIM(email) ILIKE TRIM(v_target_email);

    IF FOUND THEN
        RAISE NOTICE 'Successfully updated Admin role for % (found via flexible search).', v_target_email;
    ELSE
        -- 2. If still not found by email, it might be the ID is correct but email is wildly different/missing?
        -- Let's try to update based on the Auth ID from the system
        UPDATE public.users
        SET role = 'admin'
        WHERE auth_id = (SELECT id FROM auth.users WHERE email ILIKE v_target_email);
        
        IF FOUND THEN
             RAISE NOTICE 'Successfully updated Admin role based on Auth ID linkage.';
        ELSE
             RAISE NOTICE 'Could not find user in public.users to update.';
        END IF;
    END IF;
END $$;
