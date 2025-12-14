-- Consolidated Migration Script for Favorites and CV Visibility
-- Run this entire script in Supabase SQL Editor

-- 1. Drop existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Users can manage their own job favorites" ON job_favorites;
DROP POLICY IF EXISTS "Users can manage their own candidate favorites" ON candidate_favorites;
DROP POLICY IF EXISTS "Employers can view applicant CVs" ON cvs;

-- 2. Create tables if they don't exist (using IF NOT EXISTS is safe)
CREATE TABLE IF NOT EXISTS job_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

CREATE TABLE IF NOT EXISTS candidate_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, cv_id)
);

-- 3. Enable RLS on new tables (safe to re-run)
ALTER TABLE job_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_favorites ENABLE ROW LEVEL SECURITY;

-- 4. Re-create Policies for Favorites
CREATE POLICY "Users can manage their own job favorites" ON job_favorites
    FOR ALL USING (auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage their own candidate favorites" ON candidate_favorites
    FOR ALL USING (auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id));

-- 5. Re-create Policy for Viewing Applicant CVs
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

-- 6. Create indexes if they don't exist (Postgres doesn't support IF NOT EXISTS for indexes directly in all versions, 
-- but we can wrap in a generic DO block or just ignore the error if it fails gracefully. 
-- However, typically simpler is to just try creating. If it fails, it means it exists.)
DROP INDEX IF EXISTS idx_job_favorites_user_id;
DROP INDEX IF EXISTS idx_candidate_favorites_user_id;

CREATE INDEX idx_job_favorites_user_id ON job_favorites(user_id);
CREATE INDEX idx_candidate_favorites_user_id ON candidate_favorites(user_id);
