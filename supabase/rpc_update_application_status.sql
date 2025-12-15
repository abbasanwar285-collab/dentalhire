-- Function to update application status and send notification atomically
create or replace function update_application_status(
  app_id uuid,
  new_status text
) returns boolean
language plpgsql
security definer -- Run as superuser to bypass RLS for this specific operation
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

  -- 3. Construct Message
  declare
    v_title text;
    v_message text;
  begin
    case new_status
      when 'accepted' then
        v_title := 'Application Accepted! 🎉';
        v_message := 'Congratulations! Your application for "' ||  coalesce(v_job_title, 'Job') || '" at ' || coalesce(v_clinic_name, 'Clinic') || ' has been accepted.';
      when 'rejected' then
        v_title := 'Application Update';
        v_message := 'Your application for "' ||  coalesce(v_job_title, 'Job') || '" at ' || coalesce(v_clinic_name, 'Clinic') || ' has been updated to rejected.';
      when 'interview' then
        v_title := 'Interview Invitation 📅';
        v_message := coalesce(v_clinic_name, 'The clinic') || ' would like to interview you for the "' || coalesce(v_job_title, 'position') || '" position.';
      when 'shortlisted' then
        v_title := 'Shortlisted! 🌟';
        v_message := 'You have been shortlisted for the "' || coalesce(v_job_title, 'Job') || '" position at ' || coalesce(v_clinic_name, 'Clinic') || '.';
      else
        v_title := 'Application Status Updated';
        v_message := 'Your application status for "' || coalesce(v_job_title, 'Job') || '" has been updated to ' || new_status || '.';
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
