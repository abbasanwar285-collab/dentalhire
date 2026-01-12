// ============================================
// DentalHire - Validation Schemas (Zod)
// رسائل التحقق ثنائية اللغة
// ============================================

import { z } from 'zod';

// رسائل الخطأ بالعربية والإنجليزية
const messages = {
    ar: {
        nameMin: 'يجب أن يكون الاسم حرفين على الأقل',
        emailInvalid: 'يرجى إدخال بريد إلكتروني صحيح',
        phoneInvalid: 'يرجى إدخال رقم جوال صحيح',
        cityRequired: 'المدينة مطلوبة',
        bioMax: 'النبذة يجب أن تكون أقل من 500 حرف',
        jobTitleRequired: 'المسمى الوظيفي مطلوب',
        companyRequired: 'اسم الشركة مطلوب',
        locationRequired: 'الموقع مطلوب',
        startDateRequired: 'تاريخ البدء مطلوب',
        certNameRequired: 'اسم الشهادة مطلوب',
        issuerRequired: 'الجهة المانحة مطلوبة',
        dateRequired: 'التاريخ مطلوب',
        languageRequired: 'اللغة مطلوبة',
        salaryRequired: 'الراتب المتوقع مطلوب',
        currencyRequired: 'العملة مطلوبة',
        locationPrefRequired: 'يجب اختيار موقع مفضل واحد على الأقل',
        passwordMin: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        firstNameRequired: 'الاسم الأول مطلوب',
        lastNameRequired: 'اسم العائلة مطلوب',
        agreeTerms: 'يجب الموافقة على الشروط',
        passwordMatch: 'كلمتا المرور غير متطابقتين',
        clinicNameRequired: 'اسم العيادة مطلوب',
        addressRequired: 'العنوان مطلوب',
    },
    en: {
        nameMin: 'Name must be at least 2 characters',
        emailInvalid: 'Please enter a valid email',
        phoneInvalid: 'Please enter a valid phone number',
        cityRequired: 'City is required',
        bioMax: 'Bio must be less than 500 characters',
        jobTitleRequired: 'Job title is required',
        companyRequired: 'Company name is required',
        locationRequired: 'Location is required',
        startDateRequired: 'Start date is required',
        certNameRequired: 'Certification name is required',
        issuerRequired: 'Issuer is required',
        dateRequired: 'Date is required',
        languageRequired: 'Language is required',
        salaryRequired: 'Expected salary is required',
        currencyRequired: 'Currency is required',
        locationPrefRequired: 'At least one preferred location is required',
        passwordMin: 'Password must be at least 6 characters',
        firstNameRequired: 'First name is required',
        lastNameRequired: 'Last name is required',
        agreeTerms: 'You must agree to the terms',
        passwordMatch: 'Passwords do not match',
        clinicNameRequired: 'Clinic name is required',
        addressRequired: 'Address is required',
    }
};

// دالة للحصول على الرسالة حسب اللغة الحالية
const getMsg = (arMsg: string, enMsg: string) => {
    // نستخدم الرسالة العربية كافتراضية لأن التطبيق موجه للمستخدم العربي
    return arMsg;
};

// Personal Info Schema
export const personalInfoSchema = z.object({
    fullName: z.string().min(2, messages.ar.nameMin),
    email: z.string().email(messages.ar.emailInvalid),
    phone: z.string().min(10, messages.ar.phoneInvalid),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    nationality: z.string().optional(),
    address: z.string().optional(),
    city: z.string().min(2, messages.ar.cityRequired),
    bio: z.string().max(500, messages.ar.bioMax).optional(),
});

// Experience Schema
export const experienceSchema = z.object({
    id: z.string(),
    title: z.string().min(2, messages.ar.jobTitleRequired),
    company: z.string().min(2, messages.ar.companyRequired),
    location: z.string().min(2, messages.ar.locationRequired),
    startDate: z.string().min(1, messages.ar.startDateRequired),
    endDate: z.string().optional(),
    current: z.boolean(),
    description: z.string().max(1000).optional(),
});

