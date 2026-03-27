/**
 * Supabase Data Service — UNIFIED
 * Reads/writes from OLD app tables (patients, appointments, expenses)
 * so both old and new apps share the same data.
 * Handles camelCase ↔ snake_case mapping.
 */
import { supabase } from './supabaseClient';
import type {
  Patient, Appointment, ClinicExpense, SupplyRequest,
  ClinicTask, AppUser, WaitingPatient, ArrivalRecord, Treatment
} from '../types';
import type { ClinicSettings } from '../context/ClinicContext';

// ═══════════════════════════════════════════
// PATIENTS  (table: "patients" — OLD APP)
// ═══════════════════════════════════════════

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/**
 * Convert old app's flat patient record into new app's TreatmentPlans array.
 * Old: procedures[], ortho_visits[], payments[], total_cost, paid_amount, ortho_total_cost, ortho_paid_amount
 * New: treatmentPlans[{ treatments[], payments[], totalCost, paidAmount, orthoDetails }]
 */
const buildTreatmentPlansFromOldPatient = (row: any, v2Plans: any[]): any[] => {
  const plans: any[] = [];
  
  // Get the saved rich plans from v2 table (passed as v2Plans)
  const savedPlans = v2Plans || [];
  const savedGeneral = savedPlans.find((p: any) => p.name === 'علاج عام' || (!p.orthoDetails && !p.name?.includes('تقويم')));
  const savedOrtho = savedPlans.find((p: any) => p.orthoDetails || p.name?.includes('تقويم'));

  // 1) General treatment plan from procedures + payments
  const hasGeneral = (row.procedures && row.procedures.length > 0) || 
                     (row.payments && row.payments.length > 0) || 
                     (row.total_cost || 0) > 0 || savedGeneral;
  if (hasGeneral) {
    const procs = (typeof row.procedures === 'string' ? JSON.parse(row.procedures) : row.procedures) || [];
    const pays = (typeof row.payments === 'string' ? JSON.parse(row.payments) : row.payments) || [];
    const savedTreatments = savedGeneral?.treatments || [];
    
    plans.push({
      id: savedGeneral?.id || `gen-${row.id}`,
      patientId: row.id,
      name: savedGeneral?.name || "علاج عام",
      createdAt: savedGeneral?.createdAt || row.created_at || new Date().toISOString(),
      // Top-level costs from flat fields (Old App updates these)
      totalCost: Number(row.total_cost) || savedGeneral?.totalCost || 0,
      paidAmount: Number(row.paid_amount) || savedGeneral?.paidAmount || 0,
      status: procs.length > 0 ? "in_progress" : "planned",
      treatments: procs.map((proc: any, index: number) => {
        const saved = savedTreatments.find((t: any) => t.id === proc.id) || savedTreatments[index] || {};
        return {
          id: proc.id || saved.id || generateId(),
          treatmentType: proc.name || proc.type || saved.treatmentType || "إجراء طبي",
          cost: Number(proc.price || proc.amount || saved.cost) || 0, // Fallback to saved JSON cost!
          doctorId: proc.doctorId || proc.doctor_id || saved.doctorId || '',
          toothNumber: proc.tooth || proc.toothNumber || saved.toothNumber || 0,
          notes: proc.notes || saved.notes || ''
        };
      }),
      payments: pays.map((pay: any) => ({
        id: pay.id || generateId(),
        date: pay.date || new Date().toISOString().split('T')[0],
        amount: Number(pay.amount) || 0,
        method: pay.method || 'cash',
        doctorId: pay.doctorId || pay.doctor_id || ''
      })),
      steps: savedGeneral?.steps || [],
      notes: row.diagnosis || row.notes || savedGeneral?.notes || ''
    });
  }

  // 2) Ortho treatment plan from ortho_visits
  const hasOrtho = (row.ortho_visits && row.ortho_visits.length > 0) || 
                   (row.ortho_total_cost || 0) > 0 || savedOrtho;
  if (hasOrtho) {
    const visits = (typeof row.ortho_visits === 'string' ? JSON.parse(row.ortho_visits) : row.ortho_visits) || [];
    const orthoPayments = visits.filter((v: any) => (v.payment || 0) > 0).map((v: any, index: number) => {
      const savedPay = (savedOrtho?.payments || [])[index] || {};
      return {
        id: v.id || savedPay.id || generateId(),
        date: v.date || savedPay.date || new Date().toISOString().split('T')[0],
        amount: Number(v.payment) || savedPay.amount || 0,
        method: 'cash',
        doctorId: row.ortho_doctor_id || savedPay.doctorId || '',
        wireSizeUpper: v.wireSizeUpper || v.wire_size_upper || savedPay.wireSizeUpper || undefined,
        wireSizeLower: v.wireSizeLower || v.wire_size_lower || savedPay.wireSizeLower || undefined,
        notes: v.notes || savedPay.notes || undefined
      };
    });

    plans.push({
      id: savedOrtho?.id || `ortho-${row.id}`,
      patientId: row.id,
      name: "خطة تقويم الأسنان",
      createdAt: savedOrtho?.createdAt || row.created_at || new Date().toISOString(),
      totalCost: Number(row.ortho_total_cost) || savedOrtho?.totalCost || 0,
      paidAmount: Number(row.ortho_paid_amount) || savedOrtho?.paidAmount || 0,
      status: visits.length > 0 ? "in_progress" : "planned",
      doctorId: row.ortho_doctor_id || savedOrtho?.doctorId || '',
      orthoDetails: savedOrtho?.orthoDetails || {
        diagnosis: row.ortho_diagnosis || '',
        caseType: 'Non-Extraction Case',
        treatedJaw: 'Both',
        applianceType: 'Fixed Metal',
        expansion: false
      },
      treatments: savedOrtho?.treatments || [{
        id: generateId(),
        treatmentType: 'تقويم أسنان (Orthodontics)',
        cost: Number(row.ortho_total_cost) || 0,
        doctorId: row.ortho_doctor_id || '',
        toothNumber: 0
      }],
      steps: visits.map((v: any, index: number) => {
        const savedStep = (savedOrtho?.steps || [])[index] || {};
        return {
          id: v.id || savedStep.id || generateId(),
          date: v.date || savedStep.date || '',
          description: v.notes || savedStep.description || 'زيارة تقويم',
          amountPaid: Number(v.payment) || savedStep.amountPaid || 0,
          doctorId: row.ortho_doctor_id || savedStep.doctorId || ''
        };
      }),
      payments: orthoPayments,
      notes: savedOrtho?.notes || ''
    });
  }

  // Also check if there are treatment_plans already stored (from new app writes)
  if (savedPlans.length > 0) {
    // Merge any plans that were added via the new app (not covered by gen/ortho)
    for (const tp of savedPlans) {
      if (tp.id !== savedGeneral?.id && tp.id !== savedOrtho?.id) {
        const isDuplicate = plans.some(p => p.id === tp.id);
        if (!isDuplicate) {
          plans.push(tp);
        }
      }
    }
  }

  return plans;
};

