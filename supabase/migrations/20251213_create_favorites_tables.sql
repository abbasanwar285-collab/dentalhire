-- Create job_favorites table for Job Seekers saving Jobs
CREATE TABLE IF NOT EXISTS job_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- Create candidate_favorites table for Employers saving CVs
CREATE TABLE IF NOT EXISTS candidate_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, cv_id)
);

-- RLS Policies for job_favorites
ALTER TABLE job_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own job favorites" ON job_favorites
    FOR ALL USING (auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id));

-- RLS Policies for candidate_favorites
ALTER TABLE candidate_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own candidate favorites" ON candidate_favorites
    FOR ALL USING (auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id));

-- Indexes for performance
CREATE INDEX idx_job_favorites_user_id ON job_favorites(user_id);
CREATE INDEX idx_candidate_favorites_user_id ON candidate_favorites(user_id);
