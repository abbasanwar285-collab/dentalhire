-- ============================================
-- FAILSAFE SOLUTION: Bypass RLS with Function
-- Run this in Supabase SQL Editor
-- ============================================

-- Create a secure function to get the user's clinic
-- SECURITY DEFINER means it runs with system privileges (bypassing RLS)
CREATE OR REPLACE FUNCTION get_my_clinic()
RETURNS TABLE (
  id uuid,
  name text,
  user_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.user_id
  FROM clinics c
  JOIN users u ON c.user_id = u.id
  WHERE u.auth_id = auth.uid();
END;
$$;
