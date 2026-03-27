import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kmjqdtupptbakhpihqfc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8');

async function addColumns() {
  const sql = `
    ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
    ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS blood_type TEXT;
    ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS allergies TEXT;
    ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS last_visit TEXT;
  `;
  const { error } = await supabase.rpc('exec_sql', { sql_string: sql });
  if (error) {
    console.error('RPC failed, trying raw post...', error);
    // Alternatively just do it via normal means if rpc doesn't exist.
  } else {
    console.log('Columns added via RPC');
  }
}

addColumns();
