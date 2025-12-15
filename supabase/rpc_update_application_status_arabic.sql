-- Function to update application status and send notification atomically (ARABIC VERSION)
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

  -- 2. Get Job and Clinic Details
  select 
    j.title,
    c.name
  into 
    v_job_title,
    v_clinic_name
  from jobs j
  left join clinics c on j.clinic_id = c.id
  where j.id = v_job_id;

  -- 3. Construct Message (ARABIC)
  declare
    v_title text;
    v_message text;
  begin
    case new_status
      when 'accepted' then
        v_title := 'تم قبول طلبك! 🎉';
        v_message := 'تهانينا! تم قبول طلبك لوظيفة "' ||  coalesce(v_job_title, 'الوظيفة') || '" في ' || coalesce(v_clinic_name, 'العيادة') || '.';
      when 'rejected' then
        v_title := 'تحديث بخصوص طلبك';
        v_message := 'تم تحديث حالة طلبك لوظيفة "' ||  coalesce(v_job_title, 'الوظيفة') || '" في ' || coalesce(v_clinic_name, 'العيادة') || ' إلى مرفوض.';
      when 'interview' then
        v_title := 'دعوة للمقابلة 📅';
        v_message := 'تود ' || coalesce(v_clinic_name, 'العيادة') || ' مقابلتك بخصوص وظيفة "' || coalesce(v_job_title, 'الوظيفة') || '".';
      when 'shortlisted' then
        v_title := 'قائمة المرشحين! 🌟';
        v_message := 'تم إدراجك في قائمة المرشحين لوظيفة "' || coalesce(v_job_title, 'الوظيفة') || '" في ' || coalesce(v_clinic_name, 'العيادة') || '.';
      else
        v_title := 'تحديث حالة الطلب';
        v_message := 'تم تحديث حالة طلبك لوظيفة "' || coalesce(v_job_title, 'الوظيفة') || '" إلى ' || new_status || '.';
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
  end;

  return true;
end;
$$;
