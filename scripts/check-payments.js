import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kmjqdtupptbakhpihqfc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8');

async function checkData() {
  const { data: patients, error } = await supabase.from('patients_v2').select('id, name, treatment_plans');
  if (error) { console.error(error); return; }
  
  let totalPayments = 0;
  for (const p of patients) {
    if (p.treatment_plans && p.treatment_plans.length > 0) {
      for (const plan of p.treatment_plans) {
        if (plan.payments && plan.payments.length > 0) {
          totalPayments += plan.payments.length;
        }
      }
    }
  }
  console.log(`Total payments found across all patients in Supabase: ${totalPayments}`);
}

checkData();
