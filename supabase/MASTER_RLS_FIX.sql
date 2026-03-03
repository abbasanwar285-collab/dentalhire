-- ============================================
-- MASTER RLS FIX - ALL TABLES
-- DentalHire Complete Security Policies
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- ==================== USERS ====================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = auth_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_id);

-- Allow new user creation during registration
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
    );

-- ==================== CVS ====================
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own CV" ON cvs;
DROP POLICY IF EXISTS "Users can update own CV" ON cvs;
DROP POLICY IF EXISTS "Users can insert own CV" ON cvs;
DROP POLICY IF EXISTS "Users can delete own CV" ON cvs;
DROP POLICY IF EXISTS "Clinics can view active CVs" ON cvs;

-- Users can view their own CV
CREATE POLICY "Users can view own CV" ON cvs
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can update their own CV
CREATE POLICY "Users can update own CV" ON cvs
    FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can insert their own CV
CREATE POLICY "Users can insert own CV" ON cvs
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can delete their own CV
CREATE POLICY "Users can delete own CV" ON cvs
    FOR DELETE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Clinics can view active CVs
CREATE POLICY "Clinics can view active CVs" ON cvs
    FOR SELECT USING (status = 'active');

-- ==================== CLINICS ====================
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view clinics" ON clinics;
DROP POLICY IF EXISTS "Users can view own clinic" ON clinics;
DROP POLICY IF EXISTS "Users can create clinic" ON clinics;
DROP POLICY IF EXISTS "Users can update own clinic" ON clinics;
DROP POLICY IF EXISTS "Users can delete own clinic" ON clinics;
DROP POLICY IF EXISTS "Users can insert own clinic" ON clinics;

-- Anyone can view clinics (needed for job listings)
CREATE POLICY "Anyone can view clinics" ON clinics
    FOR SELECT USING (true);

-- Users can create their own clinic
CREATE POLICY "Users can create clinic" ON clinics
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can update their own clinic
CREATE POLICY "Users can update own clinic" ON clinics
    FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can delete their own clinic
CREATE POLICY "Users can delete own clinic" ON clinics
    FOR DELETE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ==================== JOBS ====================
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active jobs" ON jobs;
DROP POLICY IF EXISTS "Clinics can view own jobs" ON jobs;
DROP POLICY IF EXISTS "Clinics can insert own jobs" ON jobs;
DROP POLICY IF EXISTS "Clinics can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Clinics can delete own jobs" ON jobs;
DROP POLICY IF EXISTS "Clinics can manage own jobs" ON jobs;

-- Anyone can view active jobs
CREATE POLICY "Anyone can view active jobs" ON jobs
    FOR SELECT USING (status = 'active');

-- Clinics can view all their own jobs
CREATE POLICY "Clinics can view own jobs" ON jobs
    FOR SELECT USING (
        clinic_id IN (SELECT c.id FROM clinics c JOIN users u ON c.user_id = u.id WHERE u.auth_id = auth.uid())
    );

-- Clinics can insert jobs
CREATE POLICY "Clinics can insert own jobs" ON jobs
    FOR INSERT WITH CHECK (
        clinic_id IN (SELECT c.id FROM clinics c JOIN users u ON c.user_id = u.id WHERE u.auth_id = auth.uid())
    );

-- Clinics can update their jobs
CREATE POLICY "Clinics can update own jobs" ON jobs
    FOR UPDATE USING (
        clinic_id IN (SELECT c.id FROM clinics c JOIN users u ON c.user_id = u.id WHERE u.auth_id = auth.uid())
    );

-- Clinics can delete their jobs
CREATE POLICY "Clinics can delete own jobs" ON jobs
    FOR DELETE USING (
        clinic_id IN (SELECT c.id FROM clinics c JOIN users u ON c.user_id = u.id WHERE u.auth_id = auth.uid())
    );

-- ==================== JOB_APPLICATIONS ====================
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own applications" ON job_applications;
DROP POLICY IF EXISTS "Users can insert applications" ON job_applications;
DROP POLICY IF EXISTS "Users can update own applications" ON job_applications;
DROP POLICY IF EXISTS "Clinics can view applications" ON job_applications;
DROP POLICY IF EXISTS "Clinics can update applications" ON job_applications;

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON job_applications
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can create applications
CREATE POLICY "Users can insert applications" ON job_applications
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Clinics can view applications for their jobs
CREATE POLICY "Clinics can view applications" ON job_applications
    FOR SELECT USING (
        job_id IN (SELECT j.id FROM jobs j JOIN clinics c ON j.clinic_id = c.id JOIN users u ON c.user_id = u.id WHERE u.auth_id = auth.uid())
    );

-- Clinics can update applications for their jobs
CREATE POLICY "Clinics can update applications" ON job_applications
    FOR UPDATE USING (
        job_id IN (SELECT j.id FROM jobs j JOIN clinics c ON j.clinic_id = c.id JOIN users u ON c.user_id = u.id WHERE u.auth_id = auth.uid())
    );

-- ==================== NOTIFICATIONS ====================
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Allow inserts for notifications (system-generated)
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- ==================== CONVERSATIONS ====================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;

-- Users can view conversations they are part of
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id::text = ANY(participants::text[]))
    );

-- Users can create conversations
CREATE POLICY "Users can insert conversations" ON conversations
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id::text = ANY(participants::text[]))
    );

-- Users can update their conversations
CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id::text = ANY(participants::text[]))
    );

-- ==================== MESSAGES ====================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;

-- Users can view messages in their conversations
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (
        conversation_id IN (SELECT id FROM conversations WHERE EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id::text = ANY(participants::text[])))
    );

-- Users can send messages
CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (sender_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ==================== PUSH_SUBSCRIPTIONS ====================
ALTER TABLE IF EXISTS push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own subscriptions" ON push_subscriptions;

-- Users can manage their own push subscriptions
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ==================== CV_REQUESTS ====================
ALTER TABLE IF EXISTS cv_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view cv_requests involving them" ON cv_requests;
DROP POLICY IF EXISTS "Clinics can insert cv_requests" ON cv_requests;
DROP POLICY IF EXISTS "Users can update cv_requests" ON cv_requests;

-- Users can view requests involving them
CREATE POLICY "Users can view cv_requests involving them" ON cv_requests
    FOR SELECT USING (
        job_seeker_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
        OR clinic_id IN (SELECT c.id FROM clinics c JOIN users u ON c.user_id = u.id WHERE u.auth_id = auth.uid())
    );

-- Clinics can create requests
CREATE POLICY "Clinics can insert cv_requests" ON cv_requests
    FOR INSERT WITH CHECK (
        clinic_id IN (SELECT c.id FROM clinics c JOIN users u ON c.user_id = u.id WHERE u.auth_id = auth.uid())
    );

-- Job seekers can respond to requests
CREATE POLICY "Users can update cv_requests" ON cv_requests
    FOR UPDATE USING (
        job_seeker_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );

-- ==================== VERIFICATION ====================
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
