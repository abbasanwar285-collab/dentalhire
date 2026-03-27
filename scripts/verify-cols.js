import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

async function verify() {
  const { data } = await supabase.from('patients').select('*').limit(1);
  if (data && data[0]) {
    const cols = Object.keys(data[0]);
    console.log('PATIENTS columns:', cols.join(', '));
    console.log('Has treatment_plans:', cols.includes('treatment_plans'));
    console.log('Has procedures:', cols.includes('procedures'));
    console.log('Has ortho_visits:', cols.includes('ortho_visits'));
    console.log('Has payments:', cols.includes('payments'));
    console.log('Has mobile:', cols.includes('mobile'));
    console.log('Has phone:', cols.includes('phone'));
  }
  process.exit(0);
}
verify();
