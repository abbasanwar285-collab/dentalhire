/**
 * Database Types and Interfaces
 * Defines all types used across database services
 */

import { Patient, Appointment, Expense, InventoryItem, PatientScan, AllowedUser } from '../types';

// Database response types
export interface DBResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface DBError {
  message: string;
  code?: string;
  details?: unknown;
}

// Supabase row types
export interface PatientRow {
  id: string;
  name: string;
  mobile?: string;
  phone?: string;
  age?: number;
  gender?: string;
  total_cost?: number;
  paid_amount?: number;
  diagnosis?: string;
  procedures?: unknown[];
  scans?: unknown[];
  notes?: string;
  is_debt_only?: boolean;
  ortho_doctor_id?: string;
  ortho_total_cost?: number;
  ortho_paid_amount?: number;
  ortho_diagnosis?: string;
  ortho_visits?: unknown[];
  created_at?: string | number;
  updated_at?: string | number;
  consultation_fee_paid?: boolean;
  consultation_fee_count?: number;
  payments?: unknown[];
}

export interface AppointmentRow {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  date: string;
  time: string;
  type?: string;
  notes?: string;
  status: 'confirmed' | 'arrived' | 'completed' | 'cancelled' | 'pending';
  price?: number;
  assistant_id?: string;
  completed_at?: string;
  created_at?: string;
}

export interface ExpenseRow {
  id: string;
  amount: number;
  category?: string;
  description: string;
  date: string;
  timestamp?: number;
  created_by?: string;
  created_at?: string;
}

export interface InventoryRow {
  id: string;
  name: string;
  type?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  min_stock?: number;
  expiry_date?: string;
  price?: number;
  supplier?: string;
  last_restocked?: string;
  image_url?: string;
  image_thumbnail?: string;
  image?: string;
  notes?: string;
  auto_decrement?: boolean;
  consumption_rate?: number;
  created_at?: string | number;
  updated_at?: string | number;
}

export interface ScanRow {
  id: string;
  patient_id: string;
  type?: string;
  file_url?: string;
  file_path?: string;
  thumbnail_url?: string;
  file_name: string;
  notes?: string;
  scan_date?: string;
  created_at?: string | number;
}

// Cache keys enum
export enum CacheKey {
  PATIENTS = 'patients',
  APPOINTMENTS = 'appointments',
  EXPENSES = 'expenses',
  INVENTORY = 'inventory',
  STAFF = 'staff',
  REPORTS = 'reports',
  SYNC_QUEUE = 'syncQueue',
  LAST_SYNC = 'lastSync'
}

// Sync operation types
export type SyncOperationType = 'save' | 'delete';
export type SyncEntityType = 'patient' | 'appointment' | 'expense' | 'inventory' | 'scan';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entity: SyncEntityType;
  data?: unknown;
  timestamp: number;
  retryCount: number;
}

// Realtime listener types
export type DataChangeEvent = 'patients' | 'appointments' | 'expenses' | 'inventory' | 'staff' | 'reports';
export type DataChangeListener = () => void;

// Stats types
export interface ClinicStats {
  totalPatients: number;
  newPatientsThisMonth: number;
  totalRevenue: number;
  totalExpenses: number;
  outstandingDebt: number;
  monthlyRevenue: number[];
  patientGrowth: number[];
  doctorRevenue: Record<string, number>;
  treatmentCounts: Record<string, number>;
}

// Query options
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

// Retry configuration
export interface RetryConfig {
  attempts: number;
  timeout: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  attempts: 2,
  timeout: 15000,
  backoffMultiplier: 2
};
