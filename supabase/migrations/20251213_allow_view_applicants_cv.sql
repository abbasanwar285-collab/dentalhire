-- Allow employers to view CVs of applicants to their jobs
CREATE POLICY "Employers can view applicant CVs" ON cvs
    FOR SELECT USING (
        id IN (
            SELECT cv_id 
            FROM job_applications 
            WHERE job_id IN (
                SELECT id 
                FROM jobs 
                WHERE clinic_id IN (
                    SELECT id 
                    FROM clinics 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );
