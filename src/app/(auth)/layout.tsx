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
        <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-gray-900" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Form Section */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 relative z-10 order-2 lg:order-1">
                <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
                    <div className="w-full max-w-xl animate-fade-in py-8">
                        {children}
                    </div>
                </div>
            </div>

            {/* Branding Section */}
            <div className="w-full lg:w-[400px] xl:w-[450px] bg-gradient-to-br from-blue-600 to-teal-600 relative overflow-hidden shrink-0 flex flex-col order-1 lg:order-2 h-[200px] lg:h-auto">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
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
                <div className="relative z-10 h-full flex flex-col justify-center items-center lg:items-start text-center lg:text-start p-6 lg:p-12 text-white">
                    <div className="flex items-center gap-3 mb-4 lg:mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-2xl shadow-xl border border-white/20">
                            DH
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black tracking-tight">
                            DentalHire
                        </h2>
                    </div>

                    <div className="max-w-md space-y-4 lg:space-y-6">
                        <h1 className="text-xl lg:text-3xl font-bold leading-tight drop-shadow-sm">
                            {language === 'ar'
                                ? 'تواصل مع أفضل محترفين الأسنان والعيادات'
                                : 'Connect with the best dental professionals and clinics'}
                        </h1>

                        <p className="text-sm lg:text-base text-blue-50/90 font-medium leading-relaxed hidden md:block">
                            {language === 'ar'
                                ? 'المنصة الأولى المتخصصة في توظيف محترفي طب الأسنان وتلبية احتياجات العيادات بمعايير عالمية'
                                : 'The premier platform specialized in dental professional recruitment and meeting clinic needs with global standards'}
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="mt-6 lg:mt-auto flex gap-6 lg:gap-10">
                        <div>
                            <p className="text-xl lg:text-2xl font-black">5k+</p>
                            <p className="text-blue-100/70 text-[10px] lg:text-xs font-bold uppercase tracking-wider">{t('home.stats.seekers')}</p>
                        </div>
                        <div>
                            <p className="text-xl lg:text-2xl font-black">1.2k+</p>
                            <p className="text-blue-100/70 text-[10px] lg:text-xs font-bold uppercase tracking-wider">{t('home.stats.clinics')}</p>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl" />
            </div>
        </div>
    );
}

