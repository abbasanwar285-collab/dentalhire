-- Fix for the UUID error when adding patients to the waiting room
-- The old app uses custom string IDs (e.g. timestamp + random string) rather than standard UUIDs.
-- However, the waiting_room and arrival_records tables were created expecting UUID format.
-- This script safely changes the column types to TEXT so any string ID format is accepted.

-- 1. Fix waiting_room table columns
ALTER TABLE public.waiting_room ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.waiting_room ALTER COLUMN patient_id TYPE TEXT USING patient_id::text;
ALTER TABLE public.waiting_room ALTER COLUMN doctor_id TYPE TEXT USING doctor_id::text;
ALTER TABLE public.waiting_room ALTER COLUMN appointment_id TYPE TEXT USING appointment_id::text;

-- 2. Fix arrival_records table columns
ALTER TABLE public.arrival_records ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.arrival_records ALTER COLUMN patient_id TYPE TEXT USING patient_id::text;
ALTER TABLE public.arrival_records ALTER COLUMN appointment_id TYPE TEXT USING appointment_id::text;
