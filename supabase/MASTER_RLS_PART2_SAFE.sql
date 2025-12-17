-- ============================================
-- MASTER RLS FIX - PART 2: SECONDARY TABLES (SAFE VERSION)
-- Only runs on tables that exist
-- ============================================

-- ==================== NOTIFICATIONS ====================
DO $$ BEGIN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
    DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
    
    CREATE POLICY "Users can view own notifications" ON notifications
        FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
    
    CREATE POLICY "Users can update own notifications" ON notifications
        FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
    
    CREATE POLICY "System can insert notifications" ON notifications
        FOR INSERT WITH CHECK (true);
        
    RAISE NOTICE 'Notifications policies created';
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'notifications table does not exist, skipping';
END $$;

-- ==================== CONVERSATIONS ====================
DO $$ BEGIN
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
    DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
    DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
    
    CREATE POLICY "Users can view own conversations" ON conversations
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id::text = ANY(participants::text[]))
        );
    
    CREATE POLICY "Users can insert conversations" ON conversations
        FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id::text = ANY(participants::text[]))
        );
    
    CREATE POLICY "Users can update own conversations" ON conversations
        FOR UPDATE USING (
            EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id::text = ANY(participants::text[]))
        );
        
    RAISE NOTICE 'Conversations policies created';
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'conversations table does not exist, skipping';
END $$;

-- ==================== MESSAGES ====================
DO $$ BEGIN
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own messages" ON messages;
    DROP POLICY IF EXISTS "Users can insert messages" ON messages;
    
    CREATE POLICY "Users can view own messages" ON messages
        FOR SELECT USING (
            conversation_id IN (SELECT id FROM conversations WHERE EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id::text = ANY(participants::text[])))
        );
    
    CREATE POLICY "Users can insert messages" ON messages
        FOR INSERT WITH CHECK (sender_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
        
    RAISE NOTICE 'Messages policies created';
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'messages table does not exist, skipping';
END $$;

-- ==================== PUSH_SUBSCRIPTIONS ====================
DO $$ BEGIN
    ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can manage own subscriptions" ON push_subscriptions;
    
    CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
        FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
        
    RAISE NOTICE 'Push subscriptions policies created';
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'push_subscriptions table does not exist, skipping';
END $$;

-- ==================== CV_REQUESTS ====================
DO $$ BEGIN
    ALTER TABLE cv_requests ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view cv_requests involving them" ON cv_requests;
    DROP POLICY IF EXISTS "Clinics can insert cv_requests" ON cv_requests;
    DROP POLICY IF EXISTS "Users can update cv_requests" ON cv_requests;
    
    CREATE POLICY "Users can view cv_requests involving them" ON cv_requests
        FOR SELECT USING (
            job_seeker_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
            OR clinic_id IN (SELECT c.id FROM clinics c JOIN users u ON c.user_id = u.id WHERE u.auth_id = auth.uid())
        );
    
    CREATE POLICY "Clinics can insert cv_requests" ON cv_requests
        FOR INSERT WITH CHECK (
            clinic_id IN (SELECT c.id FROM clinics c JOIN users u ON c.user_id = u.id WHERE u.auth_id = auth.uid())
        );
    
    CREATE POLICY "Users can update cv_requests" ON cv_requests
        FOR UPDATE USING (
            job_seeker_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
        );
        
    RAISE NOTICE 'CV requests policies created';
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'cv_requests table does not exist, skipping';
END $$;

-- ==================== VERIFICATION ====================
SELECT 'Part 2 Complete - Secondary Tables Fixed (Safe Version)' AS status;
