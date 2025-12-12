'use client';

// ============================================
// DentalHire - Landing Page
// ============================================

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Navbar, Footer } from '@/components/layout';
import { Button } from '@/components/shared';
import { useAuthStore } from '@/store';
import {
  Users,
  Briefcase,
  Target,
  Shield,
  Sparkles,
  ChevronRight,
  Check,
  Star,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

const OnboardingModal = dynamic(() => import('@/components/home/OnboardingModal'), { ssr: false });

export default function HomePage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

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

  // Stats - Hidden until real data is available
  // const stats = [ ... ];

  // Features - Keep as they are static marketing text
  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: t('home.features.cv.title'),
      description: t('home.features.cv.desc'),
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: t('home.features.match.title'),
      description: t('home.features.match.desc'),
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: t('home.features.verified.title'),
      description: t('home.features.verified.desc'),
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: t('home.features.privacy.title'),
      description: t('home.features.privacy.desc'),
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: t('home.how.step1.title'),
      description: t('home.how.step1.desc'),
      icon: <Users className="w-8 h-8" />,
    },
    {
      step: 2,
      title: t('home.how.step2.title'),
      description: t('home.how.step2.desc'),
      icon: <Target className="w-8 h-8" />,
    },
    {
      step: 3,
      title: t('home.how.step3.title'),
      description: t('home.how.step3.desc'),
      icon: <Briefcase className="w-8 h-8" />,
    },
  ];

  // Testimonials & Popular Jobs - Hidden until real data
  // const testimonials = [];
  // const popularJobs = [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <OnboardingModal />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />

        {/* Animated Circles */}
        <div className="absolute top-1/4 -start-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -end-20 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-start animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
                <Sparkles size={16} />
                {t('home.hero.badge')}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                {t('home.hero.title.prefix')}{' '}
                <span className="gradient-text">{t('home.hero.title.highlight')}</span>{' '}
                {t('home.hero.title.suffix')}
              </h1>

              <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto lg:mx-0">
                {t('home.hero.description')}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register?role=job_seeker">
                  <Button size="lg" rightIcon={<ArrowRight size={18} className={language === 'ar' ? 'rotate-180' : ''} />}>
                    {t('home.hero.btn.seeker')}
                  </Button>
                </Link>
                <Link href="/register?role=clinic">
                  <Button variant="outline" size="lg">
                    {t('home.hero.btn.clinic')}
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Check size={18} className="text-green-500" />
                  {t('home.trust.free')}
                </div>
                <div className="flex items-center gap-2">
                  <Check size={18} className="text-green-500" />
                  {t('home.trust.nocred')}
                </div>
                <div className="flex items-center gap-2">
                  <Check size={18} className="text-green-500" />
                  {t('home.trust.cancel')}
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image/Card */}
            <div className="relative hidden lg:block animate-fade-in [animation-delay:0.3s]">
              <div className="relative">
                {/* Main Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-2xl font-bold">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {language === 'ar' ? 'اسمك هنا' : 'Your Name'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {language === 'ar' ? 'المسمى الوظيفي' : 'Job Title'} • {language === 'ar' ? 'المدينة' : 'City'}
                      </p>
                    </div>
                    <div className="ms-auto">
                      <div className="w-14 h-14 rounded-full border-4 border-gray-200 dark:border-gray-600 flex items-center justify-center">
                        <span className="text-gray-400 font-bold">--%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <Briefcase size={16} className="text-blue-500" />
                      <span>{language === 'ar' ? 'سنوات الخبرة' : 'Years of Experience'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <MapPin size={16} className="text-blue-500" />
                      <span>{language === 'ar' ? 'مواقع العمل المفضلة' : 'Preferred Locations'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <Clock size={16} className="text-blue-500" />
                      <span>{language === 'ar' ? 'حالة التفرغ' : 'Availability Status'}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {(language === 'ar'
                      ? ['مهارة 1', 'مهارة 2', 'مهارة 3']
                      : ['Skill 1', 'Skill 2', 'Skill 3']
                    ).map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button className="flex-1" variant="outline" disabled>{language === 'ar' ? 'عرض الملف' : 'View Profile'}</Button>
                    <Button variant="ghost" className="flex-1" disabled>{language === 'ar' ? 'رسالة' : 'Message'}</Button>
                  </div>
                </div>

                {/* Floating Badge 1 - Hidden or Generic */}
                {/* <div className="absolute -top-4 -end-4 ..."> ... </div> */}

                {/* Floating Badge 2 */}
                <div className="absolute -bottom-4 -start-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 animate-pulse">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {language === 'ar' ? '+234 وظيفة جديدة' : '+234 New Jobs'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Hidden */}
      {/* <section className="py-12 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {t('home.features.title.prefix')}{' '}
              <span className="gradient-text">{t('home.features.title.highlight')}</span>
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-gray-900" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {t('home.how.title')}
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              {t('home.how.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative text-center">
                {/* Connection Line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-500 to-teal-500" />
                )}

                <div className="relative z-10 mb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white mx-auto shadow-lg">
                    {item.icon}
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-blue-500 flex items-center justify-center text-blue-500 font-bold text-sm">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/register">
              <Button size="lg" rightIcon={<ChevronRight size={18} className={language === 'ar' ? 'rotate-180' : ''} />}>
                {t('home.cta.button')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Jobs Section - Hidden */}
      {/* <section className="py-20 bg-gray-50 dark:bg-gray-800/50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
       ...
      </section> */}

      {/* Testimonials Section - Hidden */}
      {/* <section className="py-20 bg-white dark:bg-gray-900" dir={language === 'ar' ? 'rtl' : 'ltr'}>
       ...
      </section> */}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-teal-600 relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="absolute inset-0 opacity-10" />
        <div className="container-custom relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('home.final.title')}
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto mb-8">
            {t('home.final.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=job_seeker">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
                rightIcon={<ArrowRight size={18} className={language === 'ar' ? 'rotate-180' : ''} />}
              >
                {t('home.final.btn.create')}
              </Button>
            </Link>
            <Link href="/register?role=clinic">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                {t('home.final.btn.post')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
