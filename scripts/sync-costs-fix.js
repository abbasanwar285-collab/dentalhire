import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

async function syncCosts() {
  const { data: v2Data } = await supabase.from('patients_v2').select('id, name, treatment_plans');
  
  if (!v2Data) return;
  
  let updatedCount = 0;
  for (const p of v2Data) {
    const plans = p.treatment_plans || [];
    if (plans.length === 0) continue;
    
    let genTotal = 0, genPaid = 0;
    let orthoTotal = 0, orthoPaid = 0;
    
    for (const plan of plans) {
      if (plan.orthoDetails || plan.name?.includes('تقويم')) {
        orthoTotal += Number(plan.totalCost) || 0;
        orthoPaid += Number(plan.paidAmount) || 0;
      } else {
        genTotal += Number(plan.totalCost) || 0;
        genPaid += Number(plan.paidAmount) || 0;
      }
    }
    
    // Update old patients table JUST costs!
    if (genTotal > 0 || orthoTotal > 0 || genPaid > 0 || orthoPaid > 0) {
      const { error } = await supabase.from('patients').update({
        total_cost: genTotal,
        paid_amount: genPaid,
        ortho_total_cost: orthoTotal,
        ortho_paid_amount: orthoPaid
      }).eq('id', p.id);
      
      if (error) {
         console.error(`Failed to update ${p.name}:`, error);
      } else {
         console.log(`Updated ${p.name}: gen=${genTotal}/${genPaid}, ortho=${orthoTotal}/${orthoPaid}`);
         updatedCount++;
      }
    }
  }
  
  console.log(`Successfully synced costs for ${updatedCount} patients.`);
  process.exit(0);
}

syncCosts();
