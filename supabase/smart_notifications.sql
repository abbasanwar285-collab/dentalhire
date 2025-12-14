-- ============================================
-- Smart Notifications System
-- ============================================

-- 1. Create Notifications Table (if not exists, dropping old one to ensure schema matches)
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('job_match', 'nearby_clinic', 'viewed_profile', 'application_status', 'system', 'status_change', 'new_application')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Profile Views Table
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    viewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    profile_owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS Policies

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Profile Views
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert profile views" ON profile_views
    FOR INSERT WITH CHECK (viewer_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can view who viewed them" ON profile_views
    FOR SELECT USING (profile_owner_id = (SELECT id FROM users WHERE auth_id = auth.uid()));


-- 4. Automation Functions & Triggers

-- Function A: Notify Profile Owner on View
CREATE OR REPLACE FUNCTION notify_on_profile_view()
RETURNS TRIGGER AS $$
DECLARE
    viewer_name TEXT;
BEGIN
    -- Prevent self-notification
    IF NEW.viewer_id = NEW.profile_owner_id THEN
        RETURN NEW;
    END IF;

    -- Get viewer name
    SELECT CONCAT(first_name, ' ', last_name) INTO viewer_name
    FROM users WHERE id = NEW.viewer_id;

    -- Insert Notification
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
        NEW.profile_owner_id,
        'viewed_profile',
        'تمت مشاهدة ملفك الشخصي 👀',
        CONCAT('قام ', COALESCE(viewer_name, 'شخص ما'), ' بمشاهدة ملفك الشخصي.'),
        jsonb_build_object('viewer_id', NEW.viewer_id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger A
DROP TRIGGER IF EXISTS on_profile_viewed ON profile_views;
CREATE TRIGGER on_profile_viewed
    AFTER INSERT ON profile_views
    FOR EACH ROW EXECUTE FUNCTION notify_on_profile_view();


-- Function B: Notify Candidates on New Job
CREATE OR REPLACE FUNCTION notify_candidates_on_new_job()
RETURNS TRIGGER AS $$
BEGIN
    -- Only active jobs
    IF NEW.status != 'active' THEN
        RETURN NEW;
    END IF;

    -- Find matching candidates (Same City AND Title Matching)
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
        u.id,
        'job_match',
        'وظيفة مناسبة لك ظهرت الآن! 🎯',
        CONCAT('مطلوب ', NEW.title, ' في ', NEW.location),
        jsonb_build_object('job_id', NEW.id)
    FROM users u
    JOIN cvs c ON c.user_id = u.id
    WHERE 
        c.status = 'active' 
        AND (c.city = NEW.location OR NEW.location = ANY(c.location_preferred))
        AND NEW.title ILIKE CONCAT('%', u.user_type::text, '%');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger B
DROP TRIGGER IF EXISTS on_new_job_posted ON jobs;
CREATE TRIGGER on_new_job_posted
    AFTER INSERT ON jobs
    FOR EACH ROW EXECUTE FUNCTION notify_candidates_on_new_job();
