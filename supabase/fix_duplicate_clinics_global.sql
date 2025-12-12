
-- Global Fix for Duplicate Clinics
-- This script finds users with multiple clinics, merges jobs to the first one, and deletes duplicates.

DO $$
DECLARE
    r RECORD;
    primary_clinic_id UUID;
BEGIN
    -- Loop through users who have more than 1 clinic
    FOR r IN 
        SELECT user_id, count(*) 
        FROM clinics 
        GROUP BY user_id 
        HAVING count(*) > 1
    LOOP
        -- Get the primary clinic (oldest one)
        SELECT id INTO primary_clinic_id
        FROM clinics
        WHERE user_id = r.user_id
        ORDER BY created_at ASC
        LIMIT 1;

        RAISE NOTICE 'Fixing user %: Primary Clinic %', r.user_id, primary_clinic_id;

        -- 1. Move JOBS from other clinics to primary
        UPDATE jobs
        SET clinic_id = primary_clinic_id
        WHERE clinic_id IN (
            SELECT id FROM clinics WHERE user_id = r.user_id AND id != primary_clinic_id
        );

        -- 2. Delete duplicate clinics
        DELETE FROM clinics
        WHERE user_id = r.user_id AND id != primary_clinic_id;
        
    END LOOP;
END $$;
