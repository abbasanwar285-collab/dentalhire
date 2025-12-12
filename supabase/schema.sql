-- ============================================
-- DentalHire - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('job_seeker', 'clinic', 'admin');
CREATE TYPE user_type AS ENUM ('dental_assistant', 'sales_rep', 'dentist', 'clinic', 'dental_technician', 'secretary', 'media', 'company', 'lab');
CREATE TYPE cv_status AS ENUM ('draft', 'active', 'hidden');
CREATE TYPE job_status AS ENUM ('active', 'closed', 'draft');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'temporary');

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'job_seeker',
    user_type user_type NOT NULL DEFAULT 'dental_assistant',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    avatar TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CVS TABLE
-- ============================================

CREATE TABLE cvs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    bio TEXT,
    photo TEXT,
    experience JSONB DEFAULT '[]',
    skills TEXT[] DEFAULT '{}',
    certifications JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    salary_expected INTEGER DEFAULT 0,
    salary_currency TEXT DEFAULT 'USD',
    salary_negotiable BOOLEAN DEFAULT TRUE,
    location_preferred TEXT[] DEFAULT '{}',
    willing_to_relocate BOOLEAN DEFAULT FALSE,
    remote_work BOOLEAN DEFAULT FALSE,
    availability_type employment_type DEFAULT 'full_time',
    availability_start_date DATE,
    availability_schedule JSONB DEFAULT '{}',
    documents JSONB DEFAULT '[]',
    status cv_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CLINICS TABLE
-- ============================================

CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    logo TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    preferences JSONB DEFAULT '{}',
    favorites UUID[] DEFAULT '{}',
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- JOBS TABLE
-- ============================================

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] DEFAULT '{}',
    salary_min INTEGER NOT NULL,
    salary_max INTEGER NOT NULL,
    salary_currency TEXT DEFAULT 'USD',
    location TEXT NOT NULL,
    employment_type employment_type NOT NULL DEFAULT 'full_time',
    skills TEXT[] DEFAULT '{}',
    status job_status DEFAULT 'active',
    applications INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participants UUID[] NOT NULL,
    participant_names JSONB NOT NULL DEFAULT '{}',
    last_message_id UUID,
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES users(id) NOT NULL,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for last_message after messages table exists
ALTER TABLE conversations 
ADD CONSTRAINT fk_last_message 
FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- ============================================
-- JOB APPLICATIONS TABLE
-- ============================================

CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending',
    cover_letter TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_cvs_user_id ON cvs(user_id);
CREATE INDEX idx_cvs_status ON cvs(status);
CREATE INDEX idx_cvs_city ON cvs(city);

CREATE INDEX idx_jobs_clinic_id ON jobs(clinic_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_location ON jobs(location);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

CREATE INDEX idx_conversations_participants ON conversations USING GIN(participants);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_id);

-- CVs policies
CREATE POLICY "Users can view own CV" ON cvs
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own CV" ON cvs
    FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own CV" ON cvs
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Clinics can view active CVs" ON cvs
    FOR SELECT USING (status = 'active');

-- Jobs policies
CREATE POLICY "Anyone can view active jobs" ON jobs
    FOR SELECT USING (status = 'active');

CREATE POLICY "Clinics can manage own jobs" ON jobs
    FOR ALL USING (clinic_id IN (SELECT id FROM clinics WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));

-- Messages policies
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid()::text = ANY(participants::text[]));

CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (conversation_id IN (SELECT id FROM conversations WHERE auth.uid()::text = ANY(participants::text[])));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cvs_updated_at
    BEFORE UPDATE ON cvs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at
    BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_id, email, first_name, last_name)
    VALUES (NEW.id, NEW.email, '', '');
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
