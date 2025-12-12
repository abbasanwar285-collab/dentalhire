-- Add gender and working_hours columns to jobs table

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'any',
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}';

-- Add comment or validation if needed
ALTER TABLE jobs ADD CONSTRAINT check_gender CHECK (gender IN ('male', 'female', 'any'));
