'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
    Briefcase,
    Building2,
    Stethoscope,
    Users,
    Megaphone,
    FileText,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OnboardingModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'initial' | 'role_selection'>('initial');
    const { language } = useLanguage();
    const router = useRouter();

    const searchParams = useSearchParams();

    useEffect(() => {
        // Check if user has already onboarded
        const hasOnboarded = localStorage.getItem('has_onboarded');
        const forceShow = searchParams.get('show_onboarding') === 'true';

        if (!hasOnboarded || forceShow) {
            // Small delay for better UX
            const timer = setTimeout(() => setIsOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    const handleClose = () => {
        // Prevent closing by clicking outside to force selection? 
        // Or allow closing and remind later? 
        // For now, allow closing but don't set 'has_onboarded' so it appears again?
        // Or maybe set it to avoid annoyance. Let's set it.
        localStorage.setItem('has_onboarded', 'true');
        setIsOpen(false);
    };

    const handleRoleSelect = (role: string, subRole?: string) => {
        localStorage.setItem('has_onboarded', 'true');
        localStorage.setItem('user_role', role);
        if (subRole) {
            localStorage.setItem('user_sub_role', subRole);
        }

        setIsOpen(false);

        // Redirect logic
        if (role === 'clinic') {
            router.push('/register?role=clinic');
        } else {
            // Redirect to register with specific role params
            // Map subRole to database UserType values
            const typeMap: Record<string, string> = {
                dentist: 'dentist',
                assistant: 'dental_assistant',
                sales: 'sales_rep',
                secretary: 'secretary',
                advertising: 'media',
            };
            const userType = typeMap[subRole || ''] || 'dental_assistant';
            router.push(`/register?role=job_seeker&userType=${userType}`);
        }
    };

    const jobRoles = [
        {
            id: 'dentist',
            titleAr: 'طبيب أسنان',
            titleEn: 'Dentist',
            icon: <Stethoscope className="w-6 h-6" />,
            color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
        },
        {
            id: 'assistant',
            titleAr: 'مساعد طبيب أسنان',
            titleEn: 'Dental Assistant',
            icon: <Users className="w-6 h-6" />,
            color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'
        },
        {
            id: 'sales',
            titleAr: 'مندوب مبيعات',
            titleEn: 'Sales Representative',
            icon: <Briefcase className="w-6 h-6" />,
            color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
        },
        {
            id: 'secretary',
            titleAr: 'سكرتير',
            titleEn: 'Secretary',
            icon: <FileText className="w-6 h-6" />,
            color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
        },
        {
            id: 'advertising',
            titleAr: 'وجهة اعلاني',
            titleEn: 'Public Figure / Brand Face',
            icon: <Megaphone className="w-6 h-6" />,
            color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
        }
    ];

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-8 text-start align-middle shadow-2xl transition-all border border-gray-100 dark:border-gray-700">
                                {step === 'initial' ? (
                                    <div className="space-y-8 animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                        <div className="text-center">
                                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                                {language === 'ar' ? 'مرحباً بك في دينتال هاير! 👋' : 'Welcome to DentalHire! 👋'}
                                            </h2>
                                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                                {language === 'ar' ? 'لنبدأ بتخصيص تجربتك' : "Let's personalize your experience"}
                                            </p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            {/* Job Seeker Option */}
                                            <button
                                                onClick={() => setStep('role_selection')}
                                                className="group relative flex flex-col items-center p-8 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-300"
                                            >
                                                <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                                                    <Briefcase size={36} />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                    {language === 'ar' ? 'أبحث عن وظيفة' : 'I am looking for a job'}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                                    {language === 'ar'
                                                        ? 'ابحث عن فرص عمل في أفضل العيادات'
                                                        : 'Find job opportunities at top clinics'}
                                                </p>
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                                        <ArrowRight size={14} className={language === 'ar' ? 'rotate-180' : ''} />
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Clinic Option */}
                                            <button
                                                onClick={() => handleRoleSelect('clinic')}
                                                className="group relative flex flex-col items-center p-8 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all duration-300"
                                            >
                                                <div className="w-20 h-20 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 group-hover:scale-110 transition-transform">
                                                    <Building2 size={36} />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                    {language === 'ar' ? 'أبحث عن موظفين' : 'I am looking for employees'}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                                    {language === 'ar'
                                                        ? 'وظف أفضل الكفاءات لعيادتك'
                                                        : 'Hire top talent for your clinic'}
                                                </p>
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center">
                                                        <ArrowRight size={14} className={language === 'ar' ? 'rotate-180' : ''} />
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                        <div className="text-center mb-8">
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                                {language === 'ar' ? 'ماهو تخصصك؟' : 'What is your specialty?'}
                                            </h2>
                                            <p className="text-gray-500 dark:text-gray-400">
                                                {language === 'ar' ? 'اختر الدور الذي يناسبك' : 'Choose the role that fits you best'}
                                            </p>
                                        </div>

                                        <div className="grid gap-3 max-h-[60vh] overflow-y-auto p-1">
                                            {jobRoles.map((role) => (
                                                <button
                                                    key={role.id}
                                                    onClick={() => handleRoleSelect('job_seeker', role.id)}
                                                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-500 hover:shadow-md transition-all bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 group"
                                                >
                                                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110", role.color)}>
                                                        {role.icon}
                                                    </div>
                                                    <div className="flex-1 text-start">
                                                        <h4 className="font-bold text-gray-900 dark:text-white">
                                                            {language === 'ar' ? role.titleAr : role.titleEn}
                                                        </h4>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                        {language === 'ar' ? <ArrowRight size={16} className="rotate-180" /> : <ArrowRight size={16} />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                onClick={() => setStep('initial')}
                                                className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white underline"
                                            >
                                                {language === 'ar' ? 'العودة للخلف' : 'Go Back'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
