/**
 * نظام التحقق من المدخلات المركزي
 * Centralized Input Validation System using Zod
 * 
 * يستخدم لضمان صحة البيانات قبل الحفظ في قاعدة البيانات
 */

import { z } from 'zod';

// ===================== FORM VALIDATION SCHEMAS =====================
// These are used for form validation in the UI

/**
 * Patient form validation schema
 */
export const patientSchema = z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100, 'الاسم طويل جداً'),
    age: z.coerce.number().min(0, 'العمر يجب أن يكون صحيحاً').max(120, 'العمر غير منطقي'),
    mobile: z.string().regex(/^[\d\s\-+()]*$/, 'رقم الهاتف غير صحيح').optional().or(z.literal('')),
    notes: z.string().max(1000, 'الملاحظات طويلة جداً').optional(),
    diagnosis: z.string().max(500, 'التشخيص طويل جداً').optional()
});

/**
 * Appointment form validation schema
 */
export const appointmentSchema = z.object({
    patientId: z.string(), // Allow empty for walk-in appointments
    patientName: z.string(),
    doctorId: z.string().min(1, 'يجب اختيار طبيب'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ غير صحيح'),
    time: z.string().min(1, 'يجب اختيار وقت'),
    type: z.string().min(1, 'يجب اختيار نوع العلاج'),
    notes: z.string().max(500, 'الملاحظات طويلة جداً').optional(),
    status: z.enum(['confirmed', 'arrived', 'completed', 'cancelled', 'pending']).default('confirmed'),
    price: z.number().min(0).optional()
});

/**
 * Expense form validation schema
 */
export const expenseSchema = z.object({
    amount: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
    description: z.string().min(3, 'الوصف قصير جداً').max(200, 'الوصف طويل جداً'),
    category: z.string().min(1, 'يجب اختيار فئة'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ غير صحيح'),
    createdBy: z.string().optional()
});

// ===================== DATA MODEL SCHEMAS =====================
// These are used for complete data validation before saving

/**
 * Schema for payment records
 */
export const PaymentRecordSchema = z.object({
    id: z.string().min(1, 'معرف الدفعة مطلوب'),
    amount: z.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'صيغة التاريخ غير صحيحة (YYYY-MM-DD)'),
    timestamp: z.number().positive()
});

/**
 * Schema for procedures
 */
export const ProcedureSchema = z.object({
    id: z.string().min(1, 'معرف الإجراء مطلوب'),
    tooth: z.string().optional(),
    type: z.string().min(1, 'نوع الإجراء مطلوب'),
    price: z.number().min(0, 'السعر يجب أن يكون صفر أو أكثر'),
    status: z.enum(['planned', 'completed']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'صيغة التاريخ غير صحيحة'),
    doctorId: z.string().optional(),
    payments: z.array(PaymentRecordSchema).optional(),
    notes: z.string().optional(),
    xrayImages: z.array(z.string()).optional()
});

/**
 * Schema for orthodontic visits
 */
export const OrthoVisitSchema = z.object({
    id: z.string().min(1, 'معرف الزيارة مطلوب'),
    monthNumber: z.string().min(1, 'رقم الشهر مطلوب'),
    procedure: z.string().min(1, 'تفاصيل الإجراء مطلوبة'),
    notes: z.string(),
    paymentReceived: z.number().min(0, 'المبلغ يجب أن يكون صفر أو أكثر'),
    visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'صيغة التاريخ غير صحيحة')
});

/**
 * Complete patient data schema
 */
export const PatientDataSchema = z.object({
    id: z.string().min(1, 'معرف المريض مطلوب'),
    name: z.string()
        .min(2, 'اسم المريض يجب أن يكون أكثر من حرفين')
        .max(100, 'اسم المريض طويل جداً'),
    age: z.number()
        .int('العمر يجب أن يكون رقماً صحيحاً')
        .min(0, 'العمر يجب أن يكون صفر أو أكثر')
        .max(150, 'العمر غير صحيح'),
    mobile: z.string()
        .regex(/^[0-9+\-\s()]*$/, 'رقم الهاتف يحتوي على أحرف غير صالحة')
        .optional()
        .or(z.literal('')),
    gender: z.string().optional(),
    notes: z.string().max(5000, 'الملاحظات طويلة جداً').optional(),
    consultationFeePaid: z.boolean(),
    consultationFeeCount: z.number().int().min(0).default(0),
    createdAt: z.union([z.string(), z.number()]),
    updatedAt: z.union([z.string(), z.number()]).optional(),
    diagnosis: z.string().max(5000, 'التشخيص طويل جداً').optional(),
    procedures: z.array(ProcedureSchema).default([]),
    scans: z.array(z.any()).default([]),
    payments: z.array(PaymentRecordSchema).optional(),
    orthoDiagnosis: z.string().optional(),
    orthoTotalCost: z.number().min(0).optional(),
    orthoDoctorId: z.string().optional(),
    orthoPaidAmount: z.number().min(0).optional(),
    orthoVisits: z.array(OrthoVisitSchema).optional(),
    totalCost: z.number().min(0, 'المبلغ الإجمالي يجب أن يكون صفر أو أكثر'),
    paidAmount: z.number().min(0, 'المبلغ المدفوع يجب أن يكون صفر أو أكثر'),
    isDebtOnly: z.boolean().optional()
});

/**
 * Schema for inventory items
 */
export const InventoryItemSchema = z.object({
    id: z.string().min(1, 'معرف العنصر مطلوب'),
    name: z.string()
        .min(1, 'اسم العنصر مطلوب')
        .max(200, 'اسم العنصر طويل جداً'),
    category: z.enum(['Restorative', 'Endodontic', 'General instrument', 'Surgery', 'Orthodontic']),
    quantity: z.number()
        .int('الكمية يجب أن تكون رقماً صحيحاً')
        .min(0, 'الكمية يجب أن تكون صفر أو أكثر'),
    unit: z.string().optional(),
    minStock: z.number().int().min(0).optional(),
    expiryDate: z.string().optional(),
    price: z.number().min(0).optional(),
    supplier: z.string().max(200).optional(),
    lastRestocked: z.string().optional(),
    imageUrl: z.string().url('رابط الصورة غير صحيح').optional().or(z.literal('')),
    imageThumbnail: z.string().optional(),
    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
    notes: z.string().max(1000).optional(),
    type: z.any().optional() // Legacy support
});

// ===================== VALIDATION FUNCTIONS =====================

export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; errors: string[] };

/**
 * Validates complete patient data
 */
export function validatePatientData(data: unknown): ValidationResult<z.infer<typeof PatientDataSchema>> {
    const result = PatientDataSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        errors: result.error.issues.map(e => e.message)
    };
}

/**
 * Validates payment data
 */
export function validatePayment(data: unknown): ValidationResult<z.infer<typeof PaymentRecordSchema>> {
    const result = PaymentRecordSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        errors: result.error.issues.map(e => e.message)
    };
}

/**
 * Validates procedure data
 */
export function validateProcedure(data: unknown): ValidationResult<z.infer<typeof ProcedureSchema>> {
    const result = ProcedureSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        errors: result.error.issues.map(e => e.message)
    };
}

/**
 * Validates inventory item data
 */
export function validateInventoryItem(data: unknown): ValidationResult<z.infer<typeof InventoryItemSchema>> {
    const result = InventoryItemSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        errors: result.error.issues.map(e => e.message)
    };
}

// ===================== SANITIZATION =====================

/**
 * Sanitizes string input to prevent XSS
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}

/**
 * Sanitizes patient name (allows Arabic, English, spaces)
 */
export function sanitizePatientName(name: string): string {
    return name.replace(/[^\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s]/g, '').trim();
}

/**
 * Sanitizes phone number
 */
export function sanitizePhone(phone: string): string {
    return phone.replace(/[^0-9+\-\s()]/g, '').trim();
}

// ===================== TYPE EXPORTS =====================
export type PatientFormData = z.infer<typeof patientSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type PatientData = z.infer<typeof PatientDataSchema>;
export type ProcedureData = z.infer<typeof ProcedureSchema>;
export type PaymentData = z.infer<typeof PaymentRecordSchema>;
