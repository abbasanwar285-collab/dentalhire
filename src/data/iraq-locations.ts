export const iraqGovernorates = [
    { en: 'Baghdad', ar: 'بغداد' },
    { en: 'Basra', ar: 'البصرة' },
    { en: 'Nineveh', ar: 'نينوى' },
    { en: 'Erbil', ar: 'أربيل' },
    { en: 'Sulaymaniyah', ar: 'السليمانية' },
    { en: 'Duhok', ar: 'دهوك' },
    { en: 'Kirkuk', ar: 'كركوك' },
    { en: 'Anbar', ar: 'الأنبار' },
    { en: 'Diyala', ar: 'ديالى' },
    { en: 'Babil', ar: 'بابل' },
    { en: 'Karbala', ar: 'كربلاء' },
    { en: 'Najaf', ar: 'النجف' },
    { en: 'Saladin', ar: 'صلاح الدين' },
    { en: 'Wasit', ar: 'واسط' },
    { en: 'Maysan', ar: 'ميسان' },
    { en: 'Al-Qadisiyah', ar: 'الديوانية' },
    { en: 'Muthanna', ar: 'المثنى' },
    { en: 'Thi Qar', ar: 'ذي قار' },
    { en: 'Halabja', ar: 'حلبجة' }
];

export const getGovernorate = (lang: 'en' | 'ar', governorate: { en: string; ar: string }) => {
    return lang === 'ar' ? governorate.ar : governorate.en;
};
