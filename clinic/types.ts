
export interface Procedure {
  id: string;
  tooth?: string; // Tooth number or area (e.g., "16", "Upper Right")
  type: string;
  price: number;
  status: 'planned' | 'completed';
  date: string;
  doctorId?: string; // New field to track the doctor performing this procedure
  payments?: PaymentRecord[]; // Payments specific to this procedure
  notes?: string; // Optional notes for the procedure
  xrayImages?: string[]; // X-ray images stored as base64 data URLs
}

export interface OrthoVisit {
  id: string;
  monthNumber: string;
  procedure: string; // Wire number / details
  notes: string;
  paymentReceived: number;
  visitDate: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  mobile?: string; // Reverted from phone for UI compatibility
  gender?: string;
  notes?: string;
  consultationFeePaid: boolean; // 5 IQD - Legacy field for backward compatibility
  consultationFeeCount: number; // Number of consultation fees paid (each 5 IQD)
  createdAt: string | number; // Allow mixed types (string/number) for robustness
  updatedAt?: string | number;

  // Medical Data
  diagnosis?: string;
  procedures: Procedure[];
  scans: PatientScan[]; // List of scan records
  payments?: PaymentRecord[]; // Legacy payments

  // Ortho Specific Data
  orthoDiagnosis?: string;
  orthoTotalCost?: number;
  orthoDoctorId?: string;
  orthoPaidAmount?: number;
  orthoVisits?: OrthoVisit[];

  totalCost: number;
  paidAmount: number;
  isDebtOnly?: boolean;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export type InventoryCategory = 'Restorative' | 'Endodontic' | 'General instrument' | 'Surgery' | 'Orthodontic';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit?: string;
  minStock?: number;
  expiryDate?: string;
  price?: number;
  supplier?: string;
  lastRestocked?: string;
  imageUrl?: string;
  imageThumbnail?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  notes?: string;
  consumptionRate?: number; // Units consumed per day (for AI depletion predictions)
  type?: string; // Fallback for legacy data using 'type' instead of 'category'
}

export type UserRole = 'admin' | 'doctor' | 'assistant';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at?: string;
}

export interface AllowedUser {
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'assistant';
  created_at: string;
}

export interface Expense {
  id: string;
  amount: number;
  category?: string;
  description: string;
  date: string; // YYYY-MM-DD
  createdBy?: string;
  createdAt?: string;
  timestamp?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (e.g. "03:00 م")
  type: string; // Standardized to string to match TREATMENT_TYPES
  notes: string;
  status: 'confirmed' | 'arrived' | 'completed' | 'cancelled' | 'pending';
  price?: number;
  createdAt?: string;
}

export enum TreatmentType {
  ROOT_CANAL = "حشوة جذر",
  COMPOSITE = "حشوة ضوئية",
  IMPLANT = "زراعة",
  ORTHO = "تقويم",
  WHITENING = "تبييض",
  CLEANING = "تنظيف",
  EXTRACTION = "قلع",
  CROWN = "كراون",
  ROOT_AND_CROWN = "حشوة جذر + كراون",
  GUM_IMPLANT = "زراعة لثة",
  OTHER = "غيرها"
}

export const TREATMENT_TYPES = Object.values(TreatmentType);

export const INVENTORY_CATEGORIES: { id: InventoryCategory; label: string; color: string }[] = [
  { id: 'Restorative', label: 'Restorative', color: 'text-blue-400' },
  { id: 'Endodontic', label: 'Endodontic', color: 'text-green-400' },
  { id: 'General instrument', label: 'General Instrument', color: 'text-yellow-400' },
  { id: 'Surgery', label: 'Surgery', color: 'text-red-400' },
  { id: 'Orthodontic', label: 'Orthodontic', color: 'text-pink-400' }
];

export const TIME_SLOTS = [
  "03:00 م", "03:30 م", "04:00 م", "04:30 م", "05:00 م", "05:30 م",
  "06:00 م", "06:30 م", "07:00 م", "07:30 م", "08:00 م", "08:30 م", "09:00 م"
];

// Audit Log Types
export type AuditAction =
  | 'add_patient'
  | 'edit_patient'
  | 'delete_patient'
  | 'add_procedure'
  | 'edit_procedure'
  | 'complete_procedure'
  | 'delete_procedure'
  | 'add_payment'
  | 'add_appointment'
  | 'edit_appointment'
  | 'cancel_appointment'
  | 'delete_appointment'
  | 'add_ortho_visit'
  | 'edit_ortho_visit';

export interface AuditLog {
  id: string;
  doctorId: string;
  action: AuditAction;
  entityType: 'patient' | 'appointment' | 'procedure' | 'payment' | 'ortho_visit';
  entityId: string;
  patientId?: string;
  patientName?: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  timestamp: number;
  createdAt: string;
}

// Doctor Definitions
export const DOCTORS = [
  {
    id: 'dr_abbas',
    name: 'د. عباس أنور',
    color: 'bg-blue-50',
    border: 'border-blue-500/20',
    text: 'text-blue-800',
    textColor: 'text-blue-600',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700'
  },
  {
    id: 'dr_ali',
    name: 'د. علي رياض',
    color: 'bg-emerald-50',
    border: 'border-emerald-500/20',
    text: 'text-emerald-800',
    textColor: 'text-emerald-600',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700'
  },
  {
    id: 'dr_qasim',
    name: 'د. قاسم حمودي',
    color: 'bg-orange-50',
    border: 'border-orange-500/20',
    text: 'text-orange-800',
    textColor: 'text-orange-600',
    iconColor: 'text-orange-600',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700'
  }
];

export interface OrderCandidate {
  id: string;
  name: string;
  currentQuantity: number;
  suggestedAmount: number;
  reason: string;
}

export interface PatientScan {
  id: string;
  patientId: string;
  type: string;
  fileUrl: string; // Changed from url to fileUrl to match usage
  thumbnailUrl?: string;
  fileName: string;
  notes?: string;
  scanDate?: string; // Add scanDate
  createdAt: string | number;
}

export interface SystemReport {
  id: string;
  type: 'staff_performance' | 'clinic_health' | 'inventory_alert';
  title: string;
  content: string;
  impact: 'positive' | 'negative' | 'neutral';
  userId?: string;
  timestamp: number;
  isRead: boolean;
}