/**
 * Reverse: convert new app's treatmentPlans back to old app format when saving.
 */
const extractOldFieldsFromPlans = (plans: any[]) => {
  const generalPlan = plans.find(p => p.name === 'علاج عام' || (!p.orthoDetails && !p.name?.includes('تقويم')));
  const orthoPlan = plans.find(p => p.orthoDetails || p.name?.includes('تقويم'));
  
  let procedures: any[] = [];
  let payments: any[] = [];
  let totalCost = 0;
  let paidAmount = 0;
  let diagnosis = '';

  if (generalPlan) {
    procedures = (generalPlan.treatments || []).map((t: any) => ({
      id: t.id,
      name: t.treatmentType,
      price: t.cost,
      tooth: t.toothNumber,
      notes: t.notes || '',
      doctorId: t.doctorId || '',
    }));
    payments = (generalPlan.payments || []).map((p: any) => ({
      id: p.id,
      date: p.date,
      amount: p.amount,
      method: p.method || 'cash',
      doctorId: p.doctorId || '',
    }));
    totalCost = generalPlan.totalCost || 0;
    paidAmount = generalPlan.paidAmount || 0;
    diagnosis = generalPlan.notes || '';
  }

  let orthoVisits: any[] = [];
  let orthoTotalCost = 0;
  let orthoPaidAmount = 0;
  let orthoDiagnosis = '';
  let orthoDoctorId = '';

  if (orthoPlan) {
    orthoVisits = (orthoPlan.payments || []).map((p: any) => ({
      id: p.id,
      date: p.date,
      payment: p.amount,
      notes: p.notes || '',
      wireSizeUpper: p.wireSizeUpper || '',
      wireSizeLower: p.wireSizeLower || '',
    }));
    orthoTotalCost = orthoPlan.totalCost || 0;
    orthoPaidAmount = orthoPlan.paidAmount || 0;
    orthoDiagnosis = orthoPlan.orthoDetails?.diagnosis || '';
    orthoDoctorId = orthoPlan.doctorId || '';
  }

  return {
    procedures,
    payments,
    total_cost: totalCost,
    paid_amount: paidAmount,
    diagnosis,
    ortho_visits: orthoVisits,
    ortho_total_cost: orthoTotalCost,
    ortho_paid_amount: orthoPaidAmount,
    ortho_diagnosis: orthoDiagnosis,
    ortho_doctor_id: orthoDoctorId,
  };
};

