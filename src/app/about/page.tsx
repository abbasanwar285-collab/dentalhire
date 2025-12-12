'use client';

import { CheckCircle, Users, Target, Award } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutPage() {
    const { t, language } = useLanguage();

    const whyUsItems = [
        t('about.whyus.1'),
        t('about.whyus.2'),
        t('about.whyus.3'),
        t('about.whyus.4'),
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="container-custom max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        {t('about.title')} <span className="text-blue-600">DentalHire</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                        {t('about.subtitle')}
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20 px-4">
                <div className="container-custom max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('about.mission')}</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {t('about.mission.p1')}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300">
                                {t('about.mission.p2')}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl p-8 text-white">
                            <h3 className="text-2xl font-bold mb-4">{t('about.whyus')}</h3>
                            <ul className="space-y-3">
                                {whyUsItems.map((item, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle className="flex-shrink-0 mt-1" size={20} />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-20 px-4 bg-white dark:bg-gray-800">
                <div className="container-custom max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">{t('about.values')}</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="text-blue-600" size={32} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('about.community')}</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                {t('about.community.desc')}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target className="text-blue-600" size={32} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('about.excellence')}</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                {t('about.excellence.desc')}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Award className="text-blue-600" size={32} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('about.trust')}</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                {t('about.trust.desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="container-custom max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                        {t('about.cta')}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                        {t('about.cta.desc')}
                    </p>
                    <Link href="/register" className="btn btn-primary inline-block">
                        {t('about.cta.btn')}
                    </Link>
                </div>
            </section>
        </div>
    );
}

