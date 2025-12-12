-- ============================================
-- DentalHire - Fix User Type Enums
-- Run this in Supabase SQL Editor
-- ============================================

-- Add missing values to user_type enum
-- We must wrap in transactions or run individually, but Supabase editor handles them.

ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'dental_technician';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'secretary';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'media';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'company';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'lab';

-- Verify the enum values
-- SELECT enum_range(NULL::user_type);
