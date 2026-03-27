import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

async function checkPatient() {
  const id = '8da13877-649f-4218-95c6-356b21797024';
  
  // Check old patients table
  const { data: oldData } = await supabase.from('patients').select('*').eq('id', id).single();
  console.log('=== OLD PATIENTS TABLE ===');
  if (oldData) {
    console.log(`Name: ${oldData.name}`);
    console.log(`total_cost: ${oldData.total_cost}, paid_amount: ${oldData.paid_amount}`);
    console.log(`procedures:`, oldData.procedures);
    console.log(`treatment_plans (JSON):`, JSON.stringify(oldData.treatment_plans, null, 2));
  } else {
    console.log('Not found in old table.');
  }

  // Check patients_v2 table
  const { data: v2Data } = await supabase.from('patients_v2').select('*').eq('id', id).single();
  console.log('\n=== PATIENTS_V2 TABLE ===');
  if (v2Data) {
    console.log(`Name: ${v2Data.name}`);
    console.log(`treatment_plans (JSON):`, JSON.stringify(v2Data.treatment_plans, null, 2));
  } else {
    console.log('Not found in v2 table.');
  }
}

checkPatient().then(() => process.exit(0));
