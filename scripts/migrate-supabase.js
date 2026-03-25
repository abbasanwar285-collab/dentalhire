import { createClient } from '@supabase/supabase-js';
import db from '../server/db/index.js';
import crypto from 'crypto';

// ── Supabase Connection (same DB as old app) ──
const supabaseUrl = 'https://kmjqdtupptbakhpihqfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8';
const supabase = createClient(supabaseUrl, supabaseKey);

function generateId() {
  return crypto.randomUUID();
}

// ── Doctor mapping from old app ──
const DOCTORS_MAP = {
  'dr_abbas': 'د. عباس أنور',
  'dr_ali': 'د. علي رياض',
  'dr_qasim': 'د. قاسم حمودي',
};

// ── Status mapping: old → new ──
function mapAppointmentStatus(oldStatus) {
  switch (oldStatus) {
    case 'completed': return 'completed';
    case 'cancelled': return 'cancelled';
    case 'confirmed':
    case 'arrived':
    case 'pending':
    default: return 'scheduled';
  }
}

// ── Build TreatmentPlan from old patient data ──
function buildTreatmentPlans(patient) {
  const plans = [];

  // ── Plan 1: Regular treatments (procedures + payments) ──
  const procedures = Array.isArray(patient.procedures) ? patient.procedures : [];
  let topLevelPayments = Array.isArray(patient.payments) ? patient.payments : [];

  // Group procedures by Doctor -> then by Date into discrete plans
  // If a patient has multiple procedures on the same day or close days by the same doctor, group them.
  // For simplicity: Group by Doctor + Month.
  const procGroups = {}; // key: "doctorId_YYYY-MM", value: Procedure[]
  
  procedures.forEach(proc => {
    const docId = proc.doctorId || 'unknown';
    const dateObj = proc.date ? new Date(proc.date) : new Date(patient.created_at || Date.now());
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const groupKey = `${docId}_${monthKey}`;
    
    if (!procGroups[groupKey]) procGroups[groupKey] = [];
    procGroups[groupKey].push(proc);
  });

  // If there are no procedures but there are top-level payments or a diagnosis or cost, 
  // create a "Legacy Data" catch-all plan.
  const hasPureLegacyData = procedures.length === 0 && 
    (topLevelPayments.length > 0 || (patient.total_cost && patient.total_cost > 0) || patient.diagnosis);

  if (hasPureLegacyData) {
    plans.push({
      id: generateId(),
      patientId: patient.id,
      name: 'بيانات علاج سابقة',
      createdAt: patient.created_at || new Date().toISOString(),
      totalCost: patient.total_cost || 0,
      paidAmount: patient.paid_amount || 0,
      status: (patient.paid_amount >= patient.total_cost && patient.total_cost > 0) ? 'completed' : 'in_progress',
      treatments: [],
      steps: [],
      payments: topLevelPayments.map(pay => ({
        id: pay.id || generateId(),
        date: pay.date || new Date().toISOString().split('T')[0],
        amount: pay.amount || 0,
        method: 'cash',
        notes: '',
      })),
      attachments: [],
      notes: patient.diagnosis || '',
    });
    topLevelPayments = []; // consumed
  }

  Object.keys(procGroups).forEach((groupKey, index) => {
    const groupProcs = procGroups[groupKey];
    const docId = groupProcs[0].doctorId || '';
    const doctorName = DOCTORS_MAP[docId] || docId;
    
    // Sort procedures in this group by date
    groupProcs.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    const firstProcDate = groupProcs[0].date || patient.created_at || new Date().toISOString();

    const treatments = groupProcs.map(proc => ({
      id: proc.id || generateId(),
      toothNumber: proc.tooth ? parseInt(proc.tooth) || 0 : 0,
      treatmentType: proc.type || 'علاج',
      cost: proc.price || 0,
      doctorId: proc.doctorId || '',
      notes: proc.notes || '',
    }));

    const steps = groupProcs
      .filter(proc => proc.status === 'completed' && proc.date)
      .map(proc => ({
        id: generateId(),
        date: proc.date,
        description: `${proc.type || 'علاج'}${proc.tooth ? ' - سن ' + proc.tooth : ''}`,
        amountPaid: 0,
        doctorId: proc.doctorId || '',
        notes: proc.notes || '',
      }));

    // Procedure-specific payments
    const planPayments = [];
    groupProcs.forEach(proc => {
      if (Array.isArray(proc.payments)) {
        proc.payments.forEach(pp => {
          planPayments.push({
            id: pp.id || generateId(),
            date: pp.date || new Date().toISOString().split('T')[0],
            amount: pp.amount || 0,
            method: 'cash',
            notes: `دفعة لإجراء: ${proc.type || ''}`,
          });
        });
      }
    });

    // Distribute top-level payments to the FIRST plan created, or spread them 
    if (index === 0 && topLevelPayments.length > 0) {
      topLevelPayments.forEach(pay => {
        planPayments.push({
          id: pay.id || generateId(),
          date: pay.date || new Date().toISOString().split('T')[0],
          amount: pay.amount || 0,
          method: 'cash',
          notes: 'دفعة عامة سابقة',
        });
      });
      topLevelPayments = []; // Consumed
    }

    const planTotalCost = groupProcs.reduce((sum, p) => sum + (p.price || 0), 0);
    const planPaidAmount = planPayments.reduce((sum, p) => sum + p.amount, 0);

    plans.push({
      id: generateId(),
      patientId: patient.id,
      name: docId ? `خطة علاج - ${doctorName}` : 'خطة علاج',
      createdAt: firstProcDate,
      totalCost: planTotalCost,
      paidAmount: planPaidAmount,
      status: (planPaidAmount >= planTotalCost && planTotalCost > 0) ? 'completed' : 'in_progress',
      treatments,
      steps,
      payments: planPayments,
      attachments: [],
      notes: index === 0 ? (patient.diagnosis || '') : '', // Attach main diagnosis to first plan
    });
  });

  // ── Plan 2: Ortho plan (if exists) ──
  const orthoVisits = Array.isArray(patient.ortho_visits) ? patient.ortho_visits : [];
  const hasOrtho = (patient.ortho_total_cost && patient.ortho_total_cost > 0) ||
    orthoVisits.length > 0 || patient.ortho_diagnosis;

  if (hasOrtho) {
    // Ortho visits → steps + payments
    const orthoSteps = orthoVisits.map(v => ({
      id: v.id || generateId(),
      date: v.visitDate || '',
      description: `شهر ${v.monthNumber || '?'}: ${v.procedure || 'زيارة تقويم'}`,
      amountPaid: v.paymentReceived || 0,
      doctorId: patient.ortho_doctor_id || '',
      notes: v.notes || '',
    }));

    const orthoPayments = orthoVisits
      .filter(v => v.paymentReceived && v.paymentReceived > 0)
      .map(v => ({
        id: generateId(),
        date: v.visitDate || new Date().toISOString().split('T')[0],
        amount: v.paymentReceived,
        method: 'cash',
        notes: `دفعة تقويم - شهر ${v.monthNumber || '?'}`,
      }));

    const orthoPlan = {
      id: generateId(),
      patientId: patient.id,
      name: 'خطة تقويم الأسنان',
      createdAt: patient.created_at || new Date().toISOString(),
      totalCost: patient.ortho_total_cost || 0,
      paidAmount: patient.ortho_paid_amount || 0,
      status: (patient.ortho_paid_amount >= patient.ortho_total_cost && patient.ortho_total_cost > 0) ? 'completed' : 'in_progress',
      treatments: [{
        id: generateId(),
        toothNumber: 0,
        treatmentType: 'تقويم أسنان (Orthodontics)',
        cost: patient.ortho_total_cost || 0,
        doctorId: patient.ortho_doctor_id || '',
      }],
      steps: orthoSteps,
      payments: orthoPayments,
      attachments: [],
      notes: patient.ortho_diagnosis || '',
      orthoDetails: {
        treatedJaw: 'Both',
        applianceType: 'Fixed Metal',
        caseType: 'Non-Extraction Case',
        expansion: false,
        diagnosis: patient.ortho_diagnosis || '',
      },
      doctorId: patient.ortho_doctor_id || '',
      doctorName: DOCTORS_MAP[patient.ortho_doctor_id] || '',
    };
    plans.push(orthoPlan);
  }

  return plans;
}

