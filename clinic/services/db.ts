
import { createClient } from '@supabase/supabase-js';
import { Patient, Appointment, Expense, InventoryItem, InventoryCategory, SystemReport, AllowedUser } from '../types';
import { cacheManager, SyncOperation } from './cacheManager';
import { storage } from './storage';
// SmartMatcher removed - scans feature deprecated
/* eslint-disable @typescript-eslint/no-explicit-any, no-console, curly, max-lines, complexity, no-control-regex */

// --- CONFIGURATION ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Import storage adapter
import { CapacitorStorageAdapter } from './storageAdapter';

const isSupabaseConfigured = SUPABASE_URL.length > 0 &&
  SUPABASE_ANON_KEY.length > 0 &&
  !SUPABASE_URL.includes('your-project.supabase.co');
if (!isSupabaseConfigured) {
  console.warn('[DB] Supabase is NOT configured. Cloud sync will be disabled.');
} else {
  console.log('[DB] Supabase configured successfully.');
}

export const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: new CapacitorStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
}) : null;

// --- CACHE KEYS ---
const CACHE_KEYS = {
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  EXPENSES: 'expenses',
  INVENTORY: 'inventory',
  STAFF: 'staff',
  REPORTS: 'reports'
};

// --- REALTIME LISTENERS STORE ---
type DataChangeListener = () => void;
const dataChangeListeners: Record<string, Set<DataChangeListener>> = {
  patients: new Set(),
  appointments: new Set(),
  expenses: new Set(),
  inventory: new Set(),
  staff: new Set(),
  reports: new Set()
};

// --- HELPER FOR RETRY ---
const withTimeout = <T>(promise: PromiseLike<T>, ms: number = 10000): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), ms)
    )
  ]);
};

// --- MUTEX FOR LOCAL DB ---
class Mutex {
  private mutex = Promise.resolve();

  lock(): Promise<() => void> {
    let unlock: () => void = () => { };

    const willUnlock = new Promise<void>(resolve => {
      unlock = resolve;
    });

    const pending = this.mutex.then(() => unlock);

    this.mutex = this.mutex.then(() => willUnlock);

    return pending;
  }

  async dispatch<T>(fn: (() => T) | (() => PromiseLike<T>)): Promise<T> {
    const unlock = await this.lock();
    try {
      return await Promise.resolve(fn());
    } finally {
      unlock();
    }
  }
}

const localDbMutex = new Mutex();

