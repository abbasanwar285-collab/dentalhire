import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kmjqdtupptbakhpihqfc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const data = JSON.parse(fs.readFileSync('clinic/clinic_all_database_data.json', 'utf8'));
const oldPatients = data.patients || [];

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

async function fixRajaa() {
  const { data: supaPatients } = await supabase.from('patients_v2').select('id, name, treatment_plans');
  
  const oldP = oldPatients.find(p => p.name && p.name.includes('رجاء') && p.name.includes('طاهر'));
  if (!oldP) return console.log('Rajaa missing in old db');
  
  const targetPatient = supaPatients.find(p => p.name && p.name.includes('رجاء') && p.name.includes('طاهر'));
  if (!targetPatient) return console.log('Rajaa missing in supabase');
  
  console.log('Found Rajaa in both!');
  console.log('Old ID:', oldP.id, 'New ID:', targetPatient.id);
  
  const existingPlans = Array.isArray(targetPatient.treatment_plans) ? targetPatient.treatment_plans : [];
  const newPlans = [...existingPlans];
  
  const hasOldGeneral = (oldP.procedures && oldP.procedures.length > 0) || (oldP.payments && oldP.payments.length > 0) || (oldP.total_cost || 0) > 0;
  
  if (hasOldGeneral) {
    console.log('Rajaa has general plan to migrate!');
    newPlans.push({
        id: generateId(),
        patientId: targetPatient.id,
        name: "علاج عام",
        createdAt: oldP.created_at || new Date().toISOString(),
        totalCost: oldP.total_cost || 0,
        paidAmount: oldP.paid_amount || 0,
        status: (oldP.procedures && oldP.procedures.length > 0) ? "in_progress" : "planned",
        treatments: (oldP.procedures || []).map(proc => ({
            id: generateId(),
            treatmentType: proc.name || proc.type || "إجراء طبي",
            cost: proc.price || proc.amount || 0,
            doctorId: 'dr_abbas',
            toothNumber: proc.tooth || 0,
            notes: proc.notes || ''
        })),
        payments: (oldP.payments || []).map(pay => ({
            id: generateId(),
            date: pay.date || new Date().toISOString().split('T')[0],
            amount: pay.amount || 0,
            method: pay.method || 'cash',
            doctorId: 'dr_abbas'
        })),
        steps: [],
        notes: oldP.diagnosis || oldP.notes || ''
    });
    
    // Sum up costs if total_cost is 0 but procedures have cost!
    const plan = newPlans[newPlans.length - 1];
    if (plan.totalCost === 0) {
      plan.totalCost = plan.treatments.reduce((sum, t) => sum + (Number(t.cost) || 0), 0);
    }
  }

  const { error } = await supabase
      .from('patients_v2')
      .update({ treatment_plans: newPlans })
      .eq('id', targetPatient.id);
      
  if (error) console.error('Failed to update Rajaa:', error);
  else console.log('Successfully updated Rajaa Taher!');
}

fixRajaa();