const mapPatientFromDB = (row: any, v2Plans: any[]): Patient => ({
  id: row.id,
  name: row.name,
  phone: row.mobile || row.phone || '',
  email: '',
  dateOfBirth: '',
  age: row.age,
  bloodType: '',
  allergies: '',
  medicalHistory: row.diagnosis || '',
  generalNotes: row.notes || '',
  lastVisit: '',
  treatmentPlans: buildTreatmentPlansFromOldPatient(row, v2Plans),
  createdAt: row.created_at,
});

const mapPatientToDB = (p: Patient) => {
  const oldFields = extractOldFieldsFromPlans(p.treatmentPlans || []);
  return {
    id: p.id,
    name: p.name,
    mobile: p.phone || null,
    age: p.age || null,
    notes: p.generalNotes || null,
    // Write back old-format fields so the old app sees them
    procedures: oldFields.procedures,
    payments: oldFields.payments,
    total_cost: oldFields.total_cost,
    paid_amount: oldFields.paid_amount,
    diagnosis: oldFields.diagnosis || p.medicalHistory || null,
    ortho_visits: oldFields.ortho_visits,
    ortho_total_cost: oldFields.ortho_total_cost,
    ortho_paid_amount: oldFields.ortho_paid_amount,
    ortho_diagnosis: oldFields.ortho_diagnosis,
    ortho_doctor_id: oldFields.ortho_doctor_id || null,
    // treatment_plans removed here, as it goes to patients_v2
  };
};

export async function fetchPatients(): Promise<Patient[] | null> {
  // 1) Fetch main data from old patients table
  const { data: oldData, error: oldError } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (oldError) {
    console.error('[Supabase] fetchPatients (old):', oldError);
    return null;
  }
  
  // 2) Fetch rich treatment plans from patients_v2 (extension table)
  const { data: v2Data, error: v2Error } = await supabase
    .from('patients_v2')
    .select('id, treatment_plans');
    
  if (v2Error) {
    console.error('[Supabase] fetchPatients (v2):', v2Error);
    // Proceed without v2 data if it fails, but ideally it works
  }
  
  const v2Map = new Map();
  if (v2Data) {
    v2Data.forEach(p => {
      v2Map.set(p.id, typeof p.treatment_plans === 'string' ? JSON.parse(p.treatment_plans) : (p.treatment_plans || []));
    });
  }

  return (oldData || []).map(row => mapPatientFromDB(row, v2Map.get(row.id) || []));
}

