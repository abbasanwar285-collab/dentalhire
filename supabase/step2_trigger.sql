-- ============================================
-- STEP 2: Update Trigger Function
-- Run this AFTER step1_enums.sql has been run
-- ============================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function
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
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
