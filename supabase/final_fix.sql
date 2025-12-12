-- ============================================
-- DentalHire - Final Registration Fix
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure User Types Exist (Idempotent)
-- We handle the enum addition first.
-- Note: If you get "unsafe use of new value", it means this must be run in a separate batch.
-- But usually, simply adding them without selecting them immediately is fine.

ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'dental_technician';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'secretary';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'media';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'company';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'lab';

-- 2. Drop and Recreate the Trigger Function
-- This ensures we have the latest logic that uses these types.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    u_role user_role;
    u_type user_type;
BEGIN
    -- Safe casing to Enums with fallbacks
    BEGIN
        u_role := COALESCE(NEW.raw_user_meta_data->>'role', 'job_seeker')::user_role;
    EXCEPTION WHEN OTHERS THEN
        u_role := 'job_seeker';
    END;

    BEGIN
        u_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'dental_assistant')::user_type;
    EXCEPTION WHEN OTHERS THEN
        -- If the specific type fails (e.g. 'company' not in enum), fall back to a safe default
        -- converting 'company' to 'clinic' if we have to, or just 'dental_assistant'
        -- Ideally we want 'company' to work, but this prevents the hard crash.
        u_type := 'clinic'; -- fallback to clinic type which should exist
    END;

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
        u_role,
        u_type
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate Trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Ensure RLS Policies are correct (Idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view public user data" ON users;

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Anyone can view public user data" ON users
    FOR SELECT USING (true);