const fetchWithRetry = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  attempts = 2, // Reduced from 3 to avoid long waits
  timeout = 15000 // Increased from 5000ms for slow networks
): Promise<T | null> => {
  for (let i = 0; i < attempts; i++) {
    try {
      const { data, error } = await withTimeout(operation(), timeout);

      if (error) {
        throw error;
      }
      return data;
    } catch (err: any) {
      const isLastAttempt = i === attempts - 1;
      console.warn(`[DB] Attempt ${i + 1} failed: ${err.message || err}`);

      if (isLastAttempt) {
        throw err;
      }

      // Wait before retry (exponential backoff: 1s, 2s)
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  return null;
};


const notifyLocalListeners = (entity: string) => {
  if (dataChangeListeners[entity]) {
    dataChangeListeners[entity].forEach(l => l());
  }
};

// --- HELPERS ---
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getLocalDateStr = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- MAPPERS ---
export const mapPatientFromDB = (data: { [key: string]: any }): Patient => ({
  id: data.id,
  name: data.name,
  mobile: data.mobile || data.phone,
  age: data.age,
  gender: data.gender,
  totalCost: data.total_cost || 0,
  paidAmount: data.paid_amount || 0,
  diagnosis: data.diagnosis,
  procedures: data.procedures || [],
  scans: data.scans || [],
  notes: data.notes || '',
  isDebtOnly: data.is_debt_only || false,
  orthoDoctorId: data.ortho_doctor_id,
  orthoTotalCost: data.ortho_total_cost || 0,
  orthoPaidAmount: data.ortho_paid_amount || 0,
  orthoDiagnosis: data.ortho_diagnosis,
  orthoVisits: data.ortho_visits || [],
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  consultationFeePaid: data.consultation_fee_paid || false,
  consultationFeeCount: data.consultation_fee_count || 0,
  payments: data.payments || []
});


// --- MERGE HELPER ---
const mergePatientsWithPending = async (serverPatients: Patient[]): Promise<Patient[]> => {
  // Merge with pending sync operations to prevent overwriting local changes
  // that haven't reached the server yet.
  const pendingOps = cacheManager.getSyncStatus().pendingOperations > 0;

  if (pendingOps) {
    const queue = await cacheManager.getSyncQueue();

    const pendingPatients = queue
      .filter(op => op.type === 'save' && op.entity === 'patient')
      .map(op => {
        const d = op.data as any;
        return mapPatientFromDB(d);
      });

    if (pendingPatients.length === 0) return serverPatients;

    const pendingMap = new Map(pendingPatients.map(p => [p.id, p]));

    const mergedPatients = serverPatients.map(p => pendingMap.get(p.id) || p);

    const serverIds = new Set(serverPatients.map(p => p.id));
    pendingPatients.forEach(p => {
      if (!serverIds.has(p.id)) {
        mergedPatients.unshift(p);
      }
    });

    return mergedPatients;
  }

  return serverPatients;
};

// --- MERGE HELPER FOR APPOINTMENTS ---
const mergeAppointmentsWithPending = async (serverAppointments: Appointment[]): Promise<Appointment[]> => {
  // Merge with pending sync operations to prevent overwriting local changes
  const pendingOps = cacheManager.getSyncStatus().pendingOperations > 0;

  if (pendingOps) {
    const queue = await cacheManager.getSyncQueue();

    const pendingAppointments = queue
      .filter(op => op.type === 'save' && op.entity === 'appointment')
      .map(op => {
        const d = op.data as any;
        return mapAppointmentFromDB(d);
      });

    if (pendingAppointments.length === 0) return serverAppointments;

    const pendingMap = new Map(pendingAppointments.map(a => [a.id, a]));
    const mergedAppointments = serverAppointments.map(a => pendingMap.get(a.id) || a);

    const serverIds = new Set(serverAppointments.map(a => a.id));
    pendingAppointments.forEach(a => {
      if (!serverIds.has(a.id)) {
        mergedAppointments.unshift(a);
      }
    });

    return mergedAppointments;
  }

  return serverAppointments;
};

export const mapAppointmentFromDB = (data: { [key: string]: any }): Appointment => ({
  id: data.id,
  patientId: data.patient_id || '',
  patientName: data.patient_name,
  doctorId: data.doctor_id,
  date: data.date,
  time: data.time,
  type: data.treatment_type || data.type, // Map treatment_type from DB
  notes: data.notes,
  status: data.status,
  price: data.price,
  createdAt: data.created_at
});

// Helper to convert Patient to DB format (used for auto-syncing missing patients)
const mapPatientToDBData = (patient: Patient) => ({
  id: patient.id,
  name: patient.name,
  mobile: patient.mobile,
  age: patient.age,
  gender: patient.gender,
  total_cost: patient.totalCost,
  paid_amount: patient.paidAmount,
  diagnosis: patient.diagnosis,
  procedures: patient.procedures,
  notes: patient.notes,
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

export const mapExpenseFromDB = (data: { [key: string]: any }): Expense => ({
  id: data.id,
  amount: data.amount,
  category: data.category,
  description: data.description,
  date: data.date,
  createdBy: data.created_by,
  createdAt: data.created_at
});

const mapInventoryFromDB = (data: any): InventoryItem => ({
  id: data.id,
  name: data.name,
  category: (data.category || data.type) as InventoryCategory,
  quantity: data.quantity,
  unit: data.unit,
  minStock: data.min_stock,
  expiryDate: data.expiry_date,
  price: data.price,
  supplier: data.supplier,
  lastRestocked: data.last_restocked,
  imageUrl: data.image_url || data.image,
  imageThumbnail: data.image_thumbnail,
  createdAt: data.created_at,
  updatedAt: data.updated_at
});

// mapScanFromDB removed - scans feature deprecated


// --- LOCAL DB FALLBACK ---
const LocalDB = {
  getPatients: async () => (await storage.getItem<Patient[]>(CACHE_KEYS.PATIENTS)) || [],

  savePatient: async (patient: Patient) => {
    return localDbMutex.dispatch(async () => {
      const patients = (await storage.getItem<Patient[]>(CACHE_KEYS.PATIENTS)) || [];
      const updated = [patient, ...patients.filter(p => p.id !== patient.id)];
      await storage.setItem(CACHE_KEYS.PATIENTS, updated);
    });
  },

  deletePatient: async (id: string) => {
    return localDbMutex.dispatch(async () => {
      const patients = (await storage.getItem<Patient[]>(CACHE_KEYS.PATIENTS)) || [];
      await storage.setItem(CACHE_KEYS.PATIENTS, patients.filter(p => p.id !== id));
    });
  },

  getAppointments: async () => (await storage.getItem<Appointment[]>(CACHE_KEYS.APPOINTMENTS)) || [],

  saveAppointment: async (appointment: Appointment) => {
    return localDbMutex.dispatch(async () => {
      const appointments = (await storage.getItem<Appointment[]>(CACHE_KEYS.APPOINTMENTS)) || [];
      const updated = [appointment, ...appointments.filter(a => a.id !== appointment.id)];
      await storage.setItem(CACHE_KEYS.APPOINTMENTS, updated);
    });
  },

  getAppointment: async (id: string) => {
    const appointments = (await storage.getItem<Appointment[]>(CACHE_KEYS.APPOINTMENTS)) || [];
    return appointments.find(a => a.id === id);
  },

  deleteAppointment: async (id: string) => {
    return localDbMutex.dispatch(async () => {
      const appointments = (await storage.getItem<Appointment[]>(CACHE_KEYS.APPOINTMENTS)) || [];
      await storage.setItem(CACHE_KEYS.APPOINTMENTS, appointments.filter(a => a.id !== id));
    });
  },

  getExpenses: async () => (await storage.getItem<Expense[]>(CACHE_KEYS.EXPENSES)) || [],

  saveExpense: async (expense: Expense) => {
    return localDbMutex.dispatch(async () => {
      const expenses = (await storage.getItem<Expense[]>(CACHE_KEYS.EXPENSES)) || [];
      const updated = [expense, ...expenses.filter(e => e.id !== expense.id)];
      await storage.setItem(CACHE_KEYS.EXPENSES, updated);
    });
  },

  getInventory: async () => (await storage.getItem<InventoryItem[]>(CACHE_KEYS.INVENTORY)) || [],

  saveInventoryItem: async (item: InventoryItem) => {
    return localDbMutex.dispatch(async () => {
      const inventory = (await storage.getItem<InventoryItem[]>(CACHE_KEYS.INVENTORY)) || [];
      const updated = [item, ...inventory.filter(i => i.id !== item.id)];
      await storage.setItem(CACHE_KEYS.INVENTORY, updated);
    });
  },

  getStaff: async () => (await storage.getItem<AllowedUser[]>(CACHE_KEYS.STAFF)),

  saveStaff: async (user: AllowedUser) => {
    return localDbMutex.dispatch(async () => {
      const staff = (await storage.getItem<AllowedUser[]>(CACHE_KEYS.STAFF)) || [];
      const updated = [user, ...staff.filter(s => s.email !== user.email)];
      await storage.setItem(CACHE_KEYS.STAFF, updated);
    });
  },

  deleteStaff: async (email: string) => {
    return localDbMutex.dispatch(async () => {
      const staff = (await storage.getItem<AllowedUser[]>(CACHE_KEYS.STAFF)) || [];
      await storage.setItem(CACHE_KEYS.STAFF, staff.filter(s => s.email !== email));
    });
  },

  getReports: async () => (await storage.getItem<SystemReport[]>(CACHE_KEYS.REPORTS)) || []
};

// --- NAMED EXPORTS ---
export const subscribeToDataChanges = (entity: string, listener: DataChangeListener) => {
  if (dataChangeListeners[entity]) {
    dataChangeListeners[entity].add(listener);
  }
  return () => {
    if (dataChangeListeners[entity]) {
      dataChangeListeners[entity].delete(listener);
    }
  };
};

export const getPatients = async (): Promise<Patient[]> => {
  // SWR: Get local data first
  const localData = await LocalDB.getPatients();

  // Cache TTL Check (Small throttle for the lightweight check - 60 seconds)
  // This allows "Smart Sync" to run frequently to detect new patients without downloading full data
  const lastSyncTime = parseInt(localStorage.getItem('last_patients_sync_ts') || '0');
  const now = Date.now();

  // Only skip if synced less than 60 seconds ago AND no force refresh needed
  // We want to force sync if the user explicitly refreshes or if we suspect issues
  const shouldForceSync = (window as any)._forceSync === true;

  if (!shouldForceSync && now - lastSyncTime < 60 * 1000 && localData.length > 0) {
    // console.log('[DB] Skipping sync (Cache Valid - 60s TTL)');
    return localData;
  }

  // Reset force sync flag
  (window as any)._forceSync = false;

  // Trigger fetch if connected
  if (supabase) {
    // SMART SYNC (Delta Sync) - Now runs synchronously for immediate updates
    // 1. Fetch only ID and UpdatedAt from server (Small payload)
    try {
      const serverIndex = await fetchWithRetry(async () =>
        supabase.from('patients').select('id, updated_at, created_at')
      );

      if (serverIndex) {
        const updatesNeededIds: string[] = [];

        // Create lookup for local patients
        const localMap = new Map(localData.map(p => [p.id, p]));

        serverIndex.forEach((remote) => {
          const local = localMap.get(remote.id);

          // Check if we need to fetch this patient
          let needsUpdate = false;

          if (!local) {
            // New patient
            needsUpdate = true;
          } else {
            // Check timestamp
            const remoteTime = new Date(remote.updated_at || remote.created_at).getTime();
            const localTime = new Date(local.updatedAt || local.createdAt).getTime();

            // Allow some clock skew (e.g. 1000ms), update if remote is newer
            if (remoteTime > localTime + 1000) {
              needsUpdate = true;
            }
          }

          if (needsUpdate) {
            updatesNeededIds.push(remote.id);
          }
        });

        console.log(`[DB] Smart Sync: ${updatesNeededIds.length} patients need update.`);

        if (updatesNeededIds.length > 0) {
          // 2. Fetch full data ONLY for changed records
          const BATCH_SIZE = 50;
          const chunks = [];
          for (let i = 0; i < updatesNeededIds.length; i += BATCH_SIZE) {
            chunks.push(updatesNeededIds.slice(i, i + BATCH_SIZE));
          }

          // Process chunks
          const fetchedPatients: Patient[] = [];
          for (const chunkIds of chunks) {
            const { data: chunkData } = await supabase
              .from('patients')
              .select('*')
              .in('id', chunkIds);

            if (chunkData) {
              chunkData.forEach(d => fetchedPatients.push(mapPatientFromDB(d)));
            }
          }

          // 3. Merge Updates into Local DB
          const newLocalData = [...localData];
          for (const updatedPatient of fetchedPatients) {
            const idx = newLocalData.findIndex(p => p.id === updatedPatient.id);
            if (idx >= 0) {
              newLocalData[idx] = updatedPatient; // Replace
            } else {
              newLocalData.push(updatedPatient); // Add
            }
            // Update persistent storage for this patient
            await LocalDB.savePatient(updatedPatient);
          }

          // 4. Update memory cache & notify
          newLocalData.sort((a, b) => {
            const tA = new Date(a.createdAt as string | number).getTime();
            const tB = new Date(b.createdAt as string | number).getTime();
            return tB - tA;
          });

          cacheManager.setCachedData(CACHE_KEYS.PATIENTS, newLocalData);
          notifyLocalListeners('patients');

          // Update Sync Timestamp
          localStorage.setItem('last_patients_sync_ts', Date.now().toString());

          // Return the updated data
          return newLocalData;
        }

        // Update Sync Timestamp even if no changes
        localStorage.setItem('last_patients_sync_ts', Date.now().toString());
      }
    } catch (e) {
      console.error('[DB] Smart Sync failed:', e);
    }
  }

  // Return local data immediately (or empty array if none)
  return localData;
};

export const getLocalPatients = async (): Promise<Patient[]> => {
  return LocalDB.getPatients();
};

export const getPatientById = async (id: string): Promise<Patient | undefined> => {
  // 1. Try Local First
  const patients = await LocalDB.getPatients();
  const localPatient = patients.find(p => p.id === id);

  // 2. Background Fetch (SWR)
  if (supabase) {
    // Don't await!
    fetchWithRetry(async () =>
      supabase.from('patients').select('*').eq('id', id).maybeSingle()
    ).then(async (data) => {
      if (data) {
        // Update Local Cache silently? Or notify? 
        // For now, let's just update the specific patient in the cache
        // But getPatients() cache is an array. We need to update that array.
        const mapped = mapPatientFromDB(data);
        // Only update local DB, do NOT trigger another save to Supabase
        await LocalDB.savePatient(mapped);
        notifyLocalListeners('patients');
      }
    }).catch(e => console.warn('[DB] Bg fetch failed (getPatientById)', e));
  }

  return localPatient;
};

export const savePatient = async (patient: Patient): Promise<void> => {
  await LocalDB.savePatient(patient);
  notifyLocalListeners('patients');

  if (supabase) {
    const dbData = {
      id: patient.id,
      name: patient.name,
      mobile: patient.mobile,
      age: patient.age,
      gender: patient.gender,
      total_cost: patient.totalCost,
      paid_amount: patient.paidAmount,
      diagnosis: patient.diagnosis,
      procedures: patient.procedures,
      // scans: patient.scans, // Temporarily disabled: Column missing in DB
      notes: patient.notes,
      // is_debt_only: patient.isDebtOnly, // Temporarily disabled: Column missing in DB
      ortho_doctor_id: patient.orthoDoctorId,
      ortho_total_cost: patient.orthoTotalCost,
      ortho_paid_amount: patient.orthoPaidAmount,
      ortho_diagnosis: patient.orthoDiagnosis,
      ortho_visits: patient.orthoVisits,
      consultation_fee_paid: patient.consultationFeePaid,
      consultation_fee_count: patient.consultationFeeCount,
      payments: patient.payments,
      updated_at: new Date().toISOString()
    };

    // --- ROBUST SYNC FIX ---
    // Instead of "fire and forget", we try to await this if possible.
    // --- ROBUST SYNC FIX ---
    // Instead of "fire and forget", we try to await this if possible.
    try {
      console.log('[DB] Syncing patient to Supabase (Immediate)...', patient.id);

      // Use a shorter timeout for the foreground attempt (e.g., 5s)
      const { error } = await withTimeout(
        supabase.from('patients').upsert(dbData),
        7000 // 7 seconds wait for immediate feedback
      );

      if (error) {
        console.error('[DB] Supabase Upsert Error:', error);
        // Check for RLS Policy Violation
        if (error.code === '42501') {
          console.error('[DB] CRITICAL: RLS Policy Violation. User does not have permission to write.');
          // alert('خطأ في الصلاحيات: لا يمكنك حفظ البيانات. يرجى تسجيل الخروج والدخول مجدداً.');
        }
        throw error;
      }
      console.log('[DB] Patient synced successfully:', patient.id);

      // Update sync timestamp on success to prevent immediate re-sync needs
      localStorage.setItem('last_patients_sync_ts', Date.now().toString());

    } catch (e: any) {
      console.warn('[DB] Immediate sync failed/timed out, queueing for background:', e);

      // Notify user (via console/toast logic if we had one here) or just rely on the queue
      if (import.meta.env.DEV) {
        console.error('[DB] CAUGHT ERROR in savePatient:', e);
      }

      // Add to background queue as fallback
      cacheManager.addToSyncQueue({
        type: 'save',
        entity: 'patient',
        data: dbData
      });

      // Rethrow if it's a critical logic error (like Integrity constraint)
      if (e.code && e.code.startsWith('23')) { // Integrity constraint violation
        throw e;
      }
    }
  } else {
    console.warn('[DB] Supabase client not available, ensuring local save only.');
  }
};

export const deletePatient = async (id: string): Promise<void> => {
  await LocalDB.deletePatient(id);
  notifyLocalListeners('patients');

  if (supabase) {
    (async () => {
      try {
        const { error } = await withTimeout(supabase.from('patients').delete().eq('id', id));
        if (error) throw error;
      } catch (e) {
        cacheManager.addToSyncQueue({
          type: 'delete',
          entity: 'patient',
          data: { id }
        });
      }
    })();
  }
};

export const deleteProcedure = async (patientId: string, procId: string): Promise<boolean> => {
  const patient = await getPatientById(patientId);
  if (!patient) return false;

  const updatedProcedures = patient.procedures.filter(p => p.id !== procId);
  await savePatient({ ...patient, procedures: updatedProcedures });
  return true;
};

export const deleteOrthoVisit = async (patientId: string, visitId: string): Promise<boolean> => {
  const patient = await getPatientById(patientId);
  if (!patient) return false;

  const updatedVisits = (patient.orthoVisits || []).filter(v => v.id !== visitId);
  await savePatient({ ...patient, orthoVisits: updatedVisits });
  return true;
};

export const getAppointments = async (): Promise<Appointment[]> => {
  const localData = await LocalDB.getAppointments();

  if (supabase) {
    fetchWithRetry(async () =>
      supabase.from('appointments').select('*').order('date', { ascending: false })
    ).then(async (data) => {
      if (data) {
        let appointments = data.map(mapAppointmentFromDB);
        // Merge with pending to avoid overwriting local work
        appointments = await mergeAppointmentsWithPending(appointments);

        cacheManager.setCachedData(CACHE_KEYS.APPOINTMENTS, appointments);
        notifyLocalListeners('appointments');
      }
    }).catch(e => console.warn('[DB] Bg fetch failed (getAppointments)', e));
  }
  return localData;
};

export const getLocalAppointments = async (): Promise<Appointment[]> => {
  return LocalDB.getAppointments();
};

export const getAppointmentById = async (id: string): Promise<Appointment | undefined> => {
  // 1. Try Local First
  const appointments = await LocalDB.getAppointments();
  const localApp = appointments.find(a => a.id === id);

  // 2. Background Fetch
  if (supabase) {
    fetchWithRetry(async () =>
      supabase.from('appointments').select('*').eq('id', id).single()
    ).then(async (data) => {
      if (data) {
        const mapped = mapAppointmentFromDB(data);
        // Only update local DB, do NOT trigger another save to Supabase
        await LocalDB.saveAppointment(mapped);
        notifyLocalListeners('appointments');
      }
    }).catch(e => console.warn('[DB] Bg fetch failed (getAppointmentById)', e));
  }

  return localApp;
};

export const saveAppointment = async (appointment: Appointment): Promise<void> => {
  await LocalDB.saveAppointment(appointment);
  notifyLocalListeners('appointments');

  if (supabase) {
    const dbData = {
      id: appointment.id,
      patient_id: appointment.patientId || null,
      patient_name: appointment.patientName,
      doctor_id: appointment.doctorId,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      notes: appointment.notes,
      status: appointment.status,
      price: appointment.price,
      created_at: appointment.createdAt || new Date().toISOString()
    };

    // Robust Sync: ensure patient exists in Supabase before syncing appointment
    (async () => {
      try {
        // If there's a patient_id, verify the patient exists in Supabase first
        if (dbData.patient_id) {
          const { data: existingPatient } = await withTimeout(
            supabase.from('patients').select('id').eq('id', dbData.patient_id).single(),
            3000
          );

          if (!existingPatient) {
            // Patient doesn't exist in Supabase yet - sync the patient first
            console.warn('[DB] Patient not found in Supabase, syncing patient first...', dbData.patient_id);
            const localPatients = await LocalDB.getPatients();
            const localPatient = localPatients.find((p: Patient) => p.id === dbData.patient_id);
            if (localPatient) {
              const patientDbData = mapPatientToDBData(localPatient);
              const { error: patientError } = await withTimeout(
                supabase.from('patients').upsert(patientDbData),
                5000
              );
              if (patientError) {
                console.error('[DB] Failed to sync patient, queueing appointment:', patientError);
                throw patientError; // Will be caught and queued below
              }
              console.log('[DB] Patient synced successfully, now syncing appointment...');
            } else {
              // Patient doesn't exist locally either - set patient_id to null
              console.warn('[DB] Patient not found locally either, setting patient_id to null');
              dbData.patient_id = null;
            }
          }
        }

        console.log('[DB] Syncing appointment to Supabase (Immediate)...', appointment.id);
        const { error } = await withTimeout(supabase.from('appointments').upsert(dbData), 5000);

        if (error) throw error;
        console.log('[DB] Appointment synced successfully:', appointment.id);
      } catch (e) {
        console.warn('[DB] Immediate sync failed (appointment), queueing:', e);
        cacheManager.addToSyncQueue({
          type: 'save',
          entity: 'appointment',
          data: dbData
        });
      }
    })();
  }
};

export const deleteAppointment = async (id: string): Promise<void> => {
  await LocalDB.deleteAppointment(id);
  notifyLocalListeners('appointments');

  if (supabase) {
    (async () => {
      try {
        const { error } = await withTimeout(supabase.from('appointments').delete().eq('id', id));
        if (error) throw error;
      } catch (e) {
        cacheManager.addToSyncQueue({
          type: 'delete',
          entity: 'appointment',
          data: { id }
        });
      }
    })();
  }
};

export const getExpenses = async (): Promise<Expense[]> => {
  const localData = await LocalDB.getExpenses();

  if (supabase) {
    fetchWithRetry(async () =>
      supabase.from('expenses').select('*').order('date', { ascending: false })
    ).then(data => {
      if (data) {
        const expenses = data.map(mapExpenseFromDB);
        cacheManager.setCachedData(CACHE_KEYS.EXPENSES, expenses);
        notifyLocalListeners('expenses');
      }
    }).catch(e => console.warn('[DB] Bg fetch failed (getExpenses)', e));
  }
  return localData;
};

export const getLocalExpenses = async (): Promise<Expense[]> => {
  return LocalDB.getExpenses();
};

export const saveExpense = async (expense: Expense): Promise<void> => {
  await LocalDB.saveExpense(expense);
  notifyLocalListeners('expenses');

  if (supabase) {
    const dbData = {
      id: expense.id,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date,
      created_by: expense.createdBy,
      timestamp: expense.timestamp
    };

    (async () => {
      try {
        const { error } = await withTimeout(supabase.from('expenses').upsert(dbData));
        if (error) throw error;
      } catch (e) {
        console.warn('[DB] Background sync failed (expense):', e);
        cacheManager.addToSyncQueue({
          type: 'save',
          entity: 'expense',
          data: dbData
        });
      }
    })();
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  const expenses = await LocalDB.getExpenses();
  await storage.setItem(CACHE_KEYS.EXPENSES, expenses.filter(e => e.id !== id));
  notifyLocalListeners('expenses');

  if (supabase) {
    (async () => {
      try {
        const { error } = await withTimeout(supabase.from('expenses').delete().eq('id', id));
        if (error) throw error;
      } catch (e) {
        cacheManager.addToSyncQueue({
          type: 'delete',
          entity: 'expense',
          data: { id }
        });
      }
    })();
  }
};

export const getInventory = async (): Promise<InventoryItem[]> => {
  const localData = await LocalDB.getInventory();

  if (supabase) {
    fetchWithRetry(async () =>
      supabase.from('inventory_items').select('*').order('name', { ascending: true })
    ).then(data => {
      if (data) {
        const inventory = data.map(mapInventoryFromDB);
        cacheManager.setCachedData(CACHE_KEYS.INVENTORY, inventory);
        notifyLocalListeners('inventory');
      }
    }).catch(e => console.warn('[DB] Bg fetch failed (getInventory)', e));
  }
  return localData;
};

export const getLocalInventory = async (): Promise<InventoryItem[]> => {
  return LocalDB.getInventory();
};

export const saveInventoryItem = async (item: InventoryItem): Promise<void> => {
  await LocalDB.saveInventoryItem(item);
  notifyLocalListeners('inventory');

  if (supabase) {
    const dbData = {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      min_stock: item.minStock,
      expiry_date: item.expiryDate,
      price: item.price,
      supplier: item.supplier,
      last_restocked: item.lastRestocked,
      image_url: item.imageUrl,
      image_thumbnail: item.imageThumbnail,
      type: item.category, // The DB column is named 'type'
      notes: item.notes
    };

    (async () => {
      try {
        const { error } = await withTimeout(supabase.from('inventory_items').upsert(dbData));
        if (error) throw error;
      } catch (e) {
        console.warn('[DB] Background sync failed (inventory):', e);
        cacheManager.addToSyncQueue({
          type: 'save',
          entity: 'inventory',
          data: dbData
        });
      }
    })();
  }
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  const inventory = await LocalDB.getInventory();
  await storage.setItem(CACHE_KEYS.INVENTORY, inventory.filter(i => i.id !== id));
  notifyLocalListeners('inventory');

  if (supabase) {
    (async () => {
      try {
        const { error } = await withTimeout(supabase.from('inventory_items').delete().eq('id', id));
        if (error) throw error;
      } catch (e) {
        cacheManager.addToSyncQueue({
          type: 'delete',
          entity: 'inventory',
          data: { id }
        });
      }
    })();
  }
};

export const getStaff = async (): Promise<AllowedUser[]> => {
  const localData = (await LocalDB.getStaff()) || [];

  if (supabase) {
    fetchWithRetry(async () =>
      supabase.from('allowed_users').select('*').order('name', { ascending: true })
    ).then(data => {
      if (data) {
        const staff = data.map((d: any) => ({
          email: d.email,
          name: d.name,
          role: d.role,
          created_at: d.created_at
        }));
        storage.setItem(CACHE_KEYS.STAFF, staff);
        // notifyLocalListeners('staff'); // Staff sync usually doesn't need instant UI update unless in admin panel
      }
    }).catch(e => console.warn('[DB] Bg fetch failed (getStaff)', e));
  }

  return localData;
};



export const getLocalStaff = async (): Promise<AllowedUser[] | null> => {
  return LocalDB.getStaff();
};

export const saveStaff = async (user: AllowedUser): Promise<void> => {
  await LocalDB.saveStaff(user);
  notifyLocalListeners('staff');

  if (supabase) {
    (async () => {
      try {
        const { error } = await withTimeout(supabase.from('allowed_users').upsert({
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: user.created_at
        }));
        if (error) throw error;
      } catch (e) {
        console.warn('[DB] Background sync failed (staff):', e);
        cacheManager.addToSyncQueue({
          type: 'save',
          entity: 'staff',
          data: user
        });
      }
    })();
  }
};

export const deleteStaff = async (email: string): Promise<void> => {
  await LocalDB.deleteStaff(email);
  notifyLocalListeners('staff');

  if (supabase) {
    (async () => {
      try {
        const { error } = await withTimeout(supabase.from('allowed_users').delete().eq('email', email));
        if (error) throw error;
      } catch (e) {
        cacheManager.addToSyncQueue({
          type: 'delete',
          entity: 'staff',
          data: { id: email }
        });
      }
    })();
  }
};

export const getReports = async (): Promise<SystemReport[]> => {
  return LocalDB.getReports();
};

export const getLocalReports = async (): Promise<SystemReport[]> => {
  return LocalDB.getReports();
};

export const saveReport = async (report: Omit<SystemReport, 'id' | 'timestamp' | 'isRead'>): Promise<void> => {
  const reports = await LocalDB.getReports();
  const newReport: SystemReport = { ...report, id: generateUUID(), timestamp: Date.now(), isRead: false };
  await storage.setItem(CACHE_KEYS.REPORTS, [newReport, ...reports].slice(0, 50));
  notifyLocalListeners('reports');
};

export const markReportAsRead = async (id: string): Promise<void> => {
  const reports = await LocalDB.getReports();
  const updated = reports.map(r => r.id === id ? { ...r, isRead: true } : r);
  await storage.setItem(CACHE_KEYS.REPORTS, updated);
  notifyLocalListeners('reports');
};

// Scan functions removed to reduce bandwidth - scans feature deprecated


export const getStats = async (): Promise<any> => {
  // Fetch sequentially to prevent connection saturation
  const patients = await getPatients();
  const appointments = await getAppointments();
  const expenses = await getExpenses();
  return calculateStats(patients, appointments, expenses);
};

export const getLocalStats = async (): Promise<any> => {
  const [patients, appointments, expenses] = await Promise.all([LocalDB.getPatients(), LocalDB.getAppointments(), LocalDB.getExpenses()]);
  return calculateStats(patients, appointments, expenses);
};

export const forceRefreshAll = async (): Promise<void> => {
  if (!supabase) {
    console.log('[DB] forceRefreshAll: Supabase not configured, skipping.');
    return;
  }

  console.log('[DB] forceRefreshAll: Starting network sync...');

  // Fetch from network and update cache. We await each to ensure data is synced.
  try {
    const patientsData = await fetchWithRetry(async () =>
      supabase.from('patients').select('*').order('created_at', { ascending: false })
    );
    if (patientsData) {
      let patients = patientsData.map(mapPatientFromDB);
      // Merge with pending changes to avoid overwriting local work
      patients = await mergePatientsWithPending(patients);

      cacheManager.setCachedData(CACHE_KEYS.PATIENTS, patients);
      notifyLocalListeners('patients');
    }
  } catch (e) {
    console.warn('[DB] forceRefreshAll: patients failed', e);
  }

  try {
    const appointmentsData = await fetchWithRetry(async () =>
      supabase.from('appointments').select('*').order('date', { ascending: false })
    );
    if (appointmentsData) {
      let appointments = appointmentsData.map(mapAppointmentFromDB);
      // Merge with pending changes
      appointments = await mergeAppointmentsWithPending(appointments);

      cacheManager.setCachedData(CACHE_KEYS.APPOINTMENTS, appointments);
      notifyLocalListeners('appointments');
    }
  } catch (e) {
    console.warn('[DB] forceRefreshAll: appointments failed', e);
  }

  try {
    const expensesData = await fetchWithRetry(async () =>
      supabase.from('expenses').select('*').order('date', { ascending: false })
    );
    if (expensesData) {
      const expenses = expensesData.map(mapExpenseFromDB);
      cacheManager.setCachedData(CACHE_KEYS.EXPENSES, expenses);
      notifyLocalListeners('expenses');
    }
  } catch (e) {
    console.warn('[DB] forceRefreshAll: expenses failed', e);
  }

  try {
    const inventoryData = await fetchWithRetry(async () =>
      supabase.from('inventory_items').select('*').order('name', { ascending: true })
    );
    if (inventoryData) {
      const inventory = inventoryData.map(mapInventoryFromDB);
      cacheManager.setCachedData(CACHE_KEYS.INVENTORY, inventory);
      notifyLocalListeners('inventory');
    }
  } catch (e) {
    console.warn('[DB] forceRefreshAll: inventory failed', e);
  }

  try {
    const staffData = await fetchWithRetry(async () =>
      supabase.from('allowed_users').select('*').order('name', { ascending: true })
    );
    if (staffData) {
      const staff = staffData.map((d: any) => ({
        email: d.email,
        name: d.name,
        role: d.role,
        created_at: d.created_at
      }));
      storage.setItem(CACHE_KEYS.STAFF, staff);
    }
  } catch (e) {
    console.warn('[DB] forceRefreshAll: staff failed', e);
  }

  console.log('[DB] forceRefreshAll: Network sync complete.');
};

// --- REALTIME ---
export const setupRealtimeSubscriptions = () => {
  if (!supabase) {
    return () => { };
  }

  console.log('[DB] Setting up Smart Realtime Subscriptions...');

  const channel = supabase.channel('db-changes')
    // --- PATIENTS ---
    .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, async (payload) => {
      console.log('[DB] Realtime Patient Update:', payload.eventType);
      if (payload.eventType === 'DELETE' && payload.old.id) {
        await LocalDB.deletePatient(payload.old.id);
      } else if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
        // Map raw DB data to our internal Patient type
        const newPatient = mapPatientFromDB(payload.new);
        await LocalDB.savePatient(newPatient);
      }
      notifyLocalListeners('patients');
    })

    // --- APPOINTMENTS ---
    .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, async (payload) => {
      console.log('[DB] Realtime Appointment Update:', payload.eventType);
      if (payload.eventType === 'DELETE' && payload.old.id) {
        await LocalDB.deleteAppointment(payload.old.id);
      } else if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
        const newAppointment = mapAppointmentFromDB(payload.new);
        await LocalDB.saveAppointment(newAppointment);
      }
      notifyLocalListeners('appointments');
    })

    // --- EXPENSES ---
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, async (payload) => {
      console.log('[DB] Realtime Expense Update:', payload.eventType);
      if (payload.eventType === 'DELETE' && payload.old.id) {
        const expenses = await LocalDB.getExpenses();
        await storage.setItem(CACHE_KEYS.EXPENSES, expenses.filter(e => e.id !== payload.old.id));
      } else if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
        const newExpense = mapExpenseFromDB(payload.new);
        await LocalDB.saveExpense(newExpense);
      }
      notifyLocalListeners('expenses');
    })

    // --- INVENTORY ---
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, async (payload) => {
      console.log('[DB] Realtime Inventory Update:', payload.eventType);
      if (payload.eventType === 'DELETE' && payload.old.id) {
        const inventory = await LocalDB.getInventory();
        await storage.setItem(CACHE_KEYS.INVENTORY, inventory.filter(i => i.id !== payload.old.id));
      } else if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
        const newItem = mapInventoryFromDB(payload.new);
        await LocalDB.saveInventoryItem(newItem);
      }
      notifyLocalListeners('inventory');
    })

    // --- STAFF ---
    .on('postgres_changes', { event: '*', schema: 'public', table: 'allowed_users' }, async (payload) => {
      console.log('[DB] Realtime Staff Update:', payload.eventType);
      if (payload.eventType === 'DELETE' && payload.old.email) {
        await LocalDB.deleteStaff(payload.old.email);
      } else if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
        const newStaff = {
          email: payload.new.email,
          name: payload.new.name,
          role: payload.new.role,
          created_at: payload.new.created_at
        };
        await LocalDB.saveStaff(newStaff);
      }
      notifyLocalListeners('staff');
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[DB] Realtime Connected!');
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
};

