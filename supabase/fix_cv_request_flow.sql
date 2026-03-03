-- =====================================================
-- FIX CV REQUEST FLOW - RLS POLICIES
-- Run this ONCE in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: Fix cv_access_requests policies
-- =====================================================

-- Drop existing broken policies
DROP POLICY IF EXISTS "Employers can view their own requests" ON public.cv_access_requests;
DROP POLICY IF EXISTS "Job Seekers can view requests sent to them" ON public.cv_access_requests;
DROP POLICY IF EXISTS "Employers can insert requests" ON public.cv_access_requests;
DROP POLICY IF EXISTS "Job Seekers can update their requests" ON public.cv_access_requests;

-- Recreate with correct auth mapping (auth.uid() -> users.auth_id -> users.id)
CREATE POLICY "Employers can view their own requests" 
ON public.cv_access_requests FOR SELECT TO authenticated 
USING (employer_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Job Seekers can view requests sent to them" 
ON public.cv_access_requests FOR SELECT TO authenticated 
USING (job_seeker_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Employers can insert requests"
ON public.cv_access_requests FOR INSERT TO authenticated
WITH CHECK (employer_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Job Seekers can update their requests"
ON public.cv_access_requests FOR UPDATE TO authenticated
USING (job_seeker_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- =====================================================
-- PART 2: Fix notifications policies
-- =====================================================

-- Drop existing broken policies
DROP POLICY IF EXISTS "view_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "update_own_notifications" ON public.notifications;

-- Recreate with correct auth mapping
CREATE POLICY "view_own_notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "update_own_notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- =====================================================
-- PART 3: Grant execute permissions on RPC functions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.request_cv_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_cv_access(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_cv_access(UUID, UUID) TO authenticated;

-- Done!
SELECT 'RLS policies updated successfully!' AS result;
