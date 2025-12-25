-- ============================================
-- DentalHire - Fix Dashboard Data & RLS
-- Run this in Supabase SQL Editor to restore functionality
-- ============================================

-- 1. Restore the comprehensive get_dashboard_stats function
-- (Previous version in dashboard_fixes.sql only handled clinics, breaking other dashboards)

DROP FUNCTION IF EXISTS get_dashboard_stats(UUID, TEXT);

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_user_id uuid,
  p_role text default 'job_seeker'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_city text;
  v_user_type text;
  v_stats jsonb;
  v_nearby_count int;
  v_avg_salary numeric;
  v_view_count int;
  v_total_candidates int;
  v_saved_profiles int;
  v_clinic_id uuid;
BEGIN
  -- ========================================
  -- JOB SEEKER LOGIC (Assistant, Technician, etc.)
  -- ========================================
  IF p_role = 'job_seeker' THEN
    -- Get User Details
    SELECT city, user_type INTO v_user_city, v_user_type
    FROM users 
    WHERE id = p_user_id;
    
    -- Defaults
    v_user_city := COALESCE(v_user_city, '');
    
    -- Nearby Jobs (Same City)
    SELECT COUNT(*) INTO v_nearby_count
    FROM jobs
    WHERE location ILIKE '%' || v_user_city || '%'
    AND status = 'active';

    -- Expected Salary (Avg of relevant jobs)
    SELECT AVG((salary_min + salary_max) / 2) INTO v_avg_salary
    FROM jobs
    WHERE status = 'active'
    AND (
      title ILIKE '%' || COALESCE(v_user_type, '') || '%'
      OR
      description ILIKE '%' || COALESCE(v_user_type, '') || '%'
    );

    -- Profile Views
    SELECT COUNT(*) INTO v_view_count
    FROM notifications
    WHERE user_id = p_user_id
    AND type = 'view_profile';

    v_stats := jsonb_build_object(
      'nearby_jobs', COALESCE(v_nearby_count, 0),
      'avg_salary', COALESCE(ROUND(v_avg_salary), 0),
      'profile_views', COALESCE(v_view_count, 0)
    );

  -- ========================================
  -- EMPLOYER LOGIC (Clinic, Company, Lab)
  -- ========================================
  ELSE
    -- Get Clinic ID
    SELECT id INTO v_clinic_id FROM clinics WHERE user_id = p_user_id;

    -- Total Candidates (Active CVs)
    SELECT COUNT(*) INTO v_total_candidates FROM cvs WHERE status = 'active';

    -- Saved Profiles
    IF v_clinic_id IS NOT NULL THEN
        SELECT array_length(favorites, 1) INTO v_saved_profiles 
        FROM clinics 
        WHERE id = v_clinic_id;
    ELSE
        v_saved_profiles := 0;
    END IF;

    v_stats := jsonb_build_object(
      'total_candidates', COALESCE(v_total_candidates, 0),
      'saved_profiles', COALESCE(v_saved_profiles, 0),
      'profile_views', 0, 
      'messages', 0 
    );

  END IF;

  RETURN v_stats;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID, TEXT) TO authenticated;


-- 2. Ensure RLS Policies for Job Applications allow View/Create
-- (Crucial for "Recent Applications" list)

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Job Seekers: View Own
DROP POLICY IF EXISTS "Job seekers can view own applications" ON job_applications;
CREATE POLICY "Job seekers can view own applications" ON job_applications
    FOR SELECT
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Job Seekers: Create/Apply
DROP POLICY IF EXISTS "Job seekers can apply to jobs" ON job_applications;
CREATE POLICY "Job seekers can apply to jobs" ON job_applications
    FOR INSERT
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Clinics: View Applications for their jobs
DROP POLICY IF EXISTS "Clinics can view applications for their jobs" ON job_applications;
CREATE POLICY "Clinics can view applications for their jobs" ON job_applications
    FOR SELECT
    USING (
        job_id IN (
            SELECT j.id FROM jobs j
            JOIN clinics c ON j.clinic_id = c.id
            JOIN users u ON c.user_id = u.id
            WHERE u.auth_id = auth.uid()
        )
    );

