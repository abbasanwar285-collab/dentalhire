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

async function migrateMissingPlans() {
  const { data: supaPatients } = await supabase.from('patients_v2').select('id, name, treatment_plans');
  let updatedCount = 0;

  for (const oldP of oldPatients) {
    const targetPatient = supaPatients.find(p => p.id === oldP.id);
    if (!targetPatient) continue;
    
    const existingPlans = Array.isArray(targetPatient.treatment_plans) ? targetPatient.treatment_plans : [];
    const newPlans = [...existingPlans];
    
    // Check if the old data actually has any substance
    const hasOldGeneral = (oldP.procedures && oldP.procedures.length > 0) || (oldP.payments && oldP.payments.length > 0) || (oldP.total_cost || 0) > 0;
    const hasOldOrtho = (oldP.ortho_visits && oldP.ortho_visits.length > 0) || (oldP.ortho_total_cost || 0) > 0;

    // We skip merging if the patient already has a plan with the exact same totalCost or if they already have 2+ plans which implies they were already fully migrated manually
    const existingGeneral = existingPlans.find(p => p.name === 'علاج عام');
    const existingOrtho = existingPlans.find(p => p.name === 'خطة تقويم الأسنان' || p.name === 'تقويم أسنان');

    let shouldUpdate = false;

    if (hasOldGeneral) {
        // If we don't have a general plan OR the existing one is empty (totalCost == 0 and 0 payments)
        if (!existingGeneral || (existingGeneral.totalCost === 0 && existingGeneral.payments.length === 0 && oldP.total_cost > 0)) {
            // we remove the empty one if it exists
            const filteredPlans = newPlans.filter(p => p !== existingGeneral);
            filteredPlans.push({
                id: generateId(),
                patientId: oldP.id,
                name: "علاج عام",
                createdAt: oldP.created_at || new Date().toISOString(),
                totalCost: oldP.total_cost || 0,
                paidAmount: oldP.paid_amount || 0,
                status: (oldP.procedures && oldP.procedures.length > 0) ? "in_progress" : "planned",
                treatments: (oldP.procedures || []).map(proc => ({
                    id: generateId(),
                    treatmentType: proc.name || proc.type || "إجراء طبي",
                    cost: proc.price || 0,
                    doctorId: 'dr_abbas',
                    toothNumber: 0,
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
            // swap the array
            newPlans.length = 0;
            newPlans.push(...filteredPlans);
            shouldUpdate = true;
        }
    }

    if (hasOldOrtho) {
        // Same logic for Ortho
        if (!existingOrtho || (existingOrtho.totalCost === 0 && existingOrtho.steps.length === 0 && oldP.ortho_total_cost > 0)) {
            const filteredPlans = newPlans.filter(p => p !== existingOrtho);
            filteredPlans.push({
                id: generateId(),
                patientId: oldP.id,
                name: "خطة تقويم الأسنان",
                createdAt: oldP.created_at || new Date().toISOString(),
                totalCost: oldP.ortho_total_cost || 0,
                paidAmount: oldP.ortho_paid_amount || 0,
                status: (oldP.ortho_visits && oldP.ortho_visits.length > 0) ? "in_progress" : "planned",
                doctorId: oldP.ortho_doctor_id || 'dr_ali',
                orthoDetails: {
                   diagnosis: oldP.ortho_diagnosis || '',
                   caseType: 'Non-Extraction Case',
                   treatedJaw: 'Both',
                   applianceType: 'Fixed Metal',
                   expansion: false
                },
                treatments: [{
                    id: generateId(),
                    treatmentType: 'تقويم أسنان (Orthodontics)',
                    cost: oldP.ortho_total_cost || 0,
                    doctorId: oldP.ortho_doctor_id || 'dr_ali',
                    toothNumber: 0
                }],
                steps: (oldP.ortho_visits || []).map(v => ({
                    id: generateId(),
                    date: v.date || new Date().toISOString().split('T')[0],
                    description: v.notes || "زيارة تقويم",
                    amountPaid: v.payment || 0,
                    doctorId: oldP.ortho_doctor_id || 'dr_ali'
                })),
                payments: (oldP.ortho_visits || []).filter(v => v.payment > 0).map(v => ({
                    id: generateId(),
                    date: v.date || new Date().toISOString().split('T')[0],
                    amount: v.payment || 0,
                    method: 'cash',
                    doctorId: oldP.ortho_doctor_id || 'dr_ali'
                })),
                notes: ''
            });
            newPlans.length = 0;
            newPlans.push(...filteredPlans);
            shouldUpdate = true;
        }
    }

    if (shouldUpdate) {
        const { error } = await supabase
            .from('patients_v2')
            .update({ treatment_plans: newPlans })
            .eq('id', oldP.id);
            
        if (error) {
            console.error(`Failed to update plans for ${oldP.id}:`, error);
        } else {
            updatedCount++;
            console.log(`Migrated plans for: ${targetPatient.name}`);
        }
    }
  }

  console.log(`Successfully migrated treatment plans from old DB for ${updatedCount} patients!`);
}

migrateMissingPlans();
