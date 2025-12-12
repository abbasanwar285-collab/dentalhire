-- ============================================
-- DentalHire - Additional SQL Functions
-- Run this in Supabase SQL Editor
-- ============================================

-- Function to increment job applications count
CREATE OR REPLACE FUNCTION increment_job_applications(job_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE jobs
    SET applications = applications + 1
    WHERE id = job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_job_applications(UUID) TO authenticated;

-- ============================================
-- Enable Realtime for messages table
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- Additional RLS Policies for job_applications
-- ============================================

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON job_applications
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can create applications
CREATE POLICY "Users can create applications" ON job_applications
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Clinics can view applications for their jobs
CREATE POLICY "Clinics can view applications for their jobs" ON job_applications
    FOR SELECT USING (job_id IN (
        SELECT jobs.id FROM jobs 
        JOIN clinics ON jobs.clinic_id = clinics.id 
        WHERE clinics.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    ));

-- ============================================
-- Clinics Policies Update
-- ============================================

-- Users can view own clinic
CREATE POLICY "Users can view own clinic" ON clinics
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can update own clinic
CREATE POLICY "Users can update own clinic" ON clinics
    FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can insert own clinic
CREATE POLICY "Users can insert own clinic" ON clinics
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Anyone can view verified clinics
CREATE POLICY "Anyone can view verified clinics" ON clinics
    FOR SELECT USING (verified = true);
