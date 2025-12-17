-- ============================================
-- MASTER RLS FIX - PART 2: SECONDARY TABLES
-- DentalHire Security Policies
-- Run this SECOND in Supabase SQL Editor
-- ============================================

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
SELECT 'Part 2 Complete - Secondary Tables Fixed' AS status;
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('notifications', 'conversations', 'messages', 'push_subscriptions', 'cv_requests') ORDER BY tablename;
