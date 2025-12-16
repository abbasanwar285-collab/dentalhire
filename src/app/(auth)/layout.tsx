'use client';

// ============================================
// DentalHire - Auth Layout
// ============================================

import { useLanguage } from '@/contexts/LanguageContext';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { t, language } = useLanguage();



    return (
        <div className="h-screen flex flex-col overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Top Side - Form */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 relative z-10">
                <div className="min-h-full flex items-center justify-center p-6">
                    <div className="w-full max-w-4xl">
                        {children}
                    </div>
                </div>
            </div>

            {/* Bottom Side - Branding */}
            <div className="w-full bg-gradient-to-br from-blue-600 to-teal-600 relative overflow-hidden shrink-0 h-48 lg:h-56">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-xl shadow-lg border border-white/10">
                            DH
                        </div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                            DentalHire
                        </h2>
                    </div>

                    <p className="text-xs text-blue-50 max-w-lg mb-4 font-medium opacity-90">
                        {language === 'ar'
                            ? 'المنصة الأولى المتخصصة في توظيف محترفي طب الأسنان وتلبية احتياجات العيادات بمعايير عالمية'
                            : 'The premier platform specialized in dental professional recruitment and meeting clinic needs with global standards'}
                    </p>

                    <h1 className="text-lg font-bold text-white leading-tight max-w-xl mb-3 hidden lg:block">
                        {language === 'ar'
                            ? 'تواصل مع أفضل محترفين الأسنان والعيادات'
                            : 'Connect with the best dental professionals and clinics'}
                    </h1>

                    {/* Stats - Compact Horizontal */}
                    <div className="flex gap-8 justify-center flex-wrap">
                        <div className="text-center">
                            <p className="text-lg font-bold text-white">5,000+</p>
                            <p className="text-blue-200 text-[10px]">{t('home.stats.seekers')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-white">1,200+</p>
                            <p className="text-blue-200 text-[10px]">{t('home.stats.clinics')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-white">95%</p>
                            <p className="text-blue-200 text-[10px]">{t('home.stats.match')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