export async function upsertPatient(patient: Patient): Promise<void> {
  const dbData = mapPatientToDB(patient);
  Object.keys(dbData).forEach(k => { if ((dbData as any)[k] === undefined) delete (dbData as any)[k]; });
  
  // 1) Upsert core fields into OLD patients table
  const { error: oldError } = await supabase
    .from('patients')
    .upsert(dbData);
    
  if (oldError) {
    console.error('[Supabase] upsertPatient (old):', oldError);
    throw oldError;
  }
  
  // 2) Upsert rich plans into patients_v2 (extension table)
  // We need to write name as required field, though we only care about treatment_plans 
  const { error: v2Error } = await supabase
    .from('patients_v2')
    .upsert({
      id: patient.id,
      name: patient.name, 
      phone: patient.phone || null,
      age: patient.age || null,
      treatment_plans: patient.treatmentPlans || []
    });
    
  if (v2Error) {
    console.error('[Supabase] upsertPatient (v2):', v2Error);
    // Don't throw for v2 failure to allow base data to save, but log it
  }
}

export async function deletePatientDB(id: string): Promise<void> {
  // Delete from both starting with extension
  await supabase.from('patients_v2').delete().eq('id', id);
  const { error } = await supabase.from('patients').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] deletePatient:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════
// APPOINTMENTS  (table: "appointments" — OLD APP)
// ═══════════════════════════════════════════

const mapAppointmentFromDB = (row: any): Appointment => ({
  id: row.id,
  patientId: row.patient_id || '',
  patientName: row.patient_name || '',
  doctorId: row.doctor_id || '',
  doctorName: row.doctor_name || '',
  date: row.date,
  time: row.time,
  treatment: row.type || row.treatment || '',
  status: row.status || 'scheduled',
  notes: row.notes || '',
});

const mapAppointmentToDB = (a: Appointment) => ({
  id: a.id,
  patient_id: a.patientId,
  patient_name: a.patientName,
  doctor_id: a.doctorId,
  date: a.date,
  time: a.time,
  type: a.treatment,  // Old app uses 'type' column
  status: a.status,
  notes: a.notes,
});

export async function fetchAppointments(): Promise<Appointment[] | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('date', { ascending: false });
  if (error) {
    console.error('[Supabase] fetchAppointments:', error);
    return null;
  }
  return (data || []).map(mapAppointmentFromDB);
}

export async function upsertAppointment(appointment: Appointment): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .upsert(mapAppointmentToDB(appointment));
  if (error) {
    console.error('[Supabase] upsertAppointment:', error);
    throw error;
  }
}

export async function deleteAppointmentDB(id: string): Promise<void> {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] deleteAppointment:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════
// EXPENSES  (table: "expenses" — OLD APP)
// ═══════════════════════════════════════════

const mapExpenseFromDB = (row: any): ClinicExpense => ({
  id: row.id,
  amount: row.amount,
  category: row.category || 'other',
  description: row.description || '',
  date: row.date,
  createdByUserId: row.created_by || row.created_by_user_id || '',
  supplyRequestId: '',
});

const mapExpenseToDB = (e: ClinicExpense) => {
  const obj: Record<string, any> = {
    id: e.id,
    amount: e.amount,
    category: e.category,
    description: e.description,
    date: e.date,
    created_by: e.createdByUserId,  // Old app uses 'created_by'
  };
  Object.keys(obj).forEach(k => { if (obj[k] === undefined) delete obj[k]; });
  return obj;
};

export async function fetchExpenses(): Promise<ClinicExpense[] | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });
  if (error) {
    console.error('[Supabase] fetchExpenses:', error);
    return null;
  }
  return (data || []).map(mapExpenseFromDB);
}

export async function upsertExpense(expense: ClinicExpense): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .upsert(mapExpenseToDB(expense));
  if (error) {
    console.error('[Supabase] upsertExpense:', error);
    throw error;
  }
}

