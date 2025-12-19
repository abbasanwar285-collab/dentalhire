-- ============================================
-- DentalHire - Announcements Fix (Final)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. DROP POLICIES FIRST (To allow column type change)
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Users can view relevant announcements" ON announcements;
DROP POLICY IF EXISTS "Job Seekers can view active announcements" ON announcements; -- Dropping old policy names too
DROP POLICY IF EXISTS "Clinics can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Users can view own reads" ON announcement_reads;
DROP POLICY IF EXISTS "Users can insert own reads" ON announcement_reads;

-- 2. Create table if not exists (in case it confuses the next step)
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_role TEXT NOT NULL DEFAULT 'job_seeker', 
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ensure target_role is TEXT
DO $$ 
BEGIN 
    -- If the column type is not text, alter it. 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'announcements' 
        AND column_name = 'target_role' 
        AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE announcements 
        ALTER COLUMN target_role TYPE TEXT USING target_role::text;
    END IF;
END $$;


-- 4. Create reads table if not exists
CREATE TABLE IF NOT EXISTS announcement_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(announcement_id, user_id)
);

-- 5. Create Indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_announcements_target_role') THEN
        CREATE INDEX idx_announcements_target_role ON announcements(target_role);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_announcements_is_active') THEN
        CREATE INDEX idx_announcements_is_active ON announcements(is_active);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_announcement_reads_user') THEN
        CREATE INDEX idx_announcement_reads_user ON announcement_reads(user_id);
    END IF;
END $$;

-- 6. Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- 7. RE-CREATE POLICIES

-- Admin can do everything
CREATE POLICY "Admins can manage announcements" ON announcements
    FOR ALL USING (
        auth.uid() IN (SELECT auth_id FROM users WHERE role = 'admin')
    );

-- Users can view active announcements for their role (or 'all')
CREATE POLICY "Users can view relevant announcements" ON announcements
    FOR SELECT USING (
        is_active = true AND 
        (
            target_role = 'all' OR
            target_role = (SELECT role::text FROM users WHERE auth_id = auth.uid()) OR 
            (
                target_role = 'clinic' AND EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'clinic')
            )
        )
    );

-- Reads Policies
CREATE POLICY "Users can view own reads" ON announcement_reads
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY "Users can insert own reads" ON announcement_reads
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );
