
-- Enable RLS on jobs table if not already
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing delete policy if it exists (to avoid conflicts/duplicates)
DROP POLICY IF EXISTS "Enable delete for clinic owners" ON jobs;

-- Create DELETE policy
-- Users can delete jobs if they map to the clinic that owns the job
CREATE POLICY "Enable delete for clinic owners"
ON jobs
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM clinics 
    WHERE id = jobs.clinic_id
  )
);

-- Grant DELETE permission to authenticated role
GRANT DELETE ON jobs TO authenticated;
