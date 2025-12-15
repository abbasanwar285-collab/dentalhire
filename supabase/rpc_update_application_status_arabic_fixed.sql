-- Function to update application status and send notification atomically (ARABIC FIXED)
create or replace function update_application_status(
  app_id uuid,
  new_status text
) returns boolean
language plpgsql
security definer
as $$
declare
  v_job_id uuid;
  v_user_id uuid;
  v_job_title text;
  v_clinic_name text;
  -- Declare message variables here to avoid sub-block issues
  v_title text;
  v_message text;
begin
  -- 1. Get Application Details & Update Status
  update job_applications
  set 
    status = new_status,
    updated_at = now()
  where id = app_id
  returning job_id, user_id into v_job_id, v_user_id;

  if not found then
    return false;
  end if;

  -- 2. Get Job and Clinic Details (Handle nulls gracefully)
  select 
    coalesce(j.title, 'الوظيفة'),
    coalesce(c.name, 'العيادة')
  into 
    v_job_title,
    v_clinic_name
  from jobs j
  left join clinics c on j.clinic_id = c.id
  where j.id = v_job_id;

  -- 3. Construct Message (ARABIC) using format() for safety
  case new_status
    when 'accepted' then
      v_title := 'تم قبول طلبك! 🎉';
      v_message := format('تهانينا! تم قبول طلبك لوظيفة "%s" في "%s".', v_job_title, v_clinic_name);
    
    when 'rejected' then
      v_title := 'تحديث بخصوص طلبك';
      v_message := format('تم تحديث حالة طلبك لوظيفة "%s" في "%s" إلى مرفوض.', v_job_title, v_clinic_name);
    
    when 'interview' then
      v_title := 'دعوة للمقابلة 📅';
      v_message := format('تود "%s" مقابلتك بخصوص وظيفة "%s".', v_clinic_name, v_job_title);
    
    when 'shortlisted' then
      v_title := 'قائمة المرشحين! 🌟';
      v_message := format('تم إدراجك في قائمة المرشحين لوظيفة "%s" في "%s".', v_job_title, v_clinic_name);
    
    else
      v_title := 'تحديث حالة الطلب';
      v_message := format('تم تحديث حالة طلبك لوظيفة "%s" إلى %s.', v_job_title, new_status);
  end case;

  -- 4. Insert Notification
  insert into notifications (
    user_id,
    title,
    message,
    type,
    read,
    data
  ) values (
    v_user_id,
    v_title,
    v_message,
    'status_change',
    false,
    jsonb_build_object(
      'applicationId', app_id,
      'status', new_status,
      'jobTitle', v_job_title,
      'clinicName', v_clinic_name
    )
  );

  return true;
end;
$$;
