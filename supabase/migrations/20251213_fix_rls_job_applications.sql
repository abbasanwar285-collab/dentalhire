-- Enable RLS on job_applications if not already enabled
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (Idempotency)
DROP POLICY IF EXISTS "Job seekers can view own applications" ON job_applications;
DROP POLICY IF EXISTS "Job seekers can apply to jobs" ON job_applications;
DROP POLICY IF EXISTS "Clinics can view applications for their jobs" ON job_applications;
DROP POLICY IF EXISTS "Clinics can update status of applications" ON job_applications;

-- 1. Job Seekers can VIEW their own applications
CREATE POLICY "Job seekers can view own applications" ON job_applications
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

-- 2. Job Seekers can CREATE applications (Apply to jobs)
CREATE POLICY "Job seekers can apply to jobs" ON job_applications
    FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

-- 3. Clinics can VIEW applications for their jobs
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

-- 4. Clinics can UPDATE status of applications for their jobs
CREATE POLICY "Clinics can update status of applications" ON job_applications
    FOR UPDATE
    USING (
        job_id IN (
            SELECT j.id FROM jobs j
            JOIN clinics c ON j.clinic_id = c.id
            JOIN users u ON c.user_id = u.id
            WHERE u.auth_id = auth.uid()
        )
    );
