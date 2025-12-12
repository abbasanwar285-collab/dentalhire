'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
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
import Image from 'next/image';

export default function HomePage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [step, setStep] = useState<'initial' | 'role_selection'>('initial');

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'clinic') {
        router.push('/clinic/dashboard');
      } else {
        const typeToDashboard: Record<string, string> = {
          dentist: 'dentist',
          dental_assistant: 'assistant',
          sales_rep: 'sales',
          secretary: 'secretary',
          media: 'media',
        };
        const dashboard = typeToDashboard[user.userType] || 'job-seeker';
        router.push(`/${dashboard}/dashboard`);
      }
    }
  }, [isAuthenticated, user, router]);

  const handleRoleSelect = (role: string, subRole?: string) => {
    localStorage.setItem('has_onboarded', 'true');
    localStorage.setItem('user_role', role);
    if (subRole) {
      localStorage.setItem('user_sub_role', subRole);
    }

    // Redirect logic
    if (role === 'clinic') {
      router.push('/register?role=clinic');
    } else {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4 relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-50 dark:opacity-20 animate-spin-slow" />
      </div>

      {/* Brand Header */}
      <div className="absolute top-8 left-0 right-0 text-center z-10">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
            DH
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Dental<span className="text-blue-600 ml-0.5">Hire</span>
          </span>
        </div>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {step === 'initial' ? (
          <div className="space-y-12 animate-fade-in">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                {language === 'ar' ? 'مرحباً بك في مستقبل التوظيف' : 'Welcome to the Future of Hiring'}
              </h1>
              <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                {language === 'ar' ? 'من صتك الرائدة للربط بين محترفي طب الأسنان والعيادات المرموقة' : 'The premier platform connecting dental professionals with top-tier clinics'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Job Seeker Option */}
              <button
                onClick={() => setStep('role_selection')}
                className="group relative flex flex-col items-center p-8 md:p-12 rounded-3xl bg-white dark:bg-gray-800 border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-500 shadow-xl shadow-gray-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-24 h-24 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-8 group-hover:scale-110 transition-transform duration-300">
                  <Briefcase size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {language === 'ar' ? 'أبحث عن وظيفة' : 'I am looking for a job'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center text-lg">
                  {language === 'ar'
                    ? 'ابحث عن فرص عمل في أفضل العيادات'
                    : 'Find job opportunities at top clinics'}
                </p>

                <div className="absolute inset-0 rounded-3xl ring-4 ring-blue-500/0 group-hover:ring-blue-500/10 transition-all duration-500" />
              </button>

              {/* Clinic Option */}
              <button
                onClick={() => handleRoleSelect('clinic')}
                className="group relative flex flex-col items-center p-8 md:p-12 rounded-3xl bg-white dark:bg-gray-800 border-2 border-transparent hover:border-teal-500 dark:hover:border-teal-500 shadow-xl shadow-gray-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-24 h-24 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-8 group-hover:scale-110 transition-transform duration-300">
                  <Building2 size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {language === 'ar' ? 'أبحث عن موظفين' : 'I am looking for employees'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center text-lg">
                  {language === 'ar'
                    ? 'وظف أفضل الكفاءات لعيادتك'
                    : 'Hire top talent for your clinic'}
                </p>

                <div className="absolute inset-0 rounded-3xl ring-4 ring-teal-500/0 group-hover:ring-teal-500/10 transition-all duration-500" />
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-2xl animate-fade-in border border-gray-100 dark:border-gray-700">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {language === 'ar' ? 'ماهو تخصصك؟' : 'What is your specialty?'}
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'اختر الدور الذي يناسبك' : 'Choose the role that fits you best'}
              </p>
            </div>

            <div className="grid gap-4">
              {jobRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect('job_seeker', role.id)}
                  className="flex items-center gap-6 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 group relative overflow-hidden"
                >
                  <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110", role.color)}>
                    {role.icon}
                  </div>
                  <div className="flex-1 text-start">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                      {language === 'ar' ? role.titleAr : role.titleEn}
                    </h4>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    {language === 'ar' ? <ArrowRight size={18} className="rotate-180" /> : <ArrowRight size={18} />}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
              <button
                onClick={() => setStep('initial')}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium transition-colors px-6 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                {language === 'ar' ? 'العودة للخلف' : 'Go Back'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