// ── Consultation fee as expense ──
function buildConsultationExpenses(patient) {
  const expenses = [];
  const feeCount = patient.consultation_fee_count || 0;
  if (feeCount > 0) {
    for (let i = 0; i < feeCount; i++) {
      // Not creating expenses for consultation fees - they are revenue, not expenses
      // This is handled in the treatment plan's paidAmount
    }
  }
  return expenses;
}

async function migrate() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  Migration: Old Dental App → New App (SQLite) ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Clear existing data first to avoid duplicates on re-run
  console.log('🗑️  Clearing existing SQLite data...');
  db.exec('DELETE FROM patients');
  db.exec('DELETE FROM appointments');
  db.exec('DELETE FROM expenses');
  // Don't delete users - preserve admin account; use INSERT OR REPLACE for doctors
  console.log('   ✅ Cleared.\n');

  let totalErrors = 0;

  // ═══════════════════════════════════════════
  // 1. MIGRATE DOCTORS (hardcoded + allowed_users → users)
  // ═══════════════════════════════════════════
  console.log('👨‍⚕️  Migrating doctors/staff...');
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO users (id, username, display_name, phone, role, is_active, permissions, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    const createdIds = new Set();

    // 1. Create Dr. Abbas as the MAIN ADMIN
    stmt.run('dr_abbas', 'admin', 'د. عباس أنور', '0000', 'admin', 1, JSON.stringify({}), new Date().toISOString());
    createdIds.add('د. عباس أنور');
    createdIds.add('د. عباس'); // prevent migrating the old redundant admin
    count++;
    console.log(`   ✅ د. عباس أنور (admin) — username: admin, phone: 0000`);

    // 2. Create the other 2 doctors
    const hardcodedDoctors = [
      { id: 'dr_ali', username: 'dr_ali', name: 'د. علي رياض', role: 'doctor' },
      { id: 'dr_qasim', username: 'dr_qasim', name: 'د. قاسم حمودي', role: 'doctor' },
    ];

    for (const doc of hardcodedDoctors) {
      stmt.run(doc.id, doc.username, doc.name, '0000', doc.role, 1, JSON.stringify({}), new Date().toISOString());
      createdIds.add(doc.name);
      count++;
      console.log(`   ✅ ${doc.name} (${doc.role})`);
    }

    // 3. Import additional users from allowed_users
    const { data: allowedUsers, error } = await supabase.from('allowed_users').select('*');
    if (error) console.warn('   ⚠️ Could not fetch allowed_users:', error.message);
    else {
      for (const u of (allowedUsers || [])) {
        if (createdIds.has(u.name)) continue;

        const id = u.email.split('@')[0].replace(/\./g, '_') || generateId();
        let role = u.role;
        if (role === 'assistant') role = 'secretary';

        stmt.run(id, id, u.name, '0000', role, 1, JSON.stringify({}), u.created_at || new Date().toISOString());
        count++;
        console.log(`   ✅ ${u.name} (${role})`);
      }
    }

    console.log(`   → ${count} users migrated.\n`);
  } catch (err) {
    console.error('   ❌ Error migrating users:', err.message);
    totalErrors++;
  }

  // ═══════════════════════════════════════════
  // 2. MIGRATE PATIENTS
  // ═══════════════════════════════════════════
  console.log('🏥  Migrating patients...');
  try {
    const { data: patients, error } = await supabase.from('patients').select('*');
    if (error) throw error;

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO patients (
        id, name, phone, age, medical_history, general_notes, treatment_plans
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let pCount = 0;
    let planCount = 0;
    let orthoCount = 0;

    for (const p of (patients || [])) {
      const treatmentPlans = buildTreatmentPlans(p);
      planCount += treatmentPlans.filter(tp => tp.name !== 'خطة تقويم الأسنان').length;
      orthoCount += treatmentPlans.filter(tp => tp.name === 'خطة تقويم الأسنان').length;

      // Build general notes with gender info if available
      let notes = p.notes || '';
      if (p.gender) {
        notes = `[${p.gender === 'male' ? 'ذكر' : p.gender === 'female' ? 'أنثى' : p.gender}] ${notes}`;
      }

      stmt.run(
        p.id,
        p.name,
        p.mobile || '',
        p.age || null,
        p.diagnosis || '',          // medical_history
        notes,                       // general_notes
        JSON.stringify(treatmentPlans)
      );
      pCount++;
    }
    console.log(`   → ${pCount} patients migrated.`);
    console.log(`   → ${planCount} treatment plans created.`);
    console.log(`   → ${orthoCount} ortho plans created.\n`);
  } catch (err) {
    console.error('   ❌ Error migrating patients:', err.message);
    totalErrors++;
  }

  // ═══════════════════════════════════════════
  // 3. MIGRATE APPOINTMENTS
  // ═══════════════════════════════════════════
  console.log('📅  Migrating appointments...');
  try {
    const { data: appointments, error } = await supabase.from('appointments').select('*');
    if (error) throw error;

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO appointments (
        id, patient_id, patient_name, doctor_id, doctor_name, date, time, treatment, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let aCount = 0;
    for (const a of (appointments || [])) {
      const doctorName = DOCTORS_MAP[a.doctor_id] || a.doctor_id || '';
      const status = mapAppointmentStatus(a.status);

      stmt.run(
        a.id,
        a.patient_id || '',
        a.patient_name || '',
        a.doctor_id || '',
        doctorName,
        a.date || '',
        a.time || '',
        a.type || 'غيرها',           // treatment = old type
        status,
        a.notes || ''
      );
      aCount++;
    }
    console.log(`   → ${aCount} appointments migrated.\n`);
  } catch (err) {
    console.error('   ❌ Error migrating appointments:', err.message);
    totalErrors++;
  }

  // ═══════════════════════════════════════════
  // 4. MIGRATE EXPENSES
  // ═══════════════════════════════════════════
  console.log('💰  Migrating expenses...');
  try {
    const { data: expenses, error } = await supabase.from('expenses').select('*');
    if (error) throw error;

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO expenses (
        id, amount, category, description, date, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    let eCount = 0;
    for (const e of (expenses || [])) {
      // Map old category to new ExpenseCategory
      let category = e.category || 'other';
      const validCategories = ['supply', 'salary', 'rent', 'maintenance', 'other'];
      if (!validCategories.includes(category)) {
        category = 'other';
      }

      stmt.run(
        e.id,
        e.amount || 0,
        category,
        e.description || '',
        e.date || new Date().toISOString().split('T')[0],
        e.created_by || ''
      );
      eCount++;
    }
    console.log(`   → ${eCount} expenses migrated.\n`);
  } catch (err) {
    console.error('   ❌ Error migrating expenses:', err.message);
    totalErrors++;
  }

  // ═══════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════
  console.log('═══════════════════════════════════════════');
  if (totalErrors === 0) {
    console.log('🎉  Migration completed successfully! No errors.');
  } else {
    console.log(`⚠️  Migration completed with ${totalErrors} error(s).`);
  }
  console.log('═══════════════════════════════════════════');

  // Verify counts
  const patientCount = db.prepare('SELECT COUNT(*) as c FROM patients').get();
  const apptCount = db.prepare('SELECT COUNT(*) as c FROM appointments').get();
  const expCount = db.prepare('SELECT COUNT(*) as c FROM expenses').get();
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();

  console.log('\n📊  SQLite Database Summary:');
  console.log(`   Patients:     ${patientCount.c}`);
  console.log(`   Appointments: ${apptCount.c}`);
  console.log(`   Expenses:     ${expCount.c}`);
  console.log(`   Users:        ${userCount.c}`);
}

migrate().catch(err => {
  console.error('\n💥  FATAL ERROR:', err);
  process.exit(1);
});