// --- MAIN DB OBJECT ---
export const db = {
  subscribeToDataChanges,
  forceRefreshAll,
  getPatients,
  getPatientById,
  getLocalPatients,
  savePatient,
  deletePatient,
  deleteProcedure,
  deleteOrthoVisit,
  getAppointments,
  getLocalAppointments,
  getAppointmentById,
  saveAppointment,
  deleteAppointment,
  getExpenses,
  getLocalExpenses,
  saveExpense,
  deleteExpense,
  getInventory,
  getLocalInventory,
  saveInventoryItem,
  deleteInventoryItem,
  getStaff,
  getLocalStaff,
  saveStaff,
  deleteStaff,
  getReports,
  getLocalReports,
  saveReport,
  markReportAsRead,
  getStats,
  getLocalStats,
  setupRealtimeSubscriptions,
  supabase
};

// Map SyncOperation entity to table name
const ENTITY_TABLE_MAP: Record<string, string> = {
  patient: 'patients',
  appointment: 'appointments',
  expense: 'expenses',
  inventory: 'inventory_items',
  staff: 'allowed_users'
};

// Set global sync executor
(window as any).__syncExecutor = async (op: SyncOperation) => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const table = ENTITY_TABLE_MAP[op.entity];
  if (!table) {
    throw new Error(`Unknown entity: ${op.entity}`);
  }

  try {
    if (op.type === 'save') {
      console.log(`[SyncExecutor] Processing save for ${op.entity} (${op.id})...`);

      // Sanitize empty patient_id to null to avoid FK constraint violations
      if (op.entity === 'appointment' && 'patient_id' in op.data) {
        op.data.patient_id = op.data.patient_id || null;
      }

      // For appointments with a patient_id, ensure the patient exists first
      if (op.entity === 'appointment' && op.data.patient_id) {
        const { data: patientExists } = await supabase
          .from('patients')
          .select('id')
          .eq('id', op.data.patient_id)
          .single();

        if (!patientExists) {
          console.warn(`[SyncExecutor] Patient ${op.data.patient_id} not in Supabase, syncing patient first...`);
          const localPatients = await LocalDB.getPatients();
          const localPatient = localPatients.find((p: Patient) => p.id === op.data.patient_id);
          if (localPatient) {
            const patientDbData = mapPatientToDBData(localPatient);
            const { error: pErr } = await supabase.from('patients').upsert(patientDbData);
            if (pErr) {
              console.error(`[SyncExecutor] Failed to sync dependency patient:`, pErr);
              throw pErr;
            }
            console.log(`[SyncExecutor] ✅ Dependency patient synced: ${op.data.patient_id}`);
          } else {
            // Patient doesn't exist anywhere - clear the FK reference
            console.warn(`[SyncExecutor] Patient not found locally, clearing patient_id`);
            op.data.patient_id = null;
          }
        }
      }

      // Ensure updated_at is set for patient upserts
      const data = op.entity === 'patient' && !op.data.updated_at
        ? { ...op.data, updated_at: new Date().toISOString() }
        : op.data;

      const { error } = await supabase.from(table).upsert(data);
      if (error) {
        console.error(`[SyncExecutor] Upsert failed for ${op.entity} (${op.id}):`, error);
        throw error;
      }
      console.log(`[SyncExecutor] ✅ ${op.entity} synced successfully (${op.id})`);
    } else if (op.type === 'delete') {
      console.log(`[SyncExecutor] Processing delete for ${op.entity} (${op.id})...`);
      const idField = op.entity === 'staff' ? 'email' : 'id';
      const { error } = await supabase.from(table).delete().eq(idField, op.data.id || op.data.email);
      if (error) {
        console.error(`[SyncExecutor] Delete failed for ${op.entity} (${op.id}):`, error);
        throw error;
      }
      console.log(`[SyncExecutor] ✅ ${op.entity} deleted from cloud (${op.id})`);
    }
  } catch (err: any) {
    console.error(`[SyncExecutor] Critical error during sync of ${op.entity}:`, err);
    throw err;
  }
};

