-- Create a test job seeker user
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000009', -- Specific ID for easy reference
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'jobseeker_sim@dentalhire.com',
  crypt('password123', gen_salt('bf')), -- Password: password123
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"job_seeker","userType":"dentist","firstName":"Sim","lastName":"Seeker"}',
  false,
  now(),
  now(),
  NULL,
  NULL,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Insert into public.users (triggers might handle this, but to be safe/explicit if needed, duplicate the logic effectively)
-- Usually auth trigger handles this, but let's verify if we need to insert into public table manually. 
-- Based on previous context, there is likely a trigger. 

-- Let's just create auth user and assume trigger works, or check public.users after.
