
-- Grant permission to use these functions to logged in users
GRANT EXECUTE ON FUNCTION public.request_cv_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_cv_access(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_cv_access(UUID, UUID) TO authenticated;

-- Ensure RLS consistency (optional, just to be safe)
ALTER TABLE public.cv_access_requests FORCE ROW LEVEL SECURITY;
