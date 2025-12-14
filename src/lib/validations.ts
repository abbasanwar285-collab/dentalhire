// ============================================
// DentalHire - Validation Schemas (Zod)
// ============================================

import { z } from 'zod';

// Personal Info Schema
export const personalInfoSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    nationality: z.string().optional(),
    address: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

// Experience Schema
export const experienceSchema = z.object({
    id: z.string(),
    title: z.string().min(2, 'Job title is required'),
    company: z.string().min(2, 'Company name is required'),
    location: z.string().min(2, 'Location is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    current: z.boolean(),
    description: z.string().max(1000).optional(),
});

// Certification Schema
export const certificationSchema = z.object({
    id: z.string(),
    name: z.string().min(2, 'Certification name is required'),
    issuer: z.string().min(2, 'Issuer is required'),
    date: z.string().min(1, 'Date is required'),
    expiryDate: z.string().optional(),
    credentialId: z.string().optional(),
});

// Language Schema
export const languageSchema = z.object({
    language: z.string().min(2, 'Language is required'),
    proficiency: z.enum(['basic', 'intermediate', 'fluent', 'native']),
});

// Salary Schema
export const salarySchema = z.object({
    expected: z.number().min(1, 'Expected salary is required'),
    currency: z.string().min(1, 'Currency is required'),
    negotiable: z.boolean(),
});

// Location Preference Schema
export const locationPreferenceSchema = z.object({
    preferred: z.array(z.string()).min(1, 'At least one preferred location is required'),
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
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    role: z.enum(['job_seeker', 'clinic']),
    userType: z.enum(['dental_assistant', 'sales_rep', 'dentist', 'clinic', 'secretary', 'media', 'company', 'lab', 'dental_technician']),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

// Clinic Profile Schema
export const clinicProfileSchema = z.object({
    name: z.string().min(2, 'Clinic name is required'),
    description: z.string().max(1000).optional(),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    email: z.string().email('Please enter a valid email'),
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
