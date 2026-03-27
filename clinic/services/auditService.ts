import { AuditLog, AuditAction, DOCTORS } from '../types';
import { getCurrentDoctorId } from '../hooks/useDoctorContext';
import { storage } from './storage';
import { aiLearning } from './aiLearning';

const CACHE_KEY = 'audit_logs';
const MAX_LOCAL_LOGS = 100;

// Listeners for activity feed refresh
type ActivityListener = () => void;
const activityListeners = new Set<ActivityListener>();

// Use shared supabase client
import { supabase } from './db';

// Removed local client creation to avoid duplicates
// const SUPABASE_URL = ...
// const SUPABASE_ANON_KEY = ...
// const supabase = ...

// UUID generator
const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Action labels in Arabic for display
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
    add_patient: 'إضافة مريض',
    edit_patient: 'تعديل بيانات مريض',
    delete_patient: 'حذف مريض',
    add_procedure: 'إضافة إجراء علاجي',
    edit_procedure: 'تعديل إجراء',
    complete_procedure: 'إكمال إجراء',
    delete_procedure: 'حذف إجراء',
    add_payment: 'تسجيل دفعة',
    add_appointment: 'إضافة موعد',
    edit_appointment: 'تعديل موعد',
    cancel_appointment: 'إلغاء موعد',
    delete_appointment: 'حذف موعد',
    add_ortho_visit: 'إضافة زيارة تقويم',
    edit_ortho_visit: 'تعديل زيارة تقويم'
};

interface LogParams {
    action: AuditAction;
    entityType: AuditLog['entityType'];
    entityId: string;
    patientId?: string;
    patientName?: string;
    description: string;
    oldValue?: unknown;
    newValue?: unknown;
    doctorId?: string; // Optional override
}

const mapAuditFromDB = (data: { [key: string]: any }): AuditLog => ({
    id: data.id,
    doctorId: data.doctor_id,
    action: data.action,
    entityType: data.entity_type,
    entityId: data.entity_id,
    patientId: data.patient_id,
    patientName: data.patient_name,
    description: data.description,
    oldValue: data.old_value ? JSON.stringify(data.old_value) : undefined,
    newValue: data.new_value ? JSON.stringify(data.new_value) : undefined,
    timestamp: data.timestamp || Date.now(),
    createdAt: data.created_at
});

export const auditService = {
    /**
     * Log an activity
     */
    log: async (params: LogParams): Promise<void> => {
        const doctorId = params.doctorId || getCurrentDoctorId();
        const logEntry: AuditLog = {
            id: generateUUID(),
            doctorId: doctorId,
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            patientId: params.patientId,
            patientName: params.patientName,
            description: params.description,
            oldValue: params.oldValue ? JSON.stringify(params.oldValue) : undefined,
            newValue: params.newValue ? JSON.stringify(params.newValue) : undefined,
            timestamp: Date.now(),
            createdAt: new Date().toISOString()
        };

        // 1. Save locally for instant offline support
        try {
            const localLogs = await auditService.getLocalLogs();
            const updatedLogs = [logEntry, ...localLogs].slice(0, MAX_LOCAL_LOGS);
            await storage.setItem(CACHE_KEY, updatedLogs);

            // Notify UI for instant update
            activityListeners.forEach(l => l());

            // 2. Feed the AI Learning Engine
            aiLearning.recordAction(doctorId, params.action).catch(e =>
                console.error('[AI] Pattern recording failed:', e)
            );
        } catch (e) {
            console.error('[Audit] Local cache save failed:', e);
        }

        if (!supabase) {
            console.warn('[Audit] Supabase not configured, skipping remote audit log');
            return;
        }

        try {
            const { error } = await supabase.from('audit_logs').insert({
                id: logEntry.id,
                doctor_id: logEntry.doctorId,
                action: logEntry.action,
                entity_type: logEntry.entityType,
                entity_id: logEntry.entityId,
                patient_id: logEntry.patientId,
                patient_name: logEntry.patientName,
                description: logEntry.description,
                old_value: params.oldValue,
                new_value: params.newValue,
                timestamp: logEntry.timestamp
            });

            if (error) {
                console.error('[Audit] Failed to log activity to Supabase:', error);
            }
        } catch (e) {
            console.error('[Audit] Error logging activity to Supabase:', e);
        }
    },

    getLocalLogs: async (): Promise<AuditLog[]> => {
        return (await storage.getItem<AuditLog[]>(CACHE_KEY)) || [];
    },

    /**
     * Get recent activity logs
     */
    getRecent: async (limit: number = 50): Promise<AuditLog[]> => {
        // 1. Get Local Logs (Fast)
        const local = await auditService.getLocalLogs();

        if (!supabase) {
            return local.slice(0, limit);
        }

        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (error) {
                throw error;
            }

            const remote = (data || []).map(mapAuditFromDB);

            // Merge & Deduplicate
            const merged = [...remote];
            local.forEach(l => {
                if (!merged.find(m => m.id === l.id)) {
                    merged.push(l);
                }
            });

            const sorted = merged.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

            // Update cache with fresh data
            await storage.setItem(CACHE_KEY, sorted.slice(0, MAX_LOCAL_LOGS));

            return sorted;
        } catch (e) {
            console.error('[Audit] Failed to fetch logs:', e);
            return local.slice(0, limit);
        }
    },

    /**
     * Get logs by doctor
     */
    getByDoctor: async (doctorId: string, limit: number = 50): Promise<AuditLog[]> => {
        if (!supabase) {
            return [];
        }

        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('doctor_id', doctorId)
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (error) {
                throw error;
            }
            return (data || []).map(mapAuditFromDB);
        } catch (e) {
            console.error('[Audit] Failed to fetch doctor logs:', e);
            return [];
        }
    },

    /**
     * Get logs by patient
     */
    getByPatient: async (patientId: string): Promise<AuditLog[]> => {
        if (!supabase) {
            return [];
        }

        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('patient_id', patientId)
                .order('timestamp', { ascending: false });

            if (error) {
                throw error;
            }
            return (data || []).map(mapAuditFromDB);
        } catch (e) {
            console.error('[Audit] Failed to fetch patient logs:', e);
            return [];
        }
    },

    /**
     * Get doctor name by ID
     */
    getDoctorName: (doctorId: string): string => {
        const doctor = DOCTORS.find(d => d.id === doctorId);
        return doctor?.name || doctorId;
    },

    subscribeToActivity: (listener: ActivityListener) => {
        activityListeners.add(listener);
        return () => activityListeners.delete(listener);
    },

    /**
     * Fetch the entire history from Supabase for AI training
     */
    getFullHistory: async (doctorId: string): Promise<AuditLog[]> => {
        const localLogs = await auditService.getLocalLogs();
        if (!supabase) {
            return localLogs;
        }

        try {
            console.log(`[Audit] Fetching full history for doctor ${doctorId}...`);
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('doctor_id', doctorId)
                .order('timestamp', { ascending: true });

            if (error) {
                throw error;
            }

            return (data || []).map(mapAuditFromDB);
        } catch (e) {
            console.error('[Audit] Failed to fetch full history:', e);
            return localLogs;
        }
    }
};
