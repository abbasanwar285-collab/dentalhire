-- ============================================
-- DentalHire - Update Database Enums
-- Run this in Supabase SQL Editor to fix "Database error saving new user"
-- ============================================

-- Add missing values to user_type enum
-- We use separate transactions or blocks because ALTER TYPE cannot be easily IF NOT EXISTS in all versions, 
-- but Supabase Postgres usually handles 'ADD VALUE IF NOT EXISTS'

ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'company';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'lab';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'sales_rep';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'secretary';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'media';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'dental_technician';

-- Verify the new types are added
-- SELECT enum_range(NULL::user_type);
