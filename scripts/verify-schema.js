import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

async function verifySchema() {
  // Fetch one patient from old table to see actual columns
  const { data, error } = await supabase.from('patients').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  if (data && data.length > 0) {
    console.log('Old patients table columns:');
    Object.keys(data[0]).forEach(col => {
      const val = data[0][col];
      const type = Array.isArray(val) ? `array(${val.length})` : typeof val;
      console.log(`  ${col}: ${type}`);
    });
  }
  
  // Check if treatment_plans column exists
  const hasTreatmentPlans = data && data[0] && 'treatment_plans' in data[0];
  console.log('\nHas treatment_plans column:', hasTreatmentPlans);
  
  // Also check appointments columns
  const { data: aptData } = await supabase.from('appointments').select('*').limit(1);
  if (aptData && aptData.length > 0) {
    console.log('\nOld appointments table columns:');
    Object.keys(aptData[0]).forEach(col => console.log(`  ${col}`));
  }
  
  // Check expenses columns
  const { data: expData } = await supabase.from('expenses').select('*').limit(1);
  if (expData && expData.length > 0) {
    console.log('\nOld expenses table columns:');
    Object.keys(expData[0]).forEach(col => console.log(`  ${col}`));
  }
  
  process.exit(0);
}

verifySchema();
