-- Create cv_access_requests table
CREATE TABLE IF NOT EXISTS public.cv_access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES public.clinics(user_id) ON DELETE CASCADE,
    job_seeker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employer_id, job_seeker_id) 
);

-- Enable RLS
ALTER TABLE public.cv_access_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Employers can view their own requests" 
ON public.cv_access_requests FOR SELECT 
TO authenticated 
USING (auth.uid() = employer_id);

CREATE POLICY "Job Seekers can view requests sent to them" 
ON public.cv_access_requests FOR SELECT 
TO authenticated 
USING (auth.uid() = job_seeker_id);

CREATE POLICY "Employers can insert requests" 
ON public.cv_access_requests FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Job Seekers can update their requests" 
ON public.cv_access_requests FOR UPDATE 
TO authenticated 
USING (auth.uid() = job_seeker_id);


-- Function to request CV access
CREATE OR REPLACE FUNCTION request_cv_access(
    p_employer_id UUID,
    p_job_seeker_id UUID
) RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
    v_employer_name TEXT;
BEGIN
    -- Check if request already exists
    SELECT id INTO v_request_id FROM public.cv_access_requests 
    WHERE employer_id = p_employer_id AND job_seeker_id = p_job_seeker_id;

    IF v_request_id IS NOT NULL THEN
        RETURN v_request_id; -- Already exists, return ID
    END IF;

    -- Get Employer Name
    SELECT name INTO v_employer_name FROM public.clinics WHERE user_id = p_employer_id;
    
    -- Insert new request
    INSERT INTO public.cv_access_requests (employer_id, job_seeker_id, status)
    VALUES (p_employer_id, p_job_seeker_id, 'pending')
    RETURNING id INTO v_request_id;

    -- Create Notification for Job Seeker
    INSERT INTO public.notifications (
        user_id, 
        title, 
        message, 
        type, 
        data, 
        read
    ) VALUES (
        p_job_seeker_id,
        'طلب عرض السيرة الذاتية', -- CV Access Request
        COALESCE(v_employer_name, 'صاحب عمل') || ' يرغب في الاطلاع على سيرتك الذاتية الكاملة.', -- [Employer] wants to view your full CV
        'system', -- using 'system' as generic type
        jsonb_build_object('requestId', v_request_id, 'action', 'cv_request', 'employerId', p_employer_id),
        false
    );

    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to respond to CV access request
CREATE OR REPLACE FUNCTION respond_to_cv_access(
    p_request_id UUID,
    p_job_seeker_id UUID,
    p_status TEXT -- 'approved' or 'rejected'
) RETURNS BOOLEAN AS $$
DECLARE
    v_employer_id UUID;
    v_seeker_name TEXT;
BEGIN
    IF p_status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status';
    END IF;

    -- Update request
    UPDATE public.cv_access_requests
    SET status = p_status, updated_at = NOW()
    WHERE id = p_request_id AND job_seeker_id = p_job_seeker_id
    RETURNING employer_id INTO v_employer_id;

    IF v_employer_id IS NULL THEN
        RETURN FALSE; -- Request not found or not owned by user
    END IF;

    -- If approved, notify employer
    IF p_status = 'approved' THEN
        -- Get Seeker Name
        SELECT first_name || ' ' || last_name INTO v_seeker_name FROM public.users WHERE id = p_job_seeker_id;

        INSERT INTO public.notifications (
            user_id, 
            title, 
            message, 
            type, 
            data, 
            read
        ) VALUES (
            v_employer_id,
            'تمت الموافقة على طلب السيرة الذاتية', -- CV Request Approved
            COALESCE(v_seeker_name, 'المتقدم') || ' وافق على مشاركة سيرته الذاتية معك.', -- [Seeker] approved sharing their CV with you
            'system',
            jsonb_build_object('seekerId', p_job_seeker_id, 'action', 'cv_approved'),
            false
        );
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to check access status
CREATE OR REPLACE FUNCTION check_cv_access(
    p_employer_id UUID,
    p_job_seeker_id UUID
) RETURNS TEXT AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status FROM public.cv_access_requests
    WHERE employer_id = p_employer_id AND job_seeker_id = p_job_seeker_id;

    RETURN COALESCE(v_status, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