export async function deleteExpenseDB(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] deleteExpense:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════
// USERS  (table: "app_users" — KEPT AS IS, new-app-only)
// The old app uses "allowed_users" with email-based auth.
// The new app uses "app_users" with username/phone auth.
// These are kept separate since auth models are different.
// ═══════════════════════════════════════════

const mapUserFromDB = (row: any): AppUser => ({
  id: row.id,
  username: row.username,
  displayName: row.display_name || '',
  phone: row.phone || '',
  role: row.role || 'secretary',
  permissions: typeof row.permissions === 'string'
    ? JSON.parse(row.permissions)
    : (row.permissions || {}),
  isActive: row.is_active !== false,
  createdAt: row.created_at || '',
  color: row.color,
  specialization: row.specialization,
  salaryType: row.salary_type,
  fixedSalary: row.fixed_salary,
  percentage: row.percentage,
  salaryStartDate: row.salary_start_date,
  bonuses: typeof row.bonuses === 'string' ? JSON.parse(row.bonuses) : (row.bonuses || []),
  deductions: typeof row.deductions === 'string' ? JSON.parse(row.deductions) : (row.deductions || []),
  salaryNotes: row.salary_notes,
});

const mapUserToDB = (u: AppUser) => ({
  id: u.id,
  username: u.username,
  display_name: u.displayName,
  phone: u.phone,
  role: u.role,
  permissions: u.permissions || {},
  is_active: u.isActive,
  created_at: u.createdAt,
  color: u.color,
  specialization: u.specialization,
  salary_type: u.salaryType,
  fixed_salary: u.fixedSalary,
  percentage: u.percentage,
  salary_start_date: u.salaryStartDate,
  bonuses: u.bonuses || [],
  deductions: u.deductions || [],
  salary_notes: u.salaryNotes,
});

export async function fetchUsers(): Promise<AppUser[] | null> {
  const { data, error } = await supabase
    .from('app_users')
    .select('*');
  if (error) {
    console.error('[Supabase] fetchUsers:', error);
    return null;
  }
  return (data || []).map(mapUserFromDB);
}

export async function upsertUser(user: AppUser): Promise<void> {
  const { error } = await supabase
    .from('app_users')
    .upsert(mapUserToDB(user));
  if (error) {
    console.error('[Supabase] upsertUser:', error);
    throw error;
  }
}

export async function deleteUserDB(id: string): Promise<void> {
  const { error } = await supabase.from('app_users').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] deleteUser:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════
// SUPPLY REQUESTS  (table: "app_supply_requests")
// ═══════════════════════════════════════════

const mapSupplyFromDB = (row: any): SupplyRequest => ({
  id: row.id,
  name: row.name,
  quantity: row.quantity || 1,
  unit: row.unit,
  urgency: row.urgency || 'normal',
  notes: row.notes,
  requestedByUserId: row.requested_by_user_id || '',
  status: row.status || 'pending',
  createdAt: row.created_at || '',
  purchasedAt: row.purchased_at,
  purchasePrice: row.purchase_price,
});

const mapSupplyToDB = (r: SupplyRequest) => ({
  id: r.id,
  name: r.name,
  quantity: r.quantity,
  unit: r.unit,
  urgency: r.urgency,
  notes: r.notes,
  requested_by_user_id: r.requestedByUserId,
  status: r.status,
  created_at: r.createdAt,
  purchased_at: r.purchasedAt,
  purchase_price: r.purchasePrice,
});

export async function fetchSupplyRequests(): Promise<SupplyRequest[] | null> {
  const { data, error } = await supabase
    .from('app_supply_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[Supabase] fetchSupplyRequests:', error);
    return null;
  }
  return (data || []).map(mapSupplyFromDB);
}

export async function upsertSupplyRequest(req: SupplyRequest): Promise<void> {
  const { error } = await supabase
    .from('app_supply_requests')
    .upsert(mapSupplyToDB(req));
  if (error) {
    console.error('[Supabase] upsertSupplyRequest:', error);
    throw error;
  }
}

