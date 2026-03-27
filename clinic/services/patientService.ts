/**
 * Patient Service
 * Handles all patient-related database operations
 */

import { Patient, Procedure, OrthoVisit } from '../types';
import { PatientRow } from './dbTypes';
import { supabase } from './db';
import { logger } from './logger';
import { fetchWithRetry, generateUUID, getLocalDateStr } from './dbUtils';

/**
 * Maps database row to Patient object
 */
export const mapPatientFromDB = (data: PatientRow): Patient => ({
  id: data.id,
  name: data.name,
  mobile: data.mobile || data.phone,
  age: data.age ?? 0,
  gender: data.gender,
  totalCost: data.total_cost || 0,
  paidAmount: data.paid_amount || 0,
  diagnosis: data.diagnosis,
  procedures: (data.procedures as Procedure[]) || [],
  scans: data.scans || [],
  notes: data.notes || '',
  isDebtOnly: data.is_debt_only || false,
  orthoDoctorId: data.ortho_doctor_id,
  orthoTotalCost: data.ortho_total_cost || 0,
  orthoPaidAmount: data.ortho_paid_amount || 0,
  orthoDiagnosis: data.ortho_diagnosis,
  orthoVisits: (data.ortho_visits as OrthoVisit[]) || [],
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  consultationFeePaid: data.consultation_fee_paid || false,
  consultationFeeCount: data.consultation_fee_count || 0,
  payments: data.payments || []
});

/**
 * Maps Patient object to database row
 */
export const mapPatientToDB = (patient: Partial<Patient>): Partial<PatientRow> => ({
  id: patient.id,
  name: patient.name,
  mobile: patient.mobile,
  age: patient.age,
  gender: patient.gender,
  total_cost: patient.totalCost,
  paid_amount: patient.paidAmount,
  diagnosis: patient.diagnosis,
  procedures: patient.procedures,
  scans: patient.scans,
  notes: patient.notes,
  is_debt_only: patient.isDebtOnly,
  ortho_doctor_id: patient.orthoDoctorId,
  ortho_total_cost: patient.orthoTotalCost,
  ortho_paid_amount: patient.orthoPaidAmount,
  ortho_diagnosis: patient.orthoDiagnosis,
  ortho_visits: patient.orthoVisits,
  consultation_fee_paid: patient.consultationFeePaid,
  consultation_fee_count: patient.consultationFeeCount,
  payments: patient.payments,
  updated_at: new Date().toISOString()
});

/**
 * Fetches all patients
 */
export const fetchPatients = async (): Promise<Patient[]> => {
  if (!supabase) {
    logger.error('[PatientService] Supabase not configured');
    return [];
  }

  try {
    const data = await fetchWithRetry(() =>
      supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
    );

    if (!data) {
      logger.warn('[PatientService] No data returned from fetch');
      return [];
    }

    return data.map(mapPatientFromDB);
  } catch (error) {
    logger.error('[PatientService] Error fetching patients:', error);
    throw error;
  }
};

/**
 * Fetches a single patient by ID
 */
export const fetchPatientById = async (id: string): Promise<Patient | null> => {
  if (!supabase) {
    logger.error('[PatientService] Supabase not configured');
    return null;
  }

  try {
    const data = await fetchWithRetry(() =>
      supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()
    );

    if (!data) {
return null;
}

    return mapPatientFromDB(data);
  } catch (error) {
    logger.error('[PatientService] Error fetching patient:', error);
    return null;
  }
};

/**
 * Saves a patient (insert or update)
 */
export const savePatient = async (patient: Partial<Patient>): Promise<Patient> => {
  if (!supabase) {
    logger.error('[PatientService] Supabase not configured');
    throw new Error('Supabase not configured');
  }

  const patientId = patient.id || generateUUID();
  const isNew = !patient.id;
  const now = new Date().toISOString();

  const dbPatient = mapPatientToDB({
    ...patient,
    id: patientId,
    createdAt: isNew ? now : patient.createdAt,
    updatedAt: now
  });

  try {
    const data = await fetchWithRetry(() =>
      supabase
        .from('patients')
        .upsert(dbPatient)
        .select()
        .single()
    );

    if (!data) {
      throw new Error('Failed to save patient');
    }

    logger.info(`[PatientService] Patient ${isNew ? 'created' : 'updated'}: ${patientId}`);
    return mapPatientFromDB(data);
  } catch (error) {
    logger.error('[PatientService] Error saving patient:', error);
    throw error;
  }
};

/**
 * Deletes a patient
 */
export const deletePatient = async (id: string): Promise<void> => {
  if (!supabase) {
    logger.error('[PatientService] Supabase not configured');
    throw new Error('Supabase not configured');
  }

  try {
    await fetchWithRetry(() =>
      supabase
        .from('patients')
        .delete()
        .eq('id', id)
    );

    logger.info(`[PatientService] Patient deleted: ${id}`);
  } catch (error) {
    logger.error('[PatientService] Error deleting patient:', error);
    throw error;
  }
};

/**
 * Searches patients by name or phone
 */
export const searchPatients = async (query: string): Promise<Patient[]> => {
  if (!supabase) {
    logger.error('[PatientService] Supabase not configured');
    return [];
  }

  try {
    const data = await fetchWithRetry(() =>
      supabase
        .from('patients')
        .select('*')
        .or(`name.ilike.%${query}%,mobile.ilike.%${query}%`)
        .order('created_at', { ascending: false })
    );

    if (!data) {
return [];
}

    return data.map(mapPatientFromDB);
  } catch (error) {
    logger.error('[PatientService] Error searching patients:', error);
    return [];
  }
};

/**
 * Gets patients with outstanding debt
 */
export const getPatientsWithDebt = async (): Promise<Patient[]> => {
  if (!supabase) {
    logger.error('[PatientService] Supabase not configured');
    return [];
  }

  try {
    const data = await fetchWithRetry(() =>
      supabase
        .from('patients')
        .select('*')
        .gt('total_cost', 0)
        .or('total_cost.gt.paid_amount')
        .order('created_at', { ascending: false })
    );

    if (!data) {
return [];
}

    return data
      .map(mapPatientFromDB)
      .filter(p => p.totalCost > p.paidAmount);
  } catch (error) {
    logger.error('[PatientService] Error fetching patients with debt:', error);
    return [];
  }
};

/**
 * Gets new patients this month
 */
export const getNewPatientsThisMonth = async (): Promise<number> => {
  if (!supabase) {
    logger.error('[PatientService] Supabase not configured');
    return 0;
  }

  const firstDayOfMonth = getLocalDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  try {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth);

    if (error) {
throw error;
}

    return count || 0;
  } catch (error) {
    logger.error('[PatientService] Error counting new patients:', error);
    return 0;
  }
};
