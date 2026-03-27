/**
 * أنواع البيانات الخاصة بـ Supabase
 * Supabase Database Types
 * 
 * هذه الأنواع تمثل البيانات كما هي مخزنة في قاعدة البيانات
 */

// ===================== DATABASE ROW TYPES =====================

/**
 * Patient row as stored in Supabase
 */
export interface SupabasePatient {
    id: string;
    name: string;
    mobile?: string;
    phone?: string; // Legacy field alias
    age: number;
    gender?: string;
    total_cost: number;
    paid_amount: number;
    diagnosis?: string;
    procedures?: SupabaseProcedure[];
    scans?: unknown[];
    notes?: string;
    is_debt_only?: boolean;
    ortho_doctor_id?: string;
    ortho_total_cost?: number;
    ortho_paid_amount?: number;
    ortho_diagnosis?: string;
    ortho_visits?: SupabaseOrthoVisit[];
    consultation_fee_paid?: boolean;
    consultation_fee_count?: number;
    payments?: SupabasePayment[];
    created_at: string;
    updated_at?: string;
}

/**
 * Procedure as stored in Supabase (embedded in patient)
 */
export interface SupabaseProcedure {
    id: string;
    tooth?: string;
    type: string;
    price: number;
    status: 'planned' | 'completed';
    date: string;
    doctorId?: string;
    payments?: SupabasePayment[];
    notes?: string;
    xrayImages?: string[];
}

/**
 * Payment as stored in Supabase
 */
export interface SupabasePayment {
    id: string;
    amount: number;
    date: string;
    timestamp: number;
}

/**
 * Ortho visit as stored in Supabase
 */
export interface SupabaseOrthoVisit {
    id: string;
    monthNumber: string;
    procedure: string;
    notes: string;
    paymentReceived: number;
    visitDate: string;
}

/**
 * Appointment row as stored in Supabase
 */
export interface SupabaseAppointment {
    id: string;
    patient_id: string;
    patient_name: string;
    doctor_id: string;
    date: string;
    time: string;
    treatment_type?: string;
    type?: string;
    notes?: string;
    status: 'confirmed' | 'arrived' | 'completed' | 'cancelled' | 'pending';
    price?: number;
    created_at?: string;
}

/**
 * Expense row as stored in Supabase
 */
export interface SupabaseExpense {
    id: string;
    amount: number;
    category?: string;
    description: string;
    date: string;
    created_by?: string;
    created_at?: string;
}

/**
 * Inventory item row as stored in Supabase
 */
export interface SupabaseInventoryItem {
    id: string;
    name: string;
    type?: string; // Maps to 'category' in app
    category?: string;
    quantity: number;
    unit?: string;
    min_stock?: number;
    expiry_date?: string;
    price?: number;
    supplier?: string;
    last_restocked?: string;
    image_url?: string;
    image?: string; // Legacy field alias
    image_thumbnail?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Allowed user row as stored in Supabase
 */
export interface SupabaseAllowedUser {
    email: string;
    name: string;
    role: 'admin' | 'doctor' | 'assistant';
    created_at: string;
}

/**
 * Patient scan row as stored in Supabase
 */
export interface SupabasePatientScan {
    id: string;
    patient_id: string;
    type: string;
    file_url?: string;
    url?: string; // Legacy field alias
    thumbnail_url?: string;
    file_name: string;
    notes?: string;
    scan_date?: string;
    created_at: string;
}

/**
 * Profile row as stored in Supabase
 */
export interface SupabaseProfile {
    id: string;
    email: string;
    full_name?: string;
    role: 'admin' | 'doctor' | 'assistant';
    created_at?: string;
}

// ===================== DATABASE RESPONSE TYPES =====================

/**
 * Generic Supabase response wrapper
 */
export interface SupabaseResponse<T> {
    data: T | null;
    error: SupabaseError | null;
}

/**
 * Supabase error structure
 */
export interface SupabaseError {
    message: string;
    code?: string;
    details?: string;
    hint?: string;
    status?: number;
}

// ===================== INSERT/UPDATE TYPES =====================

/**
 * Patient data for insert/update operations
 */
export interface PatientInsert {
    id: string;
    name: string;
    mobile?: string;
    age: number;
    gender?: string;
    total_cost: number;
    paid_amount: number;
    diagnosis?: string;
    procedures?: SupabaseProcedure[];
    notes?: string;
    ortho_doctor_id?: string;
    ortho_total_cost?: number;
    ortho_paid_amount?: number;
    ortho_diagnosis?: string;
    ortho_visits?: SupabaseOrthoVisit[];
    consultation_fee_paid?: boolean;
    consultation_fee_count?: number;
    payments?: SupabasePayment[];
}

/**
 * Appointment data for insert/update operations
 */
export interface AppointmentInsert {
    id: string;
    patient_id: string;
    patient_name: string;
    doctor_id: string;
    date: string;
    time: string;
    type: string;
    notes?: string;
    status: string;
    price?: number;
}

/**
 * Expense data for insert/update operations
 */
export interface ExpenseInsert {
    id: string;
    amount: number;
    category?: string;
    description: string;
    date: string;
    created_by?: string;
}

/**
 * Inventory item data for insert/update operations
 */
export interface InventoryItemInsert {
    id: string;
    name: string;
    type: string; // Maps from 'category'
    quantity: number;
    unit?: string;
    min_stock?: number;
    expiry_date?: string;
    price?: number;
    supplier?: string;
    last_restocked?: string;
    image_url?: string;
    image_thumbnail?: string;
    notes?: string;
}
