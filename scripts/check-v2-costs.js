import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

async function checkV2() {
  const { data, error } = await supabase.from('patients_v2')
    .select('id, name, treatment_plans')
    .limit(20);

  if (error) {
    console.error(error);
    return;
  }

  let withCost = 0;
  for (const p of data) {
    const plans = p.treatment_plans || [];
    let hasCost = false;
    for (const plan of plans) {
      if (plan.totalCost > 0 || plan.paidAmount > 0) {
        hasCost = true;
        console.log(`[V2] ${p.name}: totalCost=${plan.totalCost}, paidAmount=${plan.paidAmount}`);
      }
    }
    if (hasCost) withCost++;
  }
  
  console.log(`Found ${withCost} patients with costs in patients_v2 out of ${data.length} checked.`);
}

checkV2().then(() => process.exit(0));
