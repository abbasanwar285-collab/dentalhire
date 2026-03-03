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

// Role-based certifications mapping (Iraq Context)
export const CERTIFICATIONS_BY_ROLE: Record<string, { name: string, issuer: string }[]> = {
    dentist: [
        { name: 'Bachelor of Dental Surgery (B.D.S)', issuer: 'University of Baghdad / Mustansiriyah' },
        { name: 'Iraqi Dental Association Membership', issuer: 'Iraqi Dental Association' },
        { name: 'Specialized Board Certification', issuer: 'Iraqi Board for Medical Specializations' },
        { name: 'Masters in Conservative Dentistry', issuer: 'University of Baghdad' },
        { name: 'Diploma in Oral Implantology', issuer: 'Ministry of Higher Education' }
    ],
    dental_assistant: [
        { name: 'Diploma in Dental Assistance', issuer: 'Medical Technical Institute' },
        { name: 'Health Profession Practice License', issuer: 'Ministry of Health - Iraq' },
        { name: 'Infection Control Certificate', issuer: 'Ministry of Health' },
        { name: 'Basic Life Support (BLS)', issuer: 'Iraqi Red Crescent Society' }
    ],
    dental_technician: [
        { name: 'Diploma in Dental Technology', issuer: 'Institute of Medical Technology' },
        { name: 'Bachelor in Dental Technology', issuer: 'College of Health & Medical Technology' },
        { name: 'Certified Dental Technician', issuer: 'Ministry of Health' },
        { name: 'CAD/CAM Certification', issuer: 'Private Training Centers' }
    ],
    media: [
        { name: 'Digital Marketing Specialist', issuer: 'Google / Meta' },
        { name: 'Photography & Editing Course', issuer: 'Local Arts Institute' },
        { name: 'Social Media Management', issuer: 'Online Certification' }
    ],
    sales_rep: [
        { name: 'Medical Sales Representative', issuer: 'Training Academy' },
        { name: 'Bachelor of Pharmacy / Science', issuer: 'Iraqi University' },
        { name: 'Sales Skills Certification', issuer: 'Business Institute' }
    ],
    secretary: [
        { name: 'Administration & Management', issuer: 'Training Center' },
        { name: 'Language Proficiency (English/Arabic)', issuer: 'Language Institute' },
        { name: 'Computer Skills (ICDL)', issuer: 'ICDL Iraq' }
    ]
};

export const CERTIFICATIONS_BY_ROLE_AR: Record<string, { name: string, issuer: string }[]> = {
    dentist: [
        { name: 'بكالوريوس طب وجراحة الفم والأسنان', issuer: 'جامعة بغداد / المستنصرية' },
        { name: 'عضوية نقابة أطباء الأسنان', issuer: 'نقابة أطباء الأسنان العراقية' },
        { name: 'شهادة البورد العراقي', issuer: 'المجلس العراقي للاختصاصات الطبية' },
        { name: 'ماجستير علاج تحفظي', issuer: 'جامعة بغداد' },
        { name: 'دبلوم زراعة الأسنان', issuer: 'وزارة التعليم العالي' }
    ],
    dental_assistant: [
        { name: 'دبلوم وقاية أسنان / مساعد', issuer: 'المعهد الطبي التقني' },
        { name: 'إجازة ممارسة المهنة الصحية', issuer: 'وزارة الصحة العراقية' },
        { name: 'شهادة مكافحة العدوى', issuer: 'وزارة الصحة' },
        { name: 'الإسعافات الأولية (BLS)', issuer: 'جمعية الهلال الأحمر العراقي' }
    ],
    dental_technician: [
        { name: 'دبلوم صناعة أسنان', issuer: 'المعهد التقني الطبي' },
        { name: 'بكالوريوس تقنيات صناعة الأسنان', issuer: 'كلية التقنيات الصحية والطبية' },
        { name: 'هوية تقني أسنان مرخص', issuer: 'وزارة الصحة' },
        { name: 'شهادة أنظمة CAD/CAM', issuer: 'مراكز تدريب خاصة' }
    ],
    media: [
        { name: 'أخصائي تسويق رقمي', issuer: 'Google / Meta' },
        { name: 'دورة تصوير ومونتاج', issuer: 'معاهد فنية محلية' },
        { name: 'إدارة التواصل الاجتماعي', issuer: 'شهادات عبر الإنترنت' }
    ],
    sales_rep: [
        { name: 'مندوب مبيعات طبي', issuer: 'أكاديمية التدريب' },
        { name: 'بكالوريوس صيدلة / علوم', issuer: 'الجامعات العراقية' },
        { name: 'شهادة مهارات البيع', issuer: 'معهد إدارة الأعمال' }
    ],
    secretary: [
        { name: 'الإدارة والسكرتارية', issuer: 'مراكز التدريب المهني' },
        { name: 'كفاءة اللغة (إنجليزي/عربي)', issuer: 'معهد اللغات' },
        { name: 'مهارات الحاسوب (ICDL)', issuer: 'المركز الوطني' }
    ]
};

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

// Salary Ranges by Role (Iraq Context)
export const SALARY_RANGES_BY_ROLE: Record<string, { min: number; max: number; label: string; labelAr: string }[]> = {
    dentist: [
        { min: 500000, max: 1000000, label: 'Entry Level', labelAr: 'مستوى مبتدئ' },
        { min: 1000000, max: 2500000, label: 'Mid Level', labelAr: 'مستوى متوسط' },
        { min: 2500000, max: 5000000, label: 'Senior / Specialist', labelAr: 'خبير / أخصائي' }
    ],
    dental_assistant: [
        { min: 300000, max: 500000, label: 'Junior', labelAr: 'مبتدئ' },
        { min: 500000, max: 800000, label: 'Senior', labelAr: 'خبير' }
    ],
    dental_technician: [
        { min: 600000, max: 1200000, label: 'Technician', labelAr: 'فني' },
        { min: 1200000, max: 2500000, label: 'Lab Manager', labelAr: 'مدير مختبر' }
    ],
    media: [
        { min: 400000, max: 800000, label: 'Specialist', labelAr: 'أخصائي' },
        { min: 800000, max: 1500000, label: 'Manager', labelAr: 'مدير' }
    ],
    sales_rep: [
        { min: 500000, max: 1000000, label: 'Representative', labelAr: 'مندوب' },
        { min: 1000000, max: 2000000, label: 'Senior / Supervisor', labelAr: 'مشرف' }
    ],
    secretary: [
        { min: 350000, max: 550000, label: 'Receptionist', labelAr: 'موظف استقبال' },
        { min: 550000, max: 850000, label: 'Office Manager', labelAr: 'مدير مكتب' }
    ]
};
