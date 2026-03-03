-- ============================================
-- DentalHire - Dashboard Fixes (Updated)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Fix Admin RLS (Allow admins to view all data)

-- Users Table
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        auth.uid() IN (SELECT auth_id FROM users WHERE role = 'admin')
    );

-- CVs Table
DROP POLICY IF EXISTS "Admins can view all cvs" ON cvs;
CREATE POLICY "Admins can view all cvs" ON cvs
    FOR SELECT USING (
        auth.uid() IN (SELECT auth_id FROM users WHERE role = 'admin')
    );

-- Clinics Table
DROP POLICY IF EXISTS "Admins can view all clinics" ON clinics;
CREATE POLICY "Admins can view all clinics" ON clinics
    FOR SELECT USING (
        auth.uid() IN (SELECT auth_id FROM users WHERE role = 'admin')
    );

-- Jobs Table
DROP POLICY IF EXISTS "Admins can view all jobs" ON jobs;
CREATE POLICY "Admins can view all jobs" ON jobs
    FOR SELECT USING (
        auth.uid() IN (SELECT auth_id FROM users WHERE role = 'admin')
    );

-- Job Applications Table
DROP POLICY IF EXISTS "Admins can view all applications" ON job_applications;
CREATE POLICY "Admins can view all applications" ON job_applications
    FOR SELECT USING (
        auth.uid() IN (SELECT auth_id FROM users WHERE role = 'admin')
    );


-- 2. Create get_dashboard_stats RPC for Clinics
-- Added DROP to handle existing function definition conflicts
DROP FUNCTION IF EXISTS get_dashboard_stats(UUID, TEXT);

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID, p_role TEXT)
RETURNS JSONB AS $$
DECLARE
    v_total_candidates INTEGER;
    v_saved_profiles INTEGER;
    v_clinic_id UUID;
    v_result JSONB;
BEGIN
    -- Get Clinic ID
    SELECT id INTO v_clinic_id FROM clinics WHERE user_id = p_user_id;

    -- 1. Total Candidates (Active CVs)
    SELECT COUNT(*) INTO v_total_candidates FROM cvs WHERE status = 'active';

    -- 2. Saved Profiles (Favorites)
    IF v_clinic_id IS NOT NULL THEN
        SELECT array_length(favorites, 1) INTO v_saved_profiles 
        FROM clinics 
        WHERE id = v_clinic_id;
    ELSE
        v_saved_profiles := 0;
    END IF;

    -- Handle null array_length
    IF v_saved_profiles IS NULL THEN
        v_saved_profiles := 0;
    END IF;

    v_result := jsonb_build_object(
        'total_candidates', v_total_candidates,
        'saved_profiles', v_saved_profiles
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID, TEXT) TO authenticated;
