import { Appointment, Patient, WaitingPatient } from '../types';

export type DisplayStatus = 'upcoming' | 'arrived' | 'in_treatment' | 'completed' | 'missed' | 'cancelled';

interface DisplayStatusResult {
  status: DisplayStatus;
  label: string;
  color: string;       // text color class
  bgColor: string;     // background color class
}

/**
 * Smart appointment status algorithm — synced with waiting room.
 * 
 * Logic:
 * - Patient in waiting room (waiting)     → "وصل" (arrived)
 * - Patient in waiting room (in_session)  → "في العلاج" (in_treatment)
 * - Future appointment                    → "قادم" (upcoming)
 * - Past + manually completed             → "منجز" (completed)
 * - Past + cancelled                      → "ملغي" (cancelled)
 * - Past + still scheduled + treated      → "منجز" (completed)
 * - Past + still scheduled + not treated  → "فائت" (missed)
 */
export function getAppointmentDisplayStatus(
  appointment: Appointment,
  patient?: Patient,
  waitingEntry?: WaitingPatient
): DisplayStatusResult {

  // ── Real-time status from waiting room ──
  if (waitingEntry && waitingEntry.status === 'waiting') {
    return {
      status: 'arrived',
      label: 'وصل ✓',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
    };
  }
  if (waitingEntry && waitingEntry.status === 'in_session') {
    return {
      status: 'in_treatment',
      label: 'داخل العيادة',
      color: 'text-sky-700',
      bgColor: 'bg-sky-50',
    };
  }

  const safeDate = appointment.date || '';
  const safeTime = appointment.time || '';
  
  const now = new Date();
  const [year, month, day] = (safeDate.includes('-') ? safeDate : '2000-01-01').split('-').map(Number);
  const [hours, minutes] = (safeTime.includes(':') ? safeTime : '00:00').split(':').map(Number);
  const appointmentDate = new Date(year, month - 1, day, hours, minutes);

  // Already manually marked as completed
  if (appointment.status === 'completed') {
    return {
      status: 'completed',
      label: 'منجز ✓',
      color: 'text-slate-800',
      bgColor: 'bg-slate-200',
    };
  }

  // Cancelled
  if (appointment.status === 'cancelled') {
    return {
      status: 'cancelled',
      label: 'ملغي',
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    };
  }

  // Future appointment
  if (appointmentDate > now) {
    return {
      status: 'upcoming',
      label: 'قادم',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    };
  }

  // Past appointment still 'scheduled' — check treatment plan activity
  if (patient && patient.treatmentPlans && patient.treatmentPlans.length > 0) {
    const appointmentDateStr = safeDate; // 'YYYY-MM-DD'

    const wasPatientTreated = patient.treatmentPlans.some(plan => {
      // Check if the plan was created on or after appointment date
      const planCreatedDate = plan.createdAt.split('T')[0];
      if (planCreatedDate >= appointmentDateStr) return true;

      // Check if any step was entered on or after appointment date
      if (plan.steps && plan.steps.some(step => {
        const stepDate = step.date.split('T')[0];
        return stepDate >= appointmentDateStr;
      })) return true;

      // Check if any payment was made on or after appointment date
      if (plan.payments && plan.payments.some(payment => {
        const paymentDate = payment.date.split('T')[0];
        return paymentDate >= appointmentDateStr;
      })) return true;

      return false;
    });

    if (wasPatientTreated) {
      return {
        status: 'completed',
        label: 'منجز ✓',
        color: 'text-slate-800',
        bgColor: 'bg-slate-200',
      };
    }
  }

  // Past appointment with no treatment activity → missed
  return {
    status: 'missed',
    label: 'فائت',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  };
}
