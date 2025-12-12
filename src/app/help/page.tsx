'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/shared';
import Link from 'next/link';
import {
    HelpCircle,
    BookOpen,
    MessageCircle,
    Mail,
    Phone,
    ArrowRight,
    ArrowLeft,
} from 'lucide-react';

export default function HelpPage() {
    const { language } = useLanguage();
    const isRTL = language === 'ar';

    const t = {
        title: isRTL ? 'مركز المساعدة' : 'Help Center',
        subtitle: isRTL ? 'كيف يمكننا مساعدتك؟' : 'How can we help you?',
        faqTitle: isRTL ? 'الأسئلة الشائعة' : 'FAQ',
        contactTitle: isRTL ? 'تواصل معنا' : 'Contact Us',
        guidesTitle: isRTL ? 'أدلة الاستخدام' : 'User Guides',
        backHome: isRTL ? 'العودة للرئيسية' : 'Back to Home',
        email: 'support@dentalhire.com',
        phone: '+964 XXX XXX XXXX',
    };

    const faqs = [
        {
            q: isRTL ? 'كيف أنشئ حساب جديد؟' : 'How do I create an account?',
            a: isRTL ? 'اضغط على "إنشاء حساب" واختر نوع الحساب ثم أكمل البيانات المطلوبة.' : 'Click "Create Account", choose your account type, and fill in the required information.',
        },
        {
            q: isRTL ? 'كيف أنشر وظيفة جديدة؟' : 'How do I post a new job?',
            a: isRTL ? 'من لوحة التحكم، اضغط على "نشر وظيفة" واملأ تفاصيل الوظيفة.' : 'From your dashboard, click "Post a Job" and fill in the job details.',
        },
        {
            q: isRTL ? 'كيف أبني سيرتي الذاتية؟' : 'How do I build my CV?',
            a: isRTL ? 'اذهب إلى "منشئ السيرة الذاتية" واتبع الخطوات لإكمال ملفك.' : 'Go to "CV Builder" and follow the steps to complete your profile.',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-teal-600 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <HelpCircle className="w-16 h-16 text-white mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
                    <p className="text-blue-100 text-lg">{t.subtitle}</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
                {/* FAQ Section */}
                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <BookOpen className="text-blue-500" />
                        {t.faqTitle}
                    </h2>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                                <p className="text-gray-600 dark:text-gray-300">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Contact Section */}
                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <MessageCircle className="text-blue-500" />
                        {t.contactTitle}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <a href={`mailto:${t.email}`} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <Mail className="text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{isRTL ? 'البريد الإلكتروني' : 'Email'}</p>
                                <p className="text-sm text-gray-500">{t.email}</p>
                            </div>
                        </a>
                        <a href={`tel:${t.phone.replace(/\s/g, '')}`} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <Phone className="text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{isRTL ? 'الهاتف' : 'Phone'}</p>
                                <p className="text-sm text-gray-500">{t.phone}</p>
                            </div>
                        </a>
                    </div>
                </section>

                {/* Back Button */}
                <div className="text-center pt-8">
                    <Link href="/">
                        <Button variant="outline">
                            {isRTL ? <ArrowRight size={18} className="ml-2" /> : <ArrowLeft size={18} className="mr-2" />}
                            {t.backHome}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
