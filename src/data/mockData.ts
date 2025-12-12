// ============================================
// DentalHire - Data Definitions
// ============================================

import { CV, Clinic, Review } from '@/types';

// Common dental skills (Seed Data - Useful for filtering/selection)
export const dentalSkills = [
    'Patient Care',
    'Dental X-rays',
    'Sterilization',
    'Infection Control',
    'Dental Charting',
    'Impressions',
    'Teeth Whitening',
    'Orthodontic Assistance',
    'Oral Surgery Assistance',
    'Emergency Care',
    'Patient Education',
    'Dental Software (Dentrix)',
    'Dental Software (Eaglesoft)',
    'Insurance Processing',
    'Appointment Scheduling',
    'Inventory Management',
    'CPR Certified',
    'Nitrous Oxide Administration',
    'Coronal Polishing',
    'Sealant Application',
    'Fluoride Treatment',
    'Temporary Restorations',
    'Suture Removal',
    'Composite Restorations',
    'Bilingual (English/Spanish)',
];

// Arabic dental skills (المهارات الأكثر تداولاً بين الباحثين عن العمل)
export const dentalSkillsAr = [
    'العناية بالمرضى',
    'أشعة الأسنان',
    'التعقيم',
    'مكافحة العدوى',
    'رسم خريطة الأسنان',
    'طبعات الأسنان',
    'تبييض الأسنان',
    'مساعدة تقويم الأسنان',
    'مساعدة جراحة الفم',
    'حالات الطوارئ',
    'تثقيف المرضى',
    'برامج طب الأسنان',
    'معالجة التأمين',
    'جدولة المواعيد',
    'إدارة المخزون',
    'الإنعاش القلبي الرئوي',
    'الحشوات التجميلية',
    'تركيبات الأسنان',
    'علاج اللثة',
    'قلع الأسنان',
    'علاج العصب',
    'زراعة الأسنان',
    'تنظيف الأسنان',
    'علاج الفلورايد',
];

// Sales rep skills (Seed Data)
export const salesSkills = [
    'B2B Sales',
    'Territory Management',
    'Product Knowledge',
    'Customer Relations',
    'Cold Calling',
    'Negotiation',
    'Presentation Skills',
    'CRM Software',
    'Market Analysis',
    'Lead Generation',
    'Account Management',
    'Contract Negotiation',
    'Trade Shows',
    'Product Demonstrations',
    'Dental Equipment Knowledge',
    'Dental Materials Knowledge',
    'Relationship Building',
    'Sales Reporting',
    'Target Achievement',
    'Medical Terminology',
];

// Empty Data Structures for Production
export const mockCVs: CV[] = [];
export const mockClinics: Clinic[] = [];

// Initial Analytics Data (Start from Zero)
export const mockAnalytics = {
    totalUsers: 0,
    totalJobSeekers: 0,
    totalClinics: 0,
    totalCVs: 0,
    activeJobSeekers: 0,
    matchesThisMonth: 0,
    newUsersThisWeek: 0,
    userGrowth: [],
    topSkills: [],
    topLocations: [],
};

// Helpers
export function getMockCVs(): CV[] {
    return [];
}

export function getMockClinics(): Clinic[] {
    return [];
}

export function getMockCVById(id: string): CV | undefined {
    return undefined;
}

export function getMockClinicById(id: string): Clinic | undefined {
    return undefined;
}

// Reviews
export const mockReviews: Review[] = [];

export function getMockReviewsForTarget(targetId: string): Review[] {
    return [];
}