// --- STATS CALCULATOR ---
function calculateStats(patients: Patient[], appointments: Appointment[], expenses: Expense[]) {
  const today = getLocalDateStr();
  const lastWeek = getLocalDateStr(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const lastMonth = getLocalDateStr(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  const stats = {
    totalRevenueExpected: 0,
    totalPaid: 0,
    totalDebt: 0,
    todayIncome: 0,
    todayCount: 0,
    lastWeekIncome: 0,
    lastMonthIncome: 0,
    totalExpenses: 0,
    orthoExpectedRevenue: 0,
    totalOrthoRevenue: 0,
    doctorStats: {} as Record<string, number>,
    treatmentStats: {} as Record<string, number>,
    chartData: [] as { date: string, income: number }[]
  };

  const dayMap = new Map<string, number>();
  const defaultDoc = 'dr_abbas'; // Default attribution for unmapped money

  patients.forEach(p => {
    // 1. REVENUE CALCULATION (Potential)
    const procTotal = (p.procedures || []).reduce((sum, proc) => sum + (proc.price || 0), 0);
    const standardRevenue = Math.max(p.totalCost || 0, procTotal);
    const orthoRevenue = p.orthoTotalCost || 0;
    const conFeeValue = (p.consultationFeeCount || 0) * 5; // Multiplier from old UI logic

    const pTotalExpected = standardRevenue + orthoRevenue + conFeeValue;
    stats.totalRevenueExpected += pTotalExpected;
    stats.orthoExpectedRevenue += orthoRevenue;

    // 2. PAID CALCULATION (Collections)
    const procPayments = (p.procedures || []).reduce((sum, proc) => {
      return sum + (proc.payments || []).reduce((pSum, pay) => pSum + (pay.amount || 0), 0);
    }, 0);
    const generalPayments = (p.payments || []).reduce((sum, pay) => sum + (pay.amount || 0), 0);
    const standardPaid = Math.max(p.paidAmount || 0, procPayments + generalPayments);

    const orthoVisitsPaid = (p.orthoVisits || []).reduce((sum, v) => sum + (v.paymentReceived || 0), 0);
    const orthoPaidTotal = Math.max(p.orthoPaidAmount || 0, orthoVisitsPaid);

    // Assuming con fees are collected if the count is > 0
    const pTotalPaid = standardPaid + orthoPaidTotal + conFeeValue;
    stats.totalPaid += pTotalPaid;
    stats.totalOrthoRevenue += orthoPaidTotal;
    stats.totalDebt += Math.max(0, pTotalExpected - pTotalPaid);

    // 3. FINANCIAL ATTRIBUTION (Strict Cash-Basis for Charts)

    // a. Consultation Fees
    if (conFeeValue > 0) {
      stats.treatmentStats['كشفية / معاينة'] = (stats.treatmentStats['كشفية / معاينة'] || 0) + conFeeValue;
      stats.doctorStats[defaultDoc] = (stats.doctorStats[defaultDoc] || 0) + conFeeValue;
    }

    // b. Ortho Revenue DOCTOR (Strict Cash Basis)
    if (orthoPaidTotal > 0) {
      const orthoDoc = p.orthoDoctorId || defaultDoc;
      stats.treatmentStats['تقويم الأسنان'] = (stats.treatmentStats['تقويم الأسنان'] || 0) + orthoPaidTotal;
      stats.doctorStats[orthoDoc] = (stats.doctorStats[orthoDoc] || 0) + orthoPaidTotal;
    }

    // c. Standard Revenue (Strict Procedure Payments)
    (p.procedures || []).forEach(proc => {
      const procPaySum = (proc.payments || []).reduce((sum, pay) => sum + (pay.amount || 0), 0);

      if (procPaySum > 0) {
        const type = proc.type || 'علاجات أخرى'; // RAW TYPE, NO CLEANING
        const dId = proc.doctorId || defaultDoc;

        stats.treatmentStats[type] = (stats.treatmentStats[type] || 0) + procPaySum;
        stats.doctorStats[dId] = (stats.doctorStats[dId] || 0) + procPaySum;
      }
    });

    // d. General Payments (Unattached)
    if (generalPayments > 0) {
      stats.treatmentStats['علاجات عامة'] = (stats.treatmentStats['علاجات عامة'] || 0) + generalPayments;
      stats.doctorStats[defaultDoc] = (stats.doctorStats[defaultDoc] || 0) + generalPayments;
    }

    // 4. CASH FLOW TRACKING (Date-Based)

    // a. Consultation Fees (Assume paid at creation if no specific record exists)
    if (conFeeValue > 0) {
      const cDate = (typeof p.createdAt === 'string' ? p.createdAt.split('T')[0] : getLocalDateStr());
      if (cDate === today) {
        stats.todayIncome += conFeeValue;
      }
      if (cDate >= lastWeek) {
        stats.lastWeekIncome += conFeeValue;
      }
      if (cDate >= lastMonth) {
        stats.lastMonthIncome += conFeeValue;
      }
      dayMap.set(cDate, (dayMap.get(cDate) || 0) + conFeeValue);
    }

    // b. Payments Registry
    const allPayments = [
      ...(p.payments || []),
      ...(p.procedures || []).flatMap(proc => proc.payments || []),
      ...(p.orthoVisits || []).map(v => ({ amount: v.paymentReceived, date: v.visitDate }))
    ];

    allPayments.forEach(pay => {
      const pDate = pay.date;
      if (!pDate || !pay.amount) {
        return;
      }
      if (pDate === today) {
        stats.todayIncome += pay.amount;
      }
      if (pDate >= lastWeek) {
        stats.lastWeekIncome += pay.amount;
      }
      if (pDate >= lastMonth) {
        stats.lastMonthIncome += pay.amount;
      }
      dayMap.set(pDate, (dayMap.get(pDate) || 0) + pay.amount);
    });
  });

  appointments.forEach(a => {
    if (a.date === today) {
      stats.todayCount++;
    }
  });

  expenses.forEach(e => {
    stats.totalExpenses += e.amount;
  });

  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const s = getLocalDateStr(d);
    stats.chartData.push({ date: s, income: dayMap.get(s) || 0 });
  }

  return stats;
}


// Note: setupRealtimeSubscriptions is called from App.tsx, not here
// This prevents duplicate subscriptions and faster module load

