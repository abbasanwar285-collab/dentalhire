/**
 * Supabase Client Configuration
 * Centralized Supabase client setup with proper typing
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CapacitorStorageAdapter } from './storageAdapter';
import { logger } from './logger';

// Environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate configuration
const isSupabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

if (!isSupabaseConfigured) {
  logger.warn('[Supabase] Supabase is NOT configured. Cloud sync will be disabled.');
} else {
  logger.info('[Supabase] Supabase configured successfully.');
}

// Create Supabase client with proper configuration
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: new CapacitorStorageAdapter(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'X-Client-Info': 'my-dental-clinic@2.2.0',
        },
      },
    })
  : null;

/**
 * Checks if Supabase is properly configured
 */
export const isSupabaseReady = (): boolean => {
  return supabase !== null;
};

/**
 * Gets Supabase client or throws error if not configured
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase client is not configured. Check your environment variables.');
  }
  return supabase;
};

/**
 * Type-safe table names
 */
export const TABLES = {
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  EXPENSES: 'expenses',
  INVENTORY: 'inventory_items',
  SCANS: 'patient_scans',
  ALLOWED_USERS: 'allowed_users',
  AUDIT_LOGS: 'audit_logs',
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];
