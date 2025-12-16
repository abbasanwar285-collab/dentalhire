// ============================================
// DentalHire - Data Definitions
// ============================================

import { CV, Clinic, Review } from '@/types';

// Role-based skills mapping
export const SKILLS_BY_ROLE: Record<string, string[]> = {
    dentist: [
        'General Dentistry', 'Root Canal Treatment', 'Crowns & Bridges', 'Tooth Extraction',
        'Diagnosis & Treatment Planning', 'Cosmetic Dentistry', 'Endodontics', 'Periodontics',
        'Pediatric Dentistry', 'Orthodontics', 'Implant Restoration', 'Dental Surgery',
        'Veneers', 'Pain Management', 'Patient Education'
    ],
    dental_assistant: [
        'Chairside Assisting', 'Sterilization', 'Dental X-rays', 'Infection Control',
        'Dental Charting', 'Impressions', 'Four-handed Dentistry', 'Patient Prep',
        'Instrument Handling', 'Temporary Crowns', 'Suture Removal', 'Post-op Instructions',
        'Dental Materials', 'Trauma Management'
    ],
    dental_technician: [
        'Ceramics', 'Crown & Bridge', 'Dentures', 'Orthodontic Appliances', 'CAD/CAM',
        'Waxing', 'Polishing', 'Esthetic Layering', 'Implant Works', 'Zirconia',
        'Metal Framework', 'Digital Smile Design', 'Color Matching', 'Quality Control'
    ],
    media: [
        'Content Creation', 'Social Media Management', 'Photography', 'Video Editing',
        'Public Speaking', 'Marketing Strategy', 'Brand Awareness', 'Copywriting',
        'Graphic Design', 'Storytelling', 'Community Management', 'Influencer Marketing',
        'SEO Basics', 'Analytics'
    ],
    sales_rep: [
        'B2B Sales', 'Medical Device Sales', 'Lead Generation', 'Territory Management',
        'Product Demonstration', 'Negotiation', 'CRM Management', 'Cold Calling',
        'Account Management', 'New Business Development', 'Sales Strategy', 'Market Analysis',
        'Customer Relationships', 'Closing Deals'
    ],
    secretary: [
        'Appointment Scheduling', 'Patient Reception', 'Insurance Processing', 'Phone Etiquette',
        'Dental Software (Dentrix/EagleSoft)', 'Billing & Coding', 'File Management',
        'Customer Service', 'Office Administration', 'Data Entry', 'Payment Collection',
        'Financial Reporting'
    ]
};

export const SKILLS_BY_ROLE_AR: Record<string, string[]> = {
    dentist: [
        'طب الأسنان العام', 'علاج العصب', 'التيجان والجسور', 'خلع الأسنان',
        'التشخيص وخطط العلاج', 'تجميل الأسنان', 'علاج الجذور', 'علاج اللثة',
        'طب أسنان الأطفال', 'تقويم الأسنان', 'تركيبات الزراعة', 'جراحة الأسنان',
        'الفينير', 'إدارة الألم', 'تثقيف المرضى'
    ],
    dental_assistant: [
        'المساعدة الجانبية', 'التعقيم', 'أشعة الأسنان', 'مكافحة العدوى',
        'تسجيل ملفات المرضى', 'طبعات الأسنان', 'العمل بأربع أيادي', 'تجهيز المرضى',
        'مناول الأدوات', 'التيجان المؤقتة', 'إزالة الغرز', 'تعليمات ما بعد العلاج',
        'مواد الأسنان', 'إدارة حالات الطوارئ'
    ],
    dental_technician: [
        'السيراميك والخزف', 'التيجان والجسور', 'أطقم الأسنان', 'أجهزة التقويم', 'التصميم الرقمي (CAD/CAM)',
        'التلبيس الشمعي', 'التلميع', 'الطبقات التجميلية', 'أعمال الزراعة', 'الزركونيا',
        'الهياكل المعدنية', 'تصميم الابتسامة الرقمي', 'مطابقة الألوان', 'مراقبة الجودة'
    ],
    media: [
        'صناعة المحتوى', 'إدارة التواصل الاجتماعي', 'التصوير الفوتوغرافي', 'مونتاج الفيديو',
        'التحدث أمام الجمهور', 'استراتيجيات التسويق', 'الوعي بالعلامة التجارية', 'كتابة المحتوى',
        'التصميم الجرافيكي', 'سرد القصص', 'إدارة المجتمعات', 'التسويق عبر المؤثرين',
        'تحسين محركات البحث', 'تحليل البيانات'
    ],
    sales_rep: [
        'مبيعات الشركات (B2B)', 'مبيعات الأجهزة الطبية', 'استقطاب العملاء', 'إدارة المناطق',
        'عرض المنتجات', 'التفاوض', 'إدارة علاقات العملاء (CRM)', 'الاتصال البارد',
        'إدارة الحسابات', 'تطوير أعمال جديدة', 'استراتيجيات البيع', 'تحليل السوق',
        'علاقات العملاء', 'إغلاق الصفقات'
    ],
    secretary: [
        'جدولة المواعيد', 'استقبال المرضى', 'معالجة التأمين', 'لباقة الهاتف',
        'برامج الإدارة (Dentrix/EagleSoft)', 'الفوترة والترميز', 'إدارة الملفات',
        'خدمة العملاء', 'إدارة المكتب', 'إدخال البيانات', 'تحصيل الدفعات',
        'التقارير المالية'
    ]
};

// Flattened arrays for backward compatibility if needed, but primary use is now by role
export const dentalSkills = [...SKILLS_BY_ROLE.dentist, ...SKILLS_BY_ROLE.dental_assistant];
export const dentalSkillsAr = [...SKILLS_BY_ROLE_AR.dentist, ...SKILLS_BY_ROLE_AR.dental_assistant];
export const salesSkills = SKILLS_BY_ROLE.sales_rep;
export const salesSkillsAr = SKILLS_BY_ROLE_AR.sales_rep;

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
