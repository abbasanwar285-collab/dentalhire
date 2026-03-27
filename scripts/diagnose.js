import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

async function diagnose() {
  const { data } = await supabase.from('patients_v2').select('id, name, treatment_plans');
  
  // Check for duplicates of Rajaa
  const rajaas = data.filter(p => p.name.includes('رجاء'));
  console.log('--- Rajaa matches:', rajaas.length);
  rajaas.forEach(r => console.log(`  ID: ${r.id}, Name: ${r.name}, Plans: ${(r.treatment_plans || []).length}`));
  
  // Count patients with plans
  const withPlans = data.filter(p => p.treatment_plans && p.treatment_plans.length > 0);
  console.log('--- Total patients with plans:', withPlans.length, '/', data.length);
  
  // Count patients with empty plans
  const empty = data.filter(p => !p.treatment_plans || p.treatment_plans.length === 0);
  console.log('--- Patients with empty plans:', empty.length);
  
  process.exit(0);
}
diagnose();
