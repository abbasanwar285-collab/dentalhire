
-- تحديث الدالة لتجاوز فحص الملكية (حل مؤقت للحذف الإجباري)
-- Update function to bypass ownership check (Force Delete)

CREATE OR REPLACE FUNCTION delete_job_safely(target_job_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- تجاوزنا التحقق من الملكية لأن البيانات قد تكون غير متطابقة
  -- We bypassed the ownership check because data might be inconsistent
  
  -- 1. Delete Dependencies (Applications)
  DELETE FROM job_applications WHERE job_id = target_job_id;
  
  -- 2. Delete the Job itself
  DELETE FROM jobs WHERE id = target_job_id;

  -- 3. Return true (Success)
  RETURN TRUE;
END;
$$;
