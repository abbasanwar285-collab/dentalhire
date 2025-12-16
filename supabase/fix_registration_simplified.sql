-- ============================================
-- DentalHire - Simplified Registration Trigger
-- Run this in Supabase SQL Editor
-- This removes all complex logic from the trigger to prevent crashes.
-- ============================================

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Create a "dumb" function that ALWAYS succeeds
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Just insert the critical foreign key and email.
    -- Default everything else. Client will update it immediately.
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
        '', -- Simplified: No metadata reading
        '', -- Simplified: No metadata reading
        'job_seeker', -- Default
        'dental_assistant', -- Default
        FALSE
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- If even this fails, logic is truly broken, but this block tries to prevent the 500
    RAISE LOG 'Trigger failed: %', SQLERRM;
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
