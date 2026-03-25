import crypto from 'crypto';

export function generateId() {
  return crypto.randomUUID();
}

export const DOCTORS_MAP = {
  'dr_abbas': 'د. عباس أنور',
  'dr_ali': 'د. علي رياض',
  'dr_qasim': 'د. قاسم حمودي',
};

export function mapAppointmentStatus(oldStatus) {
  switch (oldStatus) {
    case 'completed': return 'completed';
    case 'cancelled': return 'cancelled';
    case 'confirmed':
    case 'arrived':
    case 'pending':
    default: return 'scheduled';
  }
}

export function buildTreatmentPlans(patient) {
  const plans = [];

  // ── Plan 1: Regular treatments (procedures + payments) ──
  const procedures = Array.isArray(patient.procedures) ? patient.procedures : [];
  let topLevelPayments = Array.isArray(patient.payments) ? patient.payments : [];

  // Group procedures by Doctor -> then by Date into discrete plans
  const procGroups = {}; // key: "doctorId_YYYY-MM", value: Procedure[]
  
  procedures.forEach(proc => {
    const docId = proc.doctorId || 'unknown';
    const dateObj = proc.date ? new Date(proc.date) : new Date(patient.created_at || Date.now());
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const groupKey = `${docId}_${monthKey}`;
    
    if (!procGroups[groupKey]) procGroups[groupKey] = [];
    procGroups[groupKey].push(proc);
  });

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
      topLevelPayments = []; 
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
      notes: index === 0 ? (patient.diagnosis || '') : '', 
    });
  });

  // ── Plan 2: Ortho plan (if exists) ──
  const orthoVisits = Array.isArray(patient.ortho_visits) ? patient.ortho_visits : [];
  const hasOrtho = (patient.ortho_total_cost && patient.ortho_total_cost > 0) ||
    orthoVisits.length > 0 || patient.ortho_diagnosis;

  if (hasOrtho) {
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