// Certification Schema
export const certificationSchema = z.object({
    id: z.string(),
    name: z.string().min(2, messages.ar.certNameRequired),
    issuer: z.string().min(2, messages.ar.issuerRequired),
    date: z.string().min(1, messages.ar.dateRequired),
    expiryDate: z.string().optional(),
    credentialId: z.string().optional(),
});

// Language Schema
export const languageSchema = z.object({
    language: z.string().min(2, messages.ar.languageRequired),
    proficiency: z.enum(['basic', 'intermediate', 'fluent', 'native']),
});

// Salary Schema
export const salarySchema = z.object({
    expected: z.number().min(1, messages.ar.salaryRequired),
    currency: z.string().min(1, messages.ar.currencyRequired),
    negotiable: z.boolean(),
});

// Location Preference Schema
export const locationPreferenceSchema = z.object({
    preferred: z.array(z.string()).min(1, messages.ar.locationPrefRequired),
    willingToRelocate: z.boolean(),
    remoteWork: z.boolean(),
    coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
    }).optional(),
});

// Availability Schema
export const availabilitySchema = z.object({
    type: z.enum(['full_time', 'part_time', 'contract', 'temporary']),
    startDate: z.string().optional(),
    schedule: z.object({
        monday: z.object({ available: z.boolean(), hours: z.string().optional() }),
        tuesday: z.object({ available: z.boolean(), hours: z.string().optional() }),
        wednesday: z.object({ available: z.boolean(), hours: z.string().optional() }),
        thursday: z.object({ available: z.boolean(), hours: z.string().optional() }),
        friday: z.object({ available: z.boolean(), hours: z.string().optional() }),
        saturday: z.object({ available: z.boolean(), hours: z.string().optional() }),
        sunday: z.object({ available: z.boolean(), hours: z.string().optional() }),
    }),
});

// Auth Schemas
export const loginSchema = z.object({
    email: z.string().email(messages.ar.emailInvalid),
    password: z.string().min(6, messages.ar.passwordMin),
});

export const registerSchema = z.object({
    email: z.string().email(messages.ar.emailInvalid),
    password: z.string().min(6, messages.ar.passwordMin),
    confirmPassword: z.string(),
    firstName: z.string().min(2, messages.ar.firstNameRequired),
    lastName: z.string().min(2, messages.ar.lastNameRequired),
    role: z.enum(['job_seeker', 'clinic']),
    userType: z.enum(['dental_assistant', 'sales_rep', 'dentist', 'clinic', 'secretary', 'media', 'company', 'lab', 'dental_technician']),
    phone: z.string().min(10, messages.ar.phoneInvalid),
    agreeToTerms: z.boolean().refine(val => val === true, messages.ar.agreeTerms),
}).refine(data => data.password === data.confirmPassword, {
    message: messages.ar.passwordMatch,
    path: ['confirmPassword'],
});

// Clinic Profile Schema
export const clinicProfileSchema = z.object({
    name: z.string().min(2, messages.ar.clinicNameRequired),
    description: z.string().max(1000).optional(),
    address: z.string().min(5, messages.ar.addressRequired),
    city: z.string().min(2, messages.ar.cityRequired),
    email: z.string().email(messages.ar.emailInvalid),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
});

// Search Filters Schema
export const searchFiltersSchema = z.object({
    query: z.string().optional(),
    location: z.string().optional(),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional(),
    experienceMin: z.number().optional(),
    experienceMax: z.number().optional(),
    skills: z.array(z.string()).optional(),
    employmentType: z.array(z.enum(['full_time', 'part_time', 'contract', 'temporary'])).optional(),
    languages: z.array(z.string()).optional(),
    verified: z.boolean().optional(),
});

// Types inferred from schemas
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
export type LanguageInput = z.infer<typeof languageSchema>;
export type SalaryInput = z.infer<typeof salarySchema>;
export type LocationPreferenceInput = z.infer<typeof locationPreferenceSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ClinicProfileInput = z.infer<typeof clinicProfileSchema>;
export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>;
