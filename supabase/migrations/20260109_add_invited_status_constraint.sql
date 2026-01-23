-- ============================================
-- Ensure 'invited' status is accepted in job_applications
-- ============================================

DO $$
BEGIN
    -- Check if a constraint named 'job_applications_status_check' exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_applications_status_check') THEN
        -- Drop the old constraint
        ALTER TABLE job_applications DROP CONSTRAINT job_applications_status_check;
        
        -- Add the new constraint including 'invited'
        ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check 
        CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'accepted', 'rejected', 'interview', 'invited'));
        
        RAISE NOTICE 'Updated job_applications_status_check to include invited.';
    ELSE
        RAISE NOTICE 'No constraint named job_applications_status_check found. If you have a different constraint name, please update it manually.';
    END IF;
END $$;
