import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Patient, Appointment, Treatment, Doctor, WaitingPatient, ArrivalRecord, ClinicTask, SupplyRequest, ClinicExpense, DisplayPreferences, DEFAULT_DISPLAY_PREFERENCES, AssistantDoctorAssignment, AppUser } from '../types';
import {
  patients as initialPatients,
  appointments as initialAppointments,
  treatments as initialTreatments,
  doctors as initialDoctors,
} from '../lib/data';
import { generateId, sanitizeInput, validatePhone, validateEmail, parseJSON } from '../lib/security';
import { normalizePhone } from '../lib/search';
import { useAuth } from './AuthContext';
import * as db from '../lib/supabaseService';

export interface ClinicSettings {
  clinicName: string;
  clinicPhone?: string;
  clinicAddress?: string;
}

const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  clinicName: 'Iris Clinic',
  clinicPhone: '',
  clinicAddress: '',
};

interface ClinicContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id'>) => { success: boolean; error?: string; patient?: Patient };
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addTreatmentPlan: (patientId: string, plan: object) => void;
  updateTreatmentPlan: (patientId: string, planId: string, updates: object) => void;
  deleteTreatmentPlan: (patientId: string, planId: string) => void;

  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id'>) => { success: boolean; error?: string };
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  treatments: Treatment[];
  addTreatment: (treatment: Omit<Treatment, 'id'>) => void;

  doctors: Doctor[];
  addDoctor: (doctor: Omit<Doctor, 'id'>) => void;

  waitingRoom: WaitingPatient[];
  addToWaitingRoom: (entry: Omit<WaitingPatient, 'id'>) => void;
  updateWaitingStatus: (id: string, status: WaitingPatient['status']) => void;
  removeFromWaitingRoom: (id: string) => void;
  clearWaitingRoom: () => void;

  arrivalRecords: ArrivalRecord[];
  recordPatientArrival: (record: Omit<ArrivalRecord, 'id'>) => void;

  clinicSettings: ClinicSettings;
  updateClinicSettings: (settings: Partial<ClinicSettings>) => void;

  displayPreferences: DisplayPreferences;
  updateDisplayPreferences: (prefs: Partial<DisplayPreferences>) => void;

  tasks: ClinicTask[];
  addTask: (task: Omit<ClinicTask, 'id' | 'createdAt' | 'status'>) => void;
  completeTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;

  supplyRequests: SupplyRequest[];
  addSupplyRequest: (req: Omit<SupplyRequest, 'id' | 'createdAt' | 'status'>) => void;
  markSupplyPurchased: (id: string, price?: number, purchasedByUserId?: string) => void;
  deleteSupplyRequest: (id: string) => void;

  clinicExpenses: ClinicExpense[];
  addExpense: (expense: Omit<ClinicExpense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  assistantAssignments: AssistantDoctorAssignment[];
  addAssignment: (assistantUserId: string, doctorUserId: string) => void;
  removeAssignment: (id: string) => void;

  isLoading: boolean;
  error: string | null;
  clearError: () => void;

  stats: {
    totalPatients: number;
    totalAppointments: number;
    completedAppointments: number;
    scheduledAppointments: number;
    totalRevenue: number;
  };
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage with safe JSON parsing
  const [patients, setPatients] = useState<Patient[]>(() =>
    parseJSON(localStorage.getItem('clinic_patients'), initialPatients)
  );

  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    parseJSON(localStorage.getItem('clinic_appointments'), initialAppointments)
  );

  const [treatments, setTreatments] = useState<Treatment[]>(() =>
    parseJSON(localStorage.getItem('clinic_treatments_v2'), initialTreatments)
  );

  const [doctors, setDoctors] = useState<Doctor[]>(() =>
    parseJSON(localStorage.getItem('clinic_doctors_v2'), initialDoctors)
  );

  const [waitingRoom, setWaitingRoom] = useState<WaitingPatient[]>(() =>
    parseJSON(localStorage.getItem('clinic_waiting_room'), [])
  );

  const [arrivalRecords, setArrivalRecords] = useState<ArrivalRecord[]>(() =>
    parseJSON(localStorage.getItem('clinic_arrival_records'), [])
  );

  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(() =>
    parseJSON(localStorage.getItem('clinic_settings'), DEFAULT_CLINIC_SETTINGS)
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from Supabase on mount
  useEffect(() => {
    let mounted = true;
    Promise.all([
      db.fetchPatients(),
      db.fetchAppointments(),
      db.fetchExpenses(),
      db.fetchSupplyRequests(),
      db.fetchTasks(),
      db.fetchTreatments(),
      db.fetchSettings(),
    ]).then(([patientsData, aptsData, expsData, reqsData, tasksData, treatmentsData, settingsData]) => {
      if (!mounted) return;
      
      // Crucial: Only update state if fetch was successful (not null)
      // This prevents clearing local data on connection error
      if (patientsData !== null) setPatients(patientsData);
      if (aptsData !== null) setAppointments(aptsData);
      if (expsData !== null) setClinicExpenses(expsData);
      if (reqsData !== null) setSupplyRequests(reqsData);
      if (tasksData !== null) setTasks(tasksData);
      if (treatmentsData !== null) setTreatments(treatmentsData);
      if (settingsData !== null) setClinicSettings(settingsData);
      
      // If any of the main entities failed to load, notify the user
      if (patientsData === null || aptsData === null) {
        setError('تعذر في الاتصال بالسيرفر. يتم استخدام البيانات المحلية حالياً.');
      }
      
      setIsLoading(false);
    }).catch(err => {
      console.error('Failed to init from Supabase:', err);
      if (mounted) {
        setIsLoading(false);
        setError('خطأ في الاتصال بالسيرفر. يرجoy التأكد من الإنترنت.');
      }
    });
    return () => { mounted = false; };
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('clinic_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('clinic_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('clinic_treatments_v2', JSON.stringify(treatments));
  }, [treatments]);

  useEffect(() => {
    localStorage.setItem('clinic_doctors_v2', JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem('clinic_waiting_room', JSON.stringify(waitingRoom));
  }, [waitingRoom]);

  useEffect(() => {
    localStorage.setItem('clinic_arrival_records', JSON.stringify(arrivalRecords));
  }, [arrivalRecords]);

  useEffect(() => {
    localStorage.setItem('clinic_settings', JSON.stringify(clinicSettings));
  }, [clinicSettings]);

  const [displayPreferences, setDisplayPreferences] = useState<DisplayPreferences>(() => ({
    ...DEFAULT_DISPLAY_PREFERENCES,
    ...parseJSON(localStorage.getItem('clinic_display_preferences'), {}),
  }));

  useEffect(() => {
    localStorage.setItem('clinic_display_preferences', JSON.stringify(displayPreferences));
  }, [displayPreferences]);

  const [tasks, setTasks] = useState<ClinicTask[]>(() =>
    parseJSON(localStorage.getItem('clinic_tasks'), [])
  );

  useEffect(() => {
    localStorage.setItem('clinic_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>(() =>
    parseJSON(localStorage.getItem('clinic_supply_requests'), [])
  );

  useEffect(() => {
    localStorage.setItem('clinic_supply_requests', JSON.stringify(supplyRequests));
  }, [supplyRequests]);

  const [assistantAssignments, setAssistantAssignments] = useState<AssistantDoctorAssignment[]>(() =>
    parseJSON(localStorage.getItem('clinic_assistant_assignments'), [])
  );

  useEffect(() => {
    localStorage.setItem('clinic_assistant_assignments', JSON.stringify(assistantAssignments));
  }, [assistantAssignments]);

  // ── Sync doctors from Auth users ──
  const { users: authUsers } = useAuth();
  useEffect(() => {
    const doctorUsers = authUsers.filter((u: AppUser) => (u.role === 'doctor' || u.role === 'admin') && u.isActive);
    if (doctorUsers.length > 0) {
      const syncedDoctors: Doctor[] = doctorUsers.map((u: AppUser) => ({
        id: u.id,
        name: u.displayName,
        specialization: u.specialization || 'طبيب أسنان',
        color: u.color || '#0d9488',
      }));
      // Only update if actually changed to avoid infinite loops
      const currentJSON = JSON.stringify(doctors.map((d: Doctor) => ({ id: d.id, name: d.name, specialization: d.specialization, color: d.color })));
      const newJSON = JSON.stringify(syncedDoctors.map((d: Doctor) => ({ id: d.id, name: d.name, specialization: d.specialization, color: d.color })));
      if (currentJSON !== newJSON) {
        setDoctors(syncedDoctors);
      }
    }
  }, [authUsers]);

  // ── Patient Operations ──
  const addPatient = useCallback((patientData: Omit<Patient, 'id'>) => {
    const sanitizedData = {
      ...patientData,
      name: sanitizeInput(patientData.name),
      phone: sanitizeInput(patientData.phone),
      email: patientData.email ? sanitizeInput(patientData.email) : undefined,
    };

    if (!sanitizedData.name || sanitizedData.name.trim().length < 2) {
      return { success: false, error: 'الاسم يجب أن يكون على الأقل حرفين' };
    }
    if (sanitizedData.phone && !validatePhone(sanitizedData.phone)) {
      return { success: false, error: 'رقم الهاتف غير صالح' };
    }
    if (sanitizedData.email && !validateEmail(sanitizedData.email)) {
      return { success: false, error: 'البريد الإلكتروني غير صالح' };
    }

    // Duplicate detection using current state (read from patients directly)
    const newPhoneDigits = normalizePhone(sanitizedData.phone);
    const phoneExists = patients.some((p: Patient) => normalizePhone(p.phone) === newPhoneDigits && newPhoneDigits.length > 0);
    if (phoneExists) {
      return { success: false, error: 'رقم الهاتف مسجل بالفعل لمريض آخر' };
    }
    if (sanitizedData.email) {
      const emailExists = patients.some((p: Patient) => (p.email || '').toLowerCase() === sanitizedData.email!.toLowerCase());
      if (emailExists) {
        return { success: false, error: 'البريد الإلكتروني مسجل بالفعل لمريض آخر' };
      }
    }

    const newPatient: Patient = { ...sanitizedData, id: generateId() };
    setPatients((prev) => [...prev, newPatient]);
    
    db.upsertPatient(newPatient).catch(err => {
      setPatients((prev) => prev.filter(p => p.id !== newPatient.id));
      setError(`فشل حفظ المريض في السيرفر: ${err.message || 'يرجى المحاولة مجدداً'}`);
    });
    
    return { success: true, patient: newPatient };
  }, [patients]);

  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    // Capture original BEFORE setState so it's available in .catch() closure
    const originalPatient = patients.find((p: Patient) => p.id === id);
    
    setPatients((prev: Patient[]) => {
      return prev.map((p: Patient) => (p.id === id ? { ...p, ...updates } : p));
    });
    
    if (originalPatient) {
      const targetP = { ...originalPatient, ...updates } as Patient;
      db.upsertPatient(targetP).catch(err => {
        setPatients((prev: Patient[]) => prev.map((p: Patient) => p.id === id ? originalPatient : p));
        setError(`فشل تحديث بيانات المريض: ${err.message || 'يرجى المحاولة مجدداً'}`);
      });
    }
  }, [patients]);

  const deletePatient = useCallback((id: string) => {
    let originalPatient: Patient | undefined;
    let originalAppointments: Appointment[] = [];
    
    setPatients((prev: Patient[]) => {
      originalPatient = prev.find(p => p.id === id);
      return prev.filter((p: Patient) => p.id !== id);
    });
    
    // Also remove related appointments
    setAppointments((prev: Appointment[]) => {
      originalAppointments = prev.filter(a => a.patientId === id);
      return prev.filter((a: Appointment) => a.patientId !== id);
    });
    
    db.deletePatientDB(id).catch(err => {
      if (originalPatient) {
        setPatients(prev => [...prev, originalPatient!]);
        setAppointments(prev => [...prev, ...originalAppointments]);
        setError(`فشل حذف المريض من السيرفر: ${err.message || 'يرجى المحاولة مجدداً'}`);
      }
    });
  }, []);

  // ── Treatment Plan Operations ──
  const addTreatmentPlan = useCallback((patientId: string, plan: any) => {
    const newPlanId = generateId();
    setPatients((prev: Patient[]) => {
      const updatedList = prev.map((p: Patient) => {
        if (p.id === patientId) {
          const newPlan = {
            ...plan,
            id: newPlanId,
            createdAt: new Date().toISOString(),
          };
          const updated = {
            ...p,
            treatmentPlans: p.treatmentPlans ? [...p.treatmentPlans, newPlan] : [newPlan],
          };
          db.upsertPatient(updated).catch(err => {
            // Rollback: remove the newly added plan
            setPatients((rollback: Patient[]) => rollback.map((rp: Patient) => {
              if (rp.id === patientId) {
                return { ...rp, treatmentPlans: (rp.treatmentPlans || []).filter((tp: any) => tp.id !== newPlanId) };
              }
              return rp;
            }));
            setError(`فشل حفظ خطة العلاج: ${err.message || 'يرجى المحاولة مجدداً'}`);
          });
          return updated;
        }
        return p;
      });
      return updatedList;
    });
  }, []);

  const updateTreatmentPlan = useCallback((patientId: string, planId: string, updates: object) => {
    // Capture original plan for rollback
    const originalPatient = patients.find((p: Patient) => p.id === patientId);
    const originalPlan = originalPatient?.treatmentPlans?.find((tp: any) => tp.id === planId);
    
    setPatients((prev: Patient[]) => {
      const updatedList = prev.map((p: Patient) => {
        if (p.id === patientId && p.treatmentPlans) {
          const updated = {
            ...p,
            treatmentPlans: p.treatmentPlans.map((plan: any) =>
              plan.id === planId ? { ...plan, ...updates } : plan
            ),
          };
          db.upsertPatient(updated).catch(err => {
            // Rollback to original plan
            if (originalPlan) {
              setPatients((rollback: Patient[]) => rollback.map((rp: Patient) => {
                if (rp.id === patientId && rp.treatmentPlans) {
                  return { ...rp, treatmentPlans: rp.treatmentPlans.map((tp: any) => tp.id === planId ? originalPlan : tp) };
                }
                return rp;
              }));
            }
            setError(`فشل تحديث خطة العلاج: ${err.message || 'يرجى المحاولة مجدداً'}`);
          });
          return updated;
        }
        return p;
      });
      return updatedList;
    });
  }, [patients]);

  const deleteTreatmentPlan = useCallback((patientId: string, planId: string) => {
    // Capture original plan for rollback
    const originalPatient = patients.find((p: Patient) => p.id === patientId);
    const deletedPlan = originalPatient?.treatmentPlans?.find((tp: any) => tp.id === planId);
    
    setPatients((prev: Patient[]) => {
      const updatedList = prev.map((p: Patient) => {
        if (p.id === patientId && p.treatmentPlans) {
          return {
            ...p,
            treatmentPlans: p.treatmentPlans.filter((plan: any) => plan.id !== planId),
          };
        }
        return p;
      });
      const targetP = updatedList.find((p: Patient) => p.id === patientId);
      if (targetP) {
        db.upsertPatient(targetP).catch(err => {
          // Rollback: restore deleted plan
          if (deletedPlan) {
            setPatients((rollback: Patient[]) => rollback.map((rp: Patient) => {
              if (rp.id === patientId) {
                return { ...rp, treatmentPlans: [...(rp.treatmentPlans || []), deletedPlan] };
              }
              return rp;
            }));
          }
          setError(`فشل حذف خطة العلاج: ${err.message || 'يرجى المحاولة مجدداً'}`);
        });
      }
      return updatedList;
    });
  }, [patients]);

  // ── Appointment Operations ──
  const addAppointment = useCallback((appointmentData: Omit<Appointment, 'id'>) => {
    if (!appointmentData.patientId || !appointmentData.treatment) {
      return { success: false, error: 'بيانات الموعد غير مكتملة' };
    }
    const newAppointment: Appointment = {
      ...appointmentData,
      id: generateId(),
    };
    setAppointments((prev: Appointment[]) => [...prev, newAppointment]);
    
    db.upsertAppointment(newAppointment).catch(err => {
      setAppointments(prev => prev.filter(a => a.id !== newAppointment.id));
      setError(`فشل حفظ الموعد في السيرفر: ${err.message || 'يرجى المحاولة مجدداً'}`);
    });
    
    return { success: true };
  }, []);

  const updateAppointmentStatus = useCallback((id: string, status: Appointment['status']) => {
    // Capture original BEFORE setState so it's available in .catch() closure
    const originalApt = appointments.find((a: Appointment) => a.id === id);
    
    setAppointments((prev: Appointment[]) => {
      return prev.map((apt: Appointment) => (apt.id === id ? { ...apt, status } : apt));
    });
    
    if (originalApt) {
      const targetApt = { ...originalApt, status };
      db.upsertAppointment(targetApt).catch(err => {
        setAppointments(prev => prev.map(a => a.id === id ? originalApt : a));
        setError(`فشل تحديث حالة الموعد: ${err.message || 'يرجى المحاولة مجدداً'}`);
      });
    }
  }, [appointments]);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    // Capture original BEFORE setState so it's available in .catch() closure
    const originalApt = appointments.find((a: Appointment) => a.id === id);
    
    setAppointments((prev: Appointment[]) => {
      return prev.map((apt: Appointment) => (apt.id === id ? { ...apt, ...updates } : apt));
    });
    
    if (originalApt) {
      const targetApt = { ...originalApt, ...updates } as Appointment;
      db.upsertAppointment(targetApt).catch(err => {
        setAppointments(prev => prev.map(a => a.id === id ? originalApt : a));
        setError(`فشل تحديث بيانات الموعد: ${err.message || 'يرجى المحاولة مجدداً'}`);
      });
    }
  }, [appointments]);

  const deleteAppointment = useCallback((id: string) => {
    let originalApt: Appointment | undefined;
    
    setAppointments((prev: Appointment[]) => {
      originalApt = prev.find(a => a.id === id);
      return prev.filter((apt: Appointment) => apt.id !== id);
    });
    
    db.deleteAppointmentDB(id).catch(err => {
      if (originalApt) {
        setAppointments(prev => [...prev, originalApt!]);
        setError(`فشل حذف الموعد من السيرفر: ${err.message || 'يرجى المحاولة مجدداً'}`);
      }
    });
  }, []);

  // ── Treatment & Doctor Operations ──
  const addTreatment = useCallback((treatmentData: Omit<Treatment, 'id'>) => {
    const newTreatment: Treatment = { ...treatmentData, id: generateId() };
    setTreatments((prev: Treatment[]) => [...prev, newTreatment]);
    db.upsertTreatment(newTreatment).catch(err => {
      setTreatments(prev => prev.filter(t => t.id !== newTreatment.id));
      setError(`فشل حفظ الخدمة: ${err.message || 'يرجى المحاولة مجدداً'}`);
    });
  }, []);

  const addDoctor = useCallback((doctorData: Omit<Doctor, 'id'>) => {
    const newDoctor: Doctor = { ...doctorData, id: generateId() };
    setDoctors((prev: Doctor[]) => [...prev, newDoctor]);
    // Note: doctors are currently derived from users, so we don't upsert directly to a doctors table
  }, []);

  // ── Waiting Room Operations ──
  const addToWaitingRoom = useCallback((entry: Omit<WaitingPatient, 'id'>) => {
    const newEntry: WaitingPatient = { ...entry, id: generateId() };
    setWaitingRoom((prev: WaitingPatient[]) => [...prev, newEntry]);
  }, []);

  const updateWaitingStatus = useCallback((id: string, status: WaitingPatient['status']) => {
    setWaitingRoom((prev: WaitingPatient[]) => {
      const entry = prev.find((w: WaitingPatient) => w.id === id);
      if (entry) {
        setArrivalRecords((recordsPrev: ArrivalRecord[]) => recordsPrev.map((record: ArrivalRecord) => {
          if (record.patientId === entry.patientId && (!entry.appointmentId || record.appointmentId === entry.appointmentId)) {
            const now = new Date().toISOString();
            if (status === 'in_session' && !record.sessionStartTime) {
              return { ...record, sessionStartTime: now };
            } else if (status === 'done' && !record.sessionEndTime) {
              return { ...record, sessionEndTime: now };
            }
          }
          return record;
        }));
      }
      return prev.map((w: WaitingPatient) => (w.id === id ? { ...w, status } : w));
    });
  }, []);

  const removeFromWaitingRoom = useCallback((id: string) => {
    setWaitingRoom((prev: WaitingPatient[]) => {
      const entry = prev.find((w: WaitingPatient) => w.id === id);
      if (entry) {
        setArrivalRecords((recordsPrev: ArrivalRecord[]) => recordsPrev.map((record: ArrivalRecord) => {
          if (record.patientId === entry.patientId && (!entry.appointmentId || record.appointmentId === entry.appointmentId)) {
            if (!record.sessionEndTime) {
              return { ...record, sessionEndTime: new Date().toISOString() };
            }
          }
          return record;
        }));
      }
      return prev.filter((w: WaitingPatient) => w.id !== id);
    });
  }, []);

  const clearWaitingRoom = useCallback(() => {
    setWaitingRoom([]);
  }, []);

  // ── Arrival Record Operations ──
  const recordPatientArrival = useCallback((recordData: Omit<ArrivalRecord, 'id'>) => {
    const newRecord: ArrivalRecord = { ...recordData, id: generateId() };
    setArrivalRecords((prev: ArrivalRecord[]) => [...prev, newRecord]);
  }, []);

  // ── Clinic Settings ──
  const updateClinicSettings = useCallback(async (settings: Partial<ClinicSettings>) => {
    const originalSettings = clinicSettings;
    const next = { ...clinicSettings, ...settings };
    setClinicSettings(next);
    
    try {
      await db.upsertSettings(next);
    } catch (err: any) {
      setClinicSettings(originalSettings);
      setError(`فشل حفظ الإعدادات: ${err.message || 'يرجى المحاولة مجدداً'}`);
    }
  }, [clinicSettings]);

  // ── Error Management ──
  const clearError = useCallback(() => setError(null), []);

  // ── Computed Stats ──
  const stats = useMemo(() => {
    const completedApts = appointments.filter((a: Appointment) => a.status === 'completed');
    const scheduledApts = appointments.filter((a: Appointment) => a.status === 'scheduled');
    
    let totalRevenue = 0;
    patients.forEach((p: Patient) => {
      p.treatmentPlans?.forEach((plan: any) => {
        plan.payments?.forEach((pay: any) => {
          totalRevenue += Number(pay.amount || 0);
        });
      });
    });

    if (totalRevenue === 0) {
      totalRevenue = completedApts.reduce((sum: number, apt: Appointment) => {
        const treatment = treatments.find((t: Treatment) => t.name === apt.treatment);
        return sum + (treatment?.price || 0);
      }, 0);
    }

    return {
      totalPatients: patients.length,
      totalAppointments: appointments.length,
      completedAppointments: completedApts.length,
      scheduledAppointments: scheduledApts.length,
      totalRevenue,
    };
  }, [patients, appointments, treatments]);

  // ── Task Operations ──
  const addTask = useCallback((taskData: Omit<ClinicTask, 'id' | 'createdAt' | 'status'>) => {
    const newTask: ClinicTask = {
      ...taskData,
      id: generateId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setTasks((prev: ClinicTask[]) => [...prev, newTask]);
    db.upsertTask(newTask).catch(err => {
      setTasks((prev: ClinicTask[]) => prev.filter(t => t.id !== newTask.id));
      setError(`فشل حفظ المهمة: ${err.message || 'يرجى المحاولة مجدداً'}`);
    });
  }, []);

  const completeTask = useCallback((taskId: string) => {
    const originalTask = tasks.find((t: ClinicTask) => t.id === taskId);
    const completedAt = new Date().toISOString();
    
    setTasks((prev: ClinicTask[]) => {
      return prev.map((t: ClinicTask) =>
        t.id === taskId ? { ...t, status: 'completed' as const, completedAt } : t
      );
    });
    
    if (originalTask) {
      db.upsertTask({ ...originalTask, status: 'completed', completedAt }).catch(err => {
        setTasks((prev: ClinicTask[]) => prev.map(t => t.id === taskId ? originalTask : t));
        setError(`فشل إكمال المهمة: ${err.message || 'يرجى المحاولة مجدداً'}`);
      });
    }
  }, [tasks]);

  const deleteTask = useCallback((taskId: string) => {
    const originalTask = tasks.find((t: ClinicTask) => t.id === taskId);
    setTasks((prev: ClinicTask[]) => prev.filter((t: ClinicTask) => t.id !== taskId));
    db.deleteTaskDB(taskId).catch(err => {
      if (originalTask) setTasks(prev => [...prev, originalTask]);
      setError(`فشل حذف المهمة: ${err.message || 'يرجى المحاولة مجدداً'}`);
    });
  }, [tasks]);

  // ── Supply Request Operations ──
  const addSupplyRequest = useCallback((data: Omit<SupplyRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: SupplyRequest = {
      ...data,
      id: generateId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setSupplyRequests((prev: SupplyRequest[]) => [...prev, newReq]);
    db.upsertSupplyRequest(newReq).catch(err => {
      setSupplyRequests((prev: SupplyRequest[]) => prev.filter(r => r.id !== newReq.id));
      setError(`فشل حفظ طلب المستلزم: ${err.message || 'يرجى المحاولة مجدداً'}`);
    });
  }, []);

  const markSupplyPurchased = useCallback((id: string, price?: number, purchasedByUserId?: string) => {
    const now = new Date().toISOString();
    const originalReq = supplyRequests.find((r: SupplyRequest) => r.id === id);
    let expenseId: string | null = null;
    
    if (originalReq && price && price > 0) {
      expenseId = generateId();
      const expense: ClinicExpense = {
        id: expenseId,
        amount: price,
        category: 'supply',
        description: `شراء مستلزم: ${originalReq.name}${originalReq.quantity > 1 ? ` (×${originalReq.quantity})` : ''}`,
        date: now,
        createdByUserId: purchasedByUserId || '',
        supplyRequestId: id,
      };
      setClinicExpenses((prevExp: ClinicExpense[]) => [...prevExp, expense]);
      db.upsertExpense(expense).catch(err => {
        setClinicExpenses((prevExp: ClinicExpense[]) => prevExp.filter(e => e.id !== expense.id));
        setError(`فشل حفظ المصروف: ${err.message || 'يرجى المحاولة مجدداً'}`);
      });
    }
    
    setSupplyRequests((prev: SupplyRequest[]) => {
      return prev.map((r: SupplyRequest) =>
        r.id === id ? { ...r, status: 'purchased' as const, purchasedAt: now, purchasePrice: price } : r
      );
    });
    
    if (originalReq) {
      const updatedReq = { ...originalReq, status: 'purchased' as const, purchasedAt: now, purchasePrice: price };
      db.upsertSupplyRequest(updatedReq).catch(err => {
        // Rollback supply request status
        setSupplyRequests(prev => prev.map(r => r.id === id ? originalReq : r));
        // Rollback the expense too
        if (expenseId) setClinicExpenses(prev => prev.filter(e => e.id !== expenseId));
        setError(`فشل تحديث حالة المستلزم: ${err.message || 'يرجى المحاولة مجدداً'}`);
      });
    }
  }, [supplyRequests]);

  const deleteSupplyRequest = useCallback((id: string) => {
    const originalReq = supplyRequests.find((r: SupplyRequest) => r.id === id);
    setSupplyRequests((prev: SupplyRequest[]) => prev.filter((r: SupplyRequest) => r.id !== id));
    db.deleteSupplyRequestDB(id).catch(err => {
      if (originalReq) setSupplyRequests(prev => [...prev, originalReq]);
      setError(`فشل حذف طلب المستلزم: ${err.message || 'يرجى المحاولة مجدداً'}`);
    });
  }, [supplyRequests]);

  // ── Assistant Assignment Operations ──
  const addAssignment = useCallback((assistantUserId: string, doctorUserId: string) => {
    setAssistantAssignments((prev: AssistantDoctorAssignment[]) => {
      const filtered = prev.filter((a: AssistantDoctorAssignment) => a.assistantUserId !== assistantUserId);
      return [...filtered, { id: generateId(), assistantUserId, doctorUserId }];
    });
  }, []);

  const removeAssignment = useCallback((id: string) => {
    setAssistantAssignments((prev: AssistantDoctorAssignment[]) => prev.filter((a: AssistantDoctorAssignment) => a.id !== id));
  }, []);

  const updateDisplayPreferences = useCallback((prefs: Partial<DisplayPreferences>) => {
    setDisplayPreferences((prev: DisplayPreferences) => ({ ...prev, ...prefs }));
  }, []);

  // ── Clinic Expenses ──
  const [clinicExpenses, setClinicExpenses] = useState<ClinicExpense[]>(() =>
    parseJSON(localStorage.getItem('clinic_expenses'), [])
  );

  useEffect(() => {
    localStorage.setItem('clinic_expenses', JSON.stringify(clinicExpenses));
  }, [clinicExpenses]);

  const addExpense = useCallback((data: Omit<ClinicExpense, 'id'>) => {
    const newExpense: ClinicExpense = { ...data, id: generateId() };
    setClinicExpenses((prev: ClinicExpense[]) => [...prev, newExpense]);
    db.upsertExpense(newExpense).catch(err => {
      setClinicExpenses((prev: ClinicExpense[]) => prev.filter(e => e.id !== newExpense.id));
      setError(`فشل حفظ المصروف: ${err.message || 'يرجى المحاولة مجدداً'}`);
    });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    const originalExpense = clinicExpenses.find((e: ClinicExpense) => e.id === id);
    setClinicExpenses((prev: ClinicExpense[]) => prev.filter((e: ClinicExpense) => e.id !== id));
    db.deleteExpenseDB(id).catch(err => {
      if (originalExpense) setClinicExpenses(prev => [...prev, originalExpense]);
      setError(`فشل حذف المصروف: ${err.message || 'يرجى المحاولة مجدداً'}`);
    });
  }, [clinicExpenses]);

  const contextValue = useMemo<ClinicContextType>(() => ({
    patients,
    addPatient,
    updatePatient,
    deletePatient,
    addTreatmentPlan,
    updateTreatmentPlan,
    deleteTreatmentPlan,
    appointments,
    addAppointment,
    updateAppointmentStatus,
    updateAppointment,
    deleteAppointment,
    treatments,
    addTreatment,
    doctors,
    addDoctor,
    waitingRoom,
    addToWaitingRoom,
    updateWaitingStatus,
    removeFromWaitingRoom,
    clearWaitingRoom,
    arrivalRecords,
    recordPatientArrival,
    clinicSettings,
    updateClinicSettings,
    displayPreferences,
    updateDisplayPreferences,
    tasks,
    addTask,
    completeTask,
    deleteTask,
    supplyRequests,
    addSupplyRequest,
    markSupplyPurchased,
    assistantAssignments,
    addAssignment,
    removeAssignment,
    deleteSupplyRequest,
    clinicExpenses,
    addExpense,
    deleteExpense,
    isLoading,
    error,
    clearError,
    stats,
  }), [
    patients, addPatient, updatePatient, deletePatient,
    addTreatmentPlan, updateTreatmentPlan,
    appointments, addAppointment, updateAppointmentStatus,
    updateAppointment, deleteAppointment,
    treatments, addTreatment,
    doctors, addDoctor,
    waitingRoom, addToWaitingRoom, updateWaitingStatus, removeFromWaitingRoom, clearWaitingRoom,
    arrivalRecords, recordPatientArrival,
    clinicSettings, updateClinicSettings,
    displayPreferences, updateDisplayPreferences,
    tasks, addTask, completeTask, deleteTask,
    supplyRequests, addSupplyRequest, markSupplyPurchased, deleteSupplyRequest,
    clinicExpenses, addExpense, deleteExpense,
    assistantAssignments, addAssignment, removeAssignment,
    isLoading, error, clearError, stats,
  ]);

  return (
    <ClinicContext.Provider value={contextValue}>
      {children}
      {/* Global Error Toast for background persistence failures */}
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none">
           <div className="bg-rose-600/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-xl border border-rose-500/50 flex items-center gap-3 pointer-events-auto min-w-[300px] max-w-[90vw]">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="text-[14px] font-bold leading-relaxed flex-1">{error}</span>
              <button title="إغلاق التنبيه" onClick={clearError} className="p-2 hover:bg-white/20 rounded-full transition-colors shrink-0">
                 <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
        </div>
      )}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