export async function deleteSupplyRequestDB(id: string): Promise<void> {
  const { error } = await supabase.from('app_supply_requests').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] deleteSupplyRequest:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════
// TASKS  (table: "app_tasks")
// ═══════════════════════════════════════════

const mapTaskFromDB = (row: any): ClinicTask => ({
  id: row.id,
  title: row.title,
  description: row.description,
  priority: row.priority || 'normal',
  assignedToUserId: row.assigned_to_user_id || '',
  createdByUserId: row.created_by_user_id || '',
  status: row.status || 'pending',
  relatedPatientId: row.related_patient_id,
  dueDate: row.due_date || '',
  createdAt: row.created_at || '',
  completedAt: row.completed_at,
});

const mapTaskToDB = (t: ClinicTask) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  priority: t.priority,
  assigned_to_user_id: t.assignedToUserId,
  created_by_user_id: t.createdByUserId,
  status: t.status,
  related_patient_id: t.relatedPatientId,
  due_date: t.dueDate,
  created_at: t.createdAt,
  completed_at: t.completedAt,
});

export async function fetchTasks(): Promise<ClinicTask[] | null> {
  const { data, error } = await supabase
    .from('app_tasks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[Supabase] fetchTasks:', error);
    return null;
  }
  return (data || []).map(mapTaskFromDB);
}

export async function upsertTask(task: ClinicTask): Promise<void> {
  const { error } = await supabase
    .from('app_tasks')
    .upsert(mapTaskToDB(task));
  if (error) {
    console.error('[Supabase] upsertTask:', error);
    throw error;
  }
}

export async function deleteTaskDB(id: string): Promise<void> {
  const { error } = await supabase.from('app_tasks').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] deleteTask:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════
// SETTINGS (table: "app_settings")
// ═══════════════════════════════════════════

export async function fetchSettings(): Promise<ClinicSettings | null> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'default')
      .single();
      
    if (error) {
      if (error.code !== 'PGRST116' && error.code !== 'PGRST205' && !error.message?.includes('Could not find')) {
        console.error('[Supabase] fetchSettings:', error);
      }
      return null;
    }
    
    if (!data) return null;
    return {
      clinicName: data.clinic_name || 'Iris Clinic',
      clinicPhone: data.clinic_phone || '',
      clinicAddress: data.clinic_address || '',
    };
  } catch (e) {
    return null;
  }
}

export async function upsertSettings(settings: ClinicSettings): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .upsert({
      id: 'default',
      clinic_name: settings.clinicName,
      clinic_phone: settings.clinicPhone,
      clinic_address: settings.clinicAddress,
    });
    
  if (error) {
    console.error('[Supabase] upsertSettings:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════
// TREATMENTS (table: "app_treatments")
// ═══════════════════════════════════════════

const mapTreatmentFromDB = (row: any): Treatment => ({
  id: row.id,
  name: row.name,
  price: row.price || 0,
  duration: row.duration || 30,
});

const mapTreatmentToDB = (t: Treatment) => ({
  id: t.id,
  name: t.name,
  price: t.price,
  duration: t.duration,
});

export async function fetchTreatments(): Promise<Treatment[] | null> {
  try {
    const { data, error } = await supabase
      .from('app_treatments')
      .select('*')
      .order('name');
    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('Could not find')) {
        return [];
      }
      console.error('[Supabase] fetchTreatments:', error);
      return [];
    }
    return (data || []).map(mapTreatmentFromDB);
  } catch (e) {
    return [];
  }
}

export async function upsertTreatment(treatment: Treatment): Promise<void> {
  const { error } = await supabase
    .from('app_treatments')
    .upsert(mapTreatmentToDB(treatment));
  if (error) {
    console.error('[Supabase] upsertTreatment:', error);
    throw error;
  }
}

export async function deleteTreatmentDB(id: string): Promise<void> {
  const { error } = await supabase
    .from('app_treatments')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('[Supabase] deleteTreatment:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════
// WAITING ROOM  (localStorage only - ephemeral)
// ═══════════════════════════════════════════
