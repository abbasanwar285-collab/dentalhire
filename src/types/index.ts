export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: string;
  notes?: string;
  wireSizeUpper?: string;
  wireSizeLower?: string;
  doctorId?: string;
}

export interface OrthoDetails {
  treatedJaw: 'Upper' | 'Lower' | 'Both';
  applianceType: 'Fixed Metal' | 'Clear' | 'Removable';
  caseType: 'Extraction Case' | 'Non-Extraction Case';
  expansion: boolean;
  diagnosis: string;
}

export interface TreatmentStep {
  id: string;
  date: string;
  description: string;
  amountPaid: number;
  doctorId: string;
  doctorName?: string;
  notes?: string;
}

export interface ToothTreatment {
  id: string;
  toothNumber: number; // FDI number
  treatmentType: string;
  cost: number;
  doctorId: string;
  notes?: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  name?: string; // Plan name e.g. "زراعة الفك السفلي"
  createdAt: string;
  totalCost: number;
  paidAmount: number;
  status: 'planned' | 'in_progress' | 'completed';
  treatments: ToothTreatment[];
  steps: TreatmentStep[];
  payments: PaymentRecord[];
  attachments: Attachment[];
  notes?: string;
  orthoDetails?: OrthoDetails;
  doctorId?: string;
  doctorName?: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  age?: number;
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;
  generalNotes?: string;
  lastVisit?: string;
  treatmentPlans?: TreatmentPlan[];
}

export interface WaitingPatient {
  id: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  appointmentId?: string;
  arrivalTime: string; // ISO string
  status: 'waiting' | 'in_session' | 'done';
  notes?: string;
}

export interface ArrivalRecord {
  id: string;
  patientId: string;
  appointmentId: string;
  scheduledTime: string;     // HH:mm
  scheduledDate: string;     // YYYY-MM-DD
  actualArrivalTime: string; // ISO string
  differenceMinutes: number; // negative = early, positive = late
  createdAt: string;         // ISO string
}

export type TaskPriority = 'urgent' | 'normal' | 'low';

export interface ClinicTask {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  assignedToUserId: string;
  createdByUserId: string;
  status: 'pending' | 'completed';
  relatedPatientId?: string;
  dueDate: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
}

export interface SupplyRequest {
  id: string;
  name: string;
  quantity: number;
  unit?: string;           // e.g. "علبة", "حبة", "أنبوب"
  urgency: 'urgent' | 'normal';
  notes?: string;
  requestedByUserId: string;
  status: 'pending' | 'purchased';
  createdAt: string;       // ISO string
  purchasedAt?: string;    // ISO string
  purchasePrice?: number;  // سعر الشراء
}

export type ExpenseCategory = 'supply' | 'salary' | 'rent' | 'maintenance' | 'other';

export interface ClinicExpense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;            // ISO string
  createdByUserId: string;
  supplyRequestId?: string; // ربط بمستلزم تم شراؤه
}

export interface AssistantDoctorAssignment {
  id: string;
  assistantUserId: string;  // ID of the assistant/secretary user
  doctorUserId: string;     // ID of the doctor user
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string; // New required field
  doctorName: string; // New required field
  date: string; // ISO string
  time: string; // HH:mm
  treatment: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Treatment {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  color?: string;
}

// ── RBAC Types ──

export interface DisplayPreferences {
  // Patient list
  dateFormat: 'absolute' | 'relative'; // "22-03-2026" vs "قبل يومين"
  showPhoneInList: boolean;
  showLastVisitInList: boolean;
  avatarStyle: 'square' | 'circle';
  // Patient profile
  showDentalChart: boolean;
  showMedicalHistory: boolean;
  showAppointments: boolean;
  showNotes: boolean;
  defaultPlanView: 'expanded' | 'collapsed';
}

export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  dateFormat: 'absolute',
  showPhoneInList: true,
  showLastVisitInList: true,
  avatarStyle: 'square',
  showDentalChart: true,
  showMedicalHistory: true,
  showAppointments: true,
  showNotes: true,
  defaultPlanView: 'expanded',
};

export type UserRole = 'admin' | 'doctor' | 'secretary' | 'accountant';

export interface UserPermissions {
  view_patients: boolean;
  edit_patients: boolean;
  delete_patients: boolean;
  view_appointments: boolean;
  edit_appointments: boolean;
  view_treatment_plans: boolean;
  edit_treatment_plans: boolean;
  view_prices: boolean;
  view_ortho_prices: boolean;
  view_implant_prices: boolean;
  view_payments: boolean;
  edit_payments: boolean;
  view_indicators: boolean;
  view_settings: boolean;
  manage_users: boolean;
  view_tasks: boolean;
  manage_tasks: boolean;
  purchase_supplies: boolean;
}

export interface SalaryAdjustment {
  id: string;
  amount: number;
  reason: string;
  date: string; // ISO
  cycleKey: string; // "2026-03" to tie to a specific cycle
}

export interface AppUser {
  id: string;
  username: string;
  phone: string;
  displayName: string;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
  createdAt: string;
  color?: string;           // For doctor users - display color
  specialization?: string;  // For doctor users - medical specialty
  salaryType?: 'none' | 'fixed' | 'percentage' | 'both';
  fixedSalary?: number;
  percentage?: number; // 0-100
  salaryStartDate?: number; // 1-28
  bonuses?: SalaryAdjustment[];
  deductions?: SalaryAdjustment[];
  salaryNotes?: string;
}

export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    view_patients: true,
    edit_patients: true,
    delete_patients: true,
    view_appointments: true,
    edit_appointments: true,
    view_treatment_plans: true,
    edit_treatment_plans: true,
    view_prices: true,
    view_ortho_prices: true,
    view_implant_prices: true,
    view_payments: true,
    edit_payments: true,
    view_indicators: true,
    view_settings: true,
    manage_users: true,
    view_tasks: true,
    manage_tasks: true,
    purchase_supplies: true,
  },
  doctor: {
    view_patients: true,
    edit_patients: true,
    delete_patients: true,
    view_appointments: true,
    edit_appointments: true,
    view_treatment_plans: true,
    edit_treatment_plans: true,
    view_prices: true,
    view_ortho_prices: true,
    view_implant_prices: true,
    view_payments: true,
    edit_payments: true,
    view_indicators: false,
    view_settings: false,
    manage_users: false,
    view_tasks: true,
    manage_tasks: true,
    purchase_supplies: true,
  },
  secretary: {
    view_patients: true,
    edit_patients: true,
    delete_patients: false,
    view_appointments: true,
    edit_appointments: true,
    view_treatment_plans: true,
    edit_treatment_plans: false,
    view_prices: false,
    view_ortho_prices: false,
    view_implant_prices: false,
    view_payments: false,
    edit_payments: false,
    view_indicators: false,
    view_settings: false,
    manage_users: false,
    view_tasks: true,
    manage_tasks: false,
    purchase_supplies: false,
  },
  accountant: {
    view_patients: true,
    edit_patients: false,
    delete_patients: false,
    view_appointments: true,
    edit_appointments: false,
    view_treatment_plans: true,
    edit_treatment_plans: false,
    view_prices: true,
    view_ortho_prices: true,
    view_implant_prices: true,
    view_payments: true,
    edit_payments: true,
    view_indicators: true,
    view_settings: false,
    manage_users: false,
    view_tasks: true,
    manage_tasks: false,
    purchase_supplies: false,
  },
};
