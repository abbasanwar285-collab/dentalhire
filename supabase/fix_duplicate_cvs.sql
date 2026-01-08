-- ============================================
-- DentalHire - Fix Duplicate CVs
-- Run this in Supabase SQL Editor
-- ============================================

BEGIN;

-- 1. Identify and Delete Duplicates
-- Keeps the most recently updated CV for each user, deletes the rest.
WITH duplicates AS (
    SELECT 
        id,
        user_id,
        updated_at,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
    FROM public.cvs
)
DELETE FROM public.cvs
WHERE id IN (
    SELECT id 
    FROM duplicates 
    WHERE rn > 1
);

-- 2. Add Unique Constraint
-- This ensures that a user can only have ONE CV record.
-- Future attempts to create a duplicate will fail (or should be handled as an update).
ALTER TABLE public.cvs
ADD CONSTRAINT cvs_user_id_unique UNIQUE (user_id);

COMMIT;
