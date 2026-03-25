import { Patient, Appointment, ArrivalRecord } from '../types';

/**
 * Computes the dynamic "Last Visit" date for a patient based on:
 * 1. Their static stored lastVisit (fallback)
 * 2. Any completed appointments
 * 3. Any treatment plan activity (creation date, steps, payments)
 * 4. Waiting room arrivals (arrival records)
 * 
 * Returns the most recent date (YYYY-MM-DD format) that is not in the future.
 */
export function getPatientLastVisit(patient: Patient, appointments: Appointment[], arrivalRecords?: ArrivalRecord[]): string | null {
  const dates: Date[] = [];
  const now = new Date();
  
  // 1. Static lastVisit fallback
  if (patient.lastVisit) {
    const d = new Date(patient.lastVisit);
    if (!isNaN(d.getTime())) dates.push(d);
  }

  // 2. Completed Appointments
  if (appointments) {
    appointments.forEach(apt => {
      if (apt.patientId === patient.id && apt.status === 'completed') {
        const d = new Date(apt.date);
        if (!isNaN(d.getTime())) dates.push(d);
      }
    });
  }

  // 3. Treatment Plans Activity
  if (patient.treatmentPlans) {
    patient.treatmentPlans.forEach(plan => {
      // Plan creation
      if (plan.createdAt) {
        const d = new Date(plan.createdAt);
        if (!isNaN(d.getTime())) dates.push(d);
      }

      // Treatment Steps
      if (plan.steps) {
        plan.steps.forEach(step => {
          if (step.date) {
            const d = new Date(step.date);
            if (!isNaN(d.getTime())) dates.push(d);
          }
        });
      }

      // Payments
      if (plan.payments) {
        plan.payments.forEach(payment => {
          if (payment.date) {
            const d = new Date(payment.date);
            if (!isNaN(d.getTime())) dates.push(d);
          }
        });
      }
    });
  }

  // 4. Arrivals to Waiting Room
  if (arrivalRecords) {
    arrivalRecords.forEach(record => {
      if (record.patientId === patient.id && record.actualArrivalTime) {
        const d = new Date(record.actualArrivalTime);
        if (!isNaN(d.getTime())) dates.push(d);
      }
    });
  }

  if (dates.length === 0) return null;

  // Filter out dates that are in the future
  const parsedNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const validDates = dates.filter(d => {
    const parsedD = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return parsedD <= parsedNow;
  });

  if (validDates.length === 0) return null;

  // Find the maximum date
  const latestDate = new Date(Math.max(...validDates.map(d => d.getTime())));
  
  // Return full ISO string for precision in relative time calculations
  return latestDate.toISOString();
}
