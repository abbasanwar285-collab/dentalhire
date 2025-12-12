-- Migration to add 'type' column to 'clinics' table
-- This distinguishes between Clinics, Companies, and Labs

ALTER TABLE public.clinics 
ADD COLUMN type text CHECK (type IN ('clinic', 'company', 'lab')) DEFAULT 'clinic';

-- Update existing records to 'clinic' (optional since default takes care of new ones, but good for existing nullable)
UPDATE public.clinics SET type = 'clinic' WHERE type IS NULL;

-- Create an index for faster filtering by organization type
CREATE INDEX idx_clinics_type ON public.clinics(type);
