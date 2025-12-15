-- Function to get dynamic dashboard stats for Job Seekers & Clinics
create or replace function get_dashboard_stats(
  p_user_id uuid,
  p_role text default 'job_seeker'
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_city text;
  v_user_type text;
  v_stats jsonb;
  v_nearby_count int;
  v_avg_salary numeric;
  v_view_count int;
  v_total_candidates int;
  v_saved_profiles int;
begin
  -- JOB SEEKER STATS
  if p_role = 'job_seeker' then
    -- 1. Get User Details (City & Type)
    select city, user_type into v_user_city, v_user_type
    from users 
    join cvs on cvs.user_id = users.id
    where users.id = p_user_id;
    
    -- Fallback/Defaults
    v_user_city := coalesce(v_user_city, '');
    
    -- 2. Nearby Jobs (Same City)
    select count(*) into v_nearby_count
    from jobs
    where location ilike v_user_city
    and status = 'active';

    -- 3. Expected Salary (Avg of relevant jobs)
    select avg((salary_min + salary_max) / 2) into v_avg_salary
    from jobs
    where status = 'active'
    and (
      title ilike '%' || coalesce(v_user_type, '') || '%'
      or
      description ilike '%' || coalesce(v_user_type, '') || '%'
    );

    -- 4. Profile Views (From Notifications)
    select count(*) into v_view_count
    from notifications
    where user_id = p_user_id
    and type = 'view_profile';

    v_stats := jsonb_build_object(
      'nearby_jobs', coalesce(v_nearby_count, 0),
      'avg_salary', coalesce(round(v_avg_salary), 0),
      'profile_views', coalesce(v_view_count, 0)
    );

  else
  -- CLINIC STATS
    
    -- 1. Total Candidates
    select count(*) into v_total_candidates from cvs where status = 'active';

    -- 2. Saved Profiles (Favorites)
    -- Assuming a 'favorites' table exists or stored in array. 
    -- Based on schema inspection, clinics table has 'favorites' array column.
    select array_length(favorites, 1) into v_saved_profiles
    from clinics
    where user_id = p_user_id;

    v_stats := jsonb_build_object(
      'total_candidates', coalesce(v_total_candidates, 0),
      'saved_profiles', coalesce(v_saved_profiles, 0),
      'profile_views', 0, -- Placeholder until analytics table confirmed
      'messages', 0 -- Placeholder
    );

  end if;

  return v_stats;
end;
$$;
