import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

async function addColumn() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS treatment_plans JSONB DEFAULT '[]'::jsonb;"
  });
  
  if (error) {
    console.log('RPC Failed. Check if exec_sql exists. Error:', error);
  } else {
    console.log('Added treatment_plans column successfully.');
  }

  // Verify column
  const { data } = await supabase.from('patients').select('treatment_plans').limit(1);
  console.log('Verification data:', data);

  process.exit(0);
}

addColumn();
