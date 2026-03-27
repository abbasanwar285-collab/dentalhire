import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

const buildTreatmentPlansFromOldPatient = (row, v2Plans) => {
  const plans = [];
  const savedPlans = v2Plans || [];
  const savedGeneral = savedPlans.find(p => p.name === 'علاج عام');
  
  const hasGeneral = (row.procedures && row.procedures.length > 0) || 
                     (row.payments && row.payments.length > 0) || 
                     (row.total_cost || 0) > 0 || savedGeneral;
                     
  if (hasGeneral) {
    plans.push({
      name: "علاج عام",
      totalCost: Number(row.total_cost) || savedGeneral?.totalCost || 0,
      paidAmount: Number(row.paid_amount) || savedGeneral?.paidAmount || 0,
    });
  }
  
  if (savedPlans.length > 0) {
    for (const tp of savedPlans) {
      if (tp.name !== 'علاج عام' && !tp.orthoDetails && !tp.name?.includes('تقويم')) {
        plans.push({ name: tp.name, totalCost: tp.totalCost, paidAmount: tp.paidAmount });
      }
    }
  }
  return plans;
};

async function testFetch() {
  const id = '8da13877-649f-4218-95c6-356b21797024';
  const { data: row } = await supabase.from('patients').select('*').eq('id', id).single();
  const { data: v2Row } = await supabase.from('patients_v2').select('treatment_plans').eq('id', id).single();
  
  const v2Plans = typeof v2Row.treatment_plans === 'string' ? JSON.parse(v2Row.treatment_plans) : v2Row.treatment_plans;
  
  const plans = buildTreatmentPlansFromOldPatient(row, v2Plans);
  console.log("FINAL PLANS FOR UI:", plans);
}

testFetch().then(() => process.exit(0));
