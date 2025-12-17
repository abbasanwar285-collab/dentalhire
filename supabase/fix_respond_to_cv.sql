-- Fix respond_to_cv_access to handle NULL names
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION respond_to_cv_access(
    p_request_id UUID,
    p_job_seeker_id UUID,
    p_status TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_employer_id UUID;
    v_seeker_name TEXT;
BEGIN
    IF p_status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status';
    END IF;

    UPDATE public.cv_access_requests
    SET status = p_status, updated_at = NOW()
    WHERE id = p_request_id AND job_seeker_id = p_job_seeker_id
    RETURNING employer_id INTO v_employer_id;

    IF v_employer_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF p_status = 'approved' THEN
        SELECT COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') 
        INTO v_seeker_name 
        FROM public.users 
        WHERE id = p_job_seeker_id;
        
        v_seeker_name := TRIM(v_seeker_name);
        IF v_seeker_name = '' OR v_seeker_name IS NULL THEN
            v_seeker_name := 'المتقدم';
        END IF;

        INSERT INTO public.notifications (user_id, title, message, type, data, read)
        VALUES (
            v_employer_id,
            'تمت الموافقة على طلب السيرة الذاتية',
            v_seeker_name || ' وافق على مشاركة سيرته الذاتية معك.',
            'system',
            jsonb_build_object('seekerId', p_job_seeker_id, 'action', 'cv_approved'),
            false
        );
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
