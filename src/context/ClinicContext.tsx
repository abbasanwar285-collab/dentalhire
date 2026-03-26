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
    ]).then(([patientsData, aptsData, expsData, reqsData, tasksData]) => {
      if (!mounted) return;
      if (patientsData && patientsData.length > 0) setPatients(patientsData);
      if (aptsData && aptsData.length > 0) setAppointments(aptsData);
      if (expsData && expsData.length > 0) setClinicExpenses(expsData);
      if (reqsData && reqsData.length > 0) setSupplyRequests(reqsData);
      if (tasksData && tasksData.length > 0) setTasks(tasksData);
      
      // Load Settings
      db.fetchSettings().then(settingsData => {
        if (!mounted) return;
        if (settingsData) setClinicSettings(settingsData);
        setIsLoading(false);
      });
    }).catch(err => {
      console.error('Failed to init from Supabase:', err);
      if (mounted) setIsLoading(false);
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
    if (!validatePhone(sanitizedData.phone)) {
      return { success: false, error: 'رقم الهاتف غير صالح' };
    }
    if (sanitizedData.email && !validateEmail(sanitizedData.email)) {
      return { success: false, error: 'البريد الإلكتروني غير صالح' };
    }

    // Duplicate detection by phone or email
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
  }, []);

  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    let originalPatient: Patient | undefined;
    
    setPatients((prev: Patient[]) => {
      originalPatient = prev.find((p: Patient) => p.id === id);
      return prev.map((p: Patient) => (p.id === id ? { ...p, ...updates } : p));
    });
    
    if (originalPatient) {
      const targetP = { ...originalPatient, ...updates } as Patient;
      db.upsertPatient(targetP).catch(err => {
        setPatients((prev: Patient[]) => prev.map((p: Patient) => p.id === id ? originalPatient! : p));
        setError(`فشل تحديث بيانات المريض: ${err.message || 'يرجى المحاولة مجدداً'}`);
      });
    }
  }, []);

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
    setPatients((prev: Patient[]) => {
      const updatedList = prev.map((p: Patient) => {
        if (p.id === patientId) {
          const newPlan = {
            ...plan,
            id: generateId(),
            createdAt: new Date().toISOString(),
          };
          const updated = {
            ...p,
            treatmentPlans: p.treatmentPlans ? [...p.treatmentPlans, newPlan] : [newPlan],
          };
          db.upsertPatient(updated);
          return updated;
        }
        return p;
      });
      return updatedList;
    });
  }, []);

  const updateTreatmentPlan = useCallback((patientId: string, planId: string, updates: object) => {
    setPatients((prev: Patient[]) => {
      const updatedList = prev.map((p: Patient) => {
        if (p.id === patientId && p.treatmentPlans) {
          const updated = {
            ...p,
            treatmentPlans: p.treatmentPlans.map((plan: any) =>
              plan.id === planId ? { ...plan, ...updates } : plan
            ),
          };
          db.upsertPatient(updated);
          return updated;
        }
        return p;
      });
      return updatedList;
    });
  }, []);

  const deleteTreatmentPlan = useCallback((patientId: string, planId: string) => {
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
      if (targetP) db.upsertPatient(targetP);
      return updatedList;
    });
  }, []);

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
    let originalApt: Appointment | undefined;
    
    setAppointments((prev: Appointment[]) => {
      originalApt = prev.find((a: Appointment) => a.id === id);
      return prev.map((apt: Appointment) => (apt.id === id ? { ...apt, status } : apt));
    });
    
    if (originalApt) {
      const targetApt = { ...originalApt, status };
      db.upsertAppointment(targetApt).catch(err => {
        setAppointments(prev => prev.map(a => a.id === id ? originalApt! : a));
        setError(`فشل تحديث حالة الموعد: ${err.message || 'يرجى المحاولة مجدداً'}`);
      });
    }
  }, []);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    let originalApt: Appointment | undefined;
    
    setAppointments((prev: Appointment[]) => {
      originalApt = prev.find((a: Appointment) => a.id === id);
      return prev.map((apt: Appointment) => (apt.id === id ? { ...apt, ...updates } : apt));
    });
    
    if (originalApt) {
      const targetApt = { ...originalApt, ...updates } as Appointment;
      db.upsertAppointment(targetApt).catch(err => {
        setAppointments(prev => prev.map(a => a.id === id ? originalApt! : a));
        setError(`فشل تحديث بيانات الموعد: ${err.message || 'يرجى المحاولة مجدداً'}`);
      });
    }
  }, []);

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
  }, []);

  const addDoctor = useCallback((doctorData: Omit<Doctor, 'id'>) => {
    const newDoctor: Doctor = { ...doctorData, id: generateId() };
    setDoctors((prev: Doctor[]) => [...prev, newDoctor]);
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
  const updateClinicSettings = useCallback((settings: Partial<ClinicSettings>) => {
    setClinicSettings((prev: ClinicSettings) => {
      const next = { ...prev, ...settings };
      db.upsertSettings(next);
      return next;
    });
  }, []);

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
    db.upsertTask(newTask);
  }, []);

  const completeTask = useCallback((taskId: string) => {
    setTasks((prev: ClinicTask[]) => {
      const updated = prev.map((t: ClinicTask) =>
        t.id === taskId ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t
      );
      const task = updated.find((t: ClinicTask) => t.id === taskId);
      if (task) db.upsertTask(task);
      return updated;
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev: ClinicTask[]) => prev.filter((t: ClinicTask) => t.id !== taskId));
    db.deleteTaskDB(taskId);
  }, []);

  // ── Supply Request Operations ──
  const addSupplyRequest = useCallback((data: Omit<SupplyRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: SupplyRequest = {
      ...data,
      id: generateId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setSupplyRequests((prev: SupplyRequest[]) => [...prev, newReq]);
    db.upsertSupplyRequest(newReq);
  }, []);

  const markSupplyPurchased = useCallback((id: string, price?: number, purchasedByUserId?: string) => {
    const now = new Date().toISOString();
    setSupplyRequests((prev: SupplyRequest[]) => {
      const item = prev.find((r: SupplyRequest) => r.id === id);
      if (item && price && price > 0) {
        const expense: ClinicExpense = {
          id: generateId(),
          amount: price,
          category: 'supply',
          description: `شراء مستلزم: ${item.name}${item.quantity > 1 ? ` (×${item.quantity})` : ''}`,
          date: now,
          createdByUserId: purchasedByUserId || '',
          supplyRequestId: id,
        };
        setClinicExpenses((prevExp: ClinicExpense[]) => [...prevExp, expense]);
        db.upsertExpense(expense);
      }
      const updated = prev.map((r: SupplyRequest) =>
        r.id === id ? { ...r, status: 'purchased' as const, purchasedAt: now, purchasePrice: price } : r
      );
      const req = updated.find((r: SupplyRequest) => r.id === id);
      if (req) db.upsertSupplyRequest(req);
      return updated;
    });
  }, []);

  const deleteSupplyRequest = useCallback((id: string) => {
    setSupplyRequests((prev: SupplyRequest[]) => prev.filter((r: SupplyRequest) => r.id !== id));
    db.deleteSupplyRequestDB(id);
  }, []);

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
    db.upsertExpense(newExpense);
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setClinicExpenses((prev: ClinicExpense[]) => prev.filter((e: ClinicExpense) => e.id !== id));
    db.deleteExpenseDB(id);
  }, []);

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
