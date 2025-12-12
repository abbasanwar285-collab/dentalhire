
-- 1. Fix Foreign Key Constraint to allow deleting jobs with applications
-- We first try to drop the existing constraint (name might vary, so we check general naming convention or just try forcing it)
-- Note: It is safer to create an RPC that deletes dependencies first than to alter table constraints blindly if we don't know the name.
-- HOWEVER, standard practice is CASCADE. Let's try to alter it if we can guess the name, OR better:
-- 2. Create a Robust RPC function that handles everything.

CREATE OR REPLACE FUNCTION delete_job_safely(target_job_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (bypass RLS for the deletion steps)
SET search_path = public
AS $$
DECLARE
  v_clinic_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();

  -- Check if the job belongs to a clinic owned by this user
  SELECT clinic_id INTO v_clinic_id
  FROM jobs
  WHERE id = target_job_id;

  IF v_clinic_id IS NULL THEN
    -- Job not found
    RETURN FALSE;
  END IF;

  -- Verify ownership: Does this clinic belong to the user?
  PERFORM 1
  FROM clinics
  WHERE id = v_clinic_id
  AND user_id = v_user_id;

  IF NOT FOUND THEN
    -- User does not own this clinic/job
    RETURN FALSE;
  END IF;

  -- NOW perform the deletion.
  -- We delete applications first manually to avoid FK constraint errors if CASCADE is missing
  DELETE FROM job_applications WHERE job_id = target_job_id;
  
  -- Delete the job
  DELETE FROM jobs WHERE id = target_job_id;

  RETURN TRUE;
END;
$$;
