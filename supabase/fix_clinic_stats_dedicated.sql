
-- ============================================
-- DentalHire - Dedicated Clinic Stats Function
-- Run this in Supabase SQL Editor
-- ============================================

-- Function to get stats specific to clinic dashboard
-- This avoids logic branching issues in the main generic function

CREATE OR REPLACE FUNCTION get_clinic_overview_stats(p_clinic_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_candidates int;
  v_saved_profiles int;
  v_clinic_id uuid;
  v_profile_views int;
  v_messages int;
BEGIN
  -- 1. Total Candidates (Active CVs) - Visible to all clinics
  SELECT COUNT(*) INTO v_total_candidates FROM cvs WHERE status = 'active';

  -- 2. Get Clinic ID
  SELECT id INTO v_clinic_id FROM clinics WHERE user_id = p_clinic_user_id;
  
  -- 3. Saved Profiles (Favorites)
  IF v_clinic_id IS NOT NULL THEN
      SELECT array_length(favorites, 1) INTO v_saved_profiles 
      FROM clinics 
      WHERE id = v_clinic_id;
  ELSE
      v_saved_profiles := 0;
  END IF;

  -- 4. Profile Views (Mock for now or fetch from notifications/analytics)
  v_profile_views := 24; -- Placeholder matching UI

  -- 5. Messages
  SELECT COUNT(*) INTO v_messages
  FROM conversations c
  WHERE p_clinic_user_id::text = ANY(c.participants::text[])
  AND unread_count > 0;

  RETURN jsonb_build_object(
    'total_candidates', COALESCE(v_total_candidates, 0),
    'saved_profiles', COALESCE(v_saved_profiles, 0),
    'profile_views', v_profile_views,
    'messages', COALESCE(v_messages, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_clinic_overview_stats(UUID) TO authenticated;
