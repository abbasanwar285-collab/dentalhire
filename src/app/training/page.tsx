'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    GraduationCap,
    BookOpen,
    Video,
    FileText,
    Award,
    ChevronRight,
    Clock,
    Users,
    Star,
    Play
} from 'lucide-react';
import { categories, courses as allCourses } from '@/data/courses';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { useAuthStore } from '@/store';

export default function TrainingPage() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const { language } = useLanguage();
    const { isAuthenticated } = useAuthStore();

    const t = {
        ar: {
            exit: 'خروج من وضع التدريب',
            platform: 'منصة التدريب المهني',
            title: 'أتقن مهارات مساعدة طب الأسنان',
            subtitle: 'دورات تدريبية شاملة مع فيديوهات، صور، ومحتوى تفاعلي لمساعدتك لتصبح مساعد طبيب أسنان محترف',
            stats: {
                courses: 'دورة',
                hours: 'ساعة',
                students: 'طالب',
                rating: 'تقييم',
            },
            categories: {
                title: 'فئات التدريب',
                courses: 'دورات',
                level: 'المستوى',
            },
            categoryItems: {
                basics: {
                    title: 'أساسيات مساعد طبيب الأسنان',
                    description: 'تعلم المهارات والمعرفة الأساسية التي يحتاجها كل مساعد طبيب أسنان',
                    level: 'مبتدئ',
                    duration: '8 ساعات'
                },
                instruments: {
                    title: 'أدوات ومعدات طب الأسنان',
                    description: 'أتقن التعرف على أدوات طب الأسنان واستخدامها الصحيح',
                    level: 'مبتدئ',
                    duration: '12 ساعة'
                },
                materials: {
                    title: 'مواد طب الأسنان',
                    description: 'افهم مواد طب الأسنان المختلفة وتطبيقاتها',
                    level: 'متوسط',
                    duration: '10 ساعات'
                },
                procedures: {
                    title: 'الإجراءات السريرية',
                    description: 'دليل خطوة بخطوة للمساعدة في إجراءات طب الأسنان',
                    level: 'متقدم',
                    duration: '20 ساعة'
                }
            },
            courseItems: {
                'intro-dental-assisting': {
                    title: 'مقدمة في مساعدة طب الأسنان',
                    category: 'أساسيات',
                    duration: 'ساعتان'
                },
                'dental-instruments-id': {
                    title: 'التعرف على أدوات الأسنان',
                    category: 'أدوات',
                    duration: '3 ساعات'
                },
                'infection-control': {
                    title: 'مكافحة العدوى والتعقيم',
                    category: 'إجراءات',
                    duration: '2.5 ساعة'
                }
            },
            featured: {
                title: 'دورات مميزة',
                viewAll: 'عرض الكل',
                lessons: 'دروس',
            },
            howItWorks: {
                title: 'كيف يعمل التدريب',
                step1: 'اختر الدورة',
                step1Desc: 'اختر من مكتبتنا الشاملة للدورات',
                step2: 'تعلم وتدرب',
                step2Desc: 'شاهد الفيديوهات، اقرأ المواد، وتدرب مع المحتوى التفاعلي',
                step3: 'خض التقييم',
                step3Desc: 'أكمل الاختبارات والامتحانات النهائية لاختبار معرفتك',
                step4: 'احصل على الشهادة',
                step4Desc: 'احصل على شهادة واعرض مهاراتك في ملفك الشخصي',
            },
            cta: {
                title: 'جاهز لبدء التعلم؟',
                subtitle: 'انضم لآلاف مساعدي أطباء الأسنان الذين يطورون مهاراتهم',
                button: 'ابدأ مجاناً',
            }
        },
        en: {
            exit: 'Exit Training Mode',
            platform: 'Professional Training Platform',
            title: 'Master Dental Assisting Skills',
            subtitle: 'Comprehensive training courses with videos, images, and interactive content to help you become a skilled dental assistant',
            stats: {
                courses: 'Courses',
                hours: 'Hours',
                students: 'Students',
                rating: 'Rating',
            },
            categories: {
                title: 'Training Categories',
                courses: 'courses',
                level: 'Level',
            },
            categoryItems: {
                basics: {
                    title: 'Dental Assistant Basics',
                    description: 'Learn the fundamental skills and knowledge every dental assistant needs',
                    level: 'Beginner',
                    duration: '8 hours'
                },
                instruments: {
                    title: 'Dental Instruments & Tools',
                    description: 'Master the identification and proper use of dental instruments',
                    level: 'Beginner',
                    duration: '12 hours'
                },
                materials: {
                    title: 'Dental Materials',
                    description: 'Understand different dental materials and their applications',
                    level: 'Intermediate',
                    duration: '10 hours'
                },
                procedures: {
                    title: 'Clinical Procedures',
                    description: 'Step-by-step guidance on assisting with dental procedures',
                    level: 'Advanced',
                    duration: '20 hours'
                }
            },
            courseItems: {
                'intro-dental-assisting': {
                    title: 'Introduction to Dental Assisting',
                    category: 'Basics',
                    duration: '2 hours'
                },
                'dental-instruments-id': {
                    title: 'Dental Instruments Identification',
                    category: 'Instruments',
                    duration: '3 hours'
                },
                'infection-control': {
                    title: 'Infection Control & Sterilization',
                    category: 'Procedures',
                    duration: '2.5 hours'
                }
            },
            featured: {
                title: 'Featured Courses',
                viewAll: 'View All',
                lessons: 'lessons',
            },
            howItWorks: {
                title: 'How Training Works',
                step1: 'Choose Course',
                step1Desc: 'Select from our comprehensive library of courses',
                step2: 'Learn & Practice',
                step2Desc: 'Watch videos, read materials, and practice with interactive content',
                step3: 'Take Assessment',
                step3Desc: 'Complete quizzes and final exams to test your knowledge',
                step4: 'Earn Certificate',
                step4Desc: 'Get certified and showcase your skills on your profile',
            },
            cta: {
                title: 'Ready to Start Learning?',
                subtitle: 'Join thousands of dental assistants improving their skills',
                button: 'Get Started Free',
            }
        }
    };

    const content = language === 'ar' ? t.ar : t.en;
    const isRTL = language === 'ar';

    // Use the first 3 courses as featured for now
    const featuredCourses = allCourses.slice(0, 3);

    const getColorClasses = (color: string) => {
        const colors = {
            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
            green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
            purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
            orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
        };
        return colors[color as keyof typeof colors] || colors.blue;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800" dir={isRTL ? 'rtl' : 'ltr'}>
            <header className="absolute top-0 left-0 right-0 z-10 p-4">
                <div className="container-custom max-w-7xl mx-auto flex justify-between items-center">
                    <LanguageSwitcher />
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors text-gray-800 dark:text-white font-medium backdrop-blur-sm border border-white/20"
                    >
                        {content.exit}
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="container-custom max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-4 py-2 rounded-full mb-6">
                            <GraduationCap size={20} />
                            <span className="font-medium">{content.platform}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                            {content.title}
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {content.subtitle}
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">30+</div>
                            <div className="text-gray-600 dark:text-gray-400">{content.stats.courses}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
                            <div className="text-gray-600 dark:text-gray-400">{content.stats.hours}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">5K+</div>
                            <div className="text-gray-600 dark:text-gray-400">{content.stats.students}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">4.8</div>
                            <div className="text-gray-600 dark:text-gray-400">{content.stats.rating}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="pb-20 px-4">
                <div className="container-custom max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                        {content.categories.title}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            // @ts-expect-error - category id index
                            const translatedInfo = content.categoryItems[category.id] || {};
                            const title = translatedInfo.title || category.title;
                            const description = translatedInfo.description || category.description;
                            const level = translatedInfo.level || category.level;
                            const duration = translatedInfo.duration || category.duration;

                            return (
                                <Link
                                    key={category.id}
                                    href={`/training/${category.id}`}
                                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all hover:shadow-lg group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${getColorClasses(category.color)}`}>
                                            <Icon size={28} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                                                {title}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                {description}
                                            </p>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <BookOpen size={16} />
                                                    {category.courses} {content.categories.courses}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={16} />
                                                    {duration}
                                                </span>
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                                                    {level}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className={`text-gray-400 group-hover:text-blue-600 transition-colors ${isRTL ? 'rotate-180' : ''}`} size={24} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Featured Courses */}
            <section className="pb-20 px-4 bg-white dark:bg-gray-800">
                <div className="container-custom max-w-6xl mx-auto py-20">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {content.featured.title}
                        </h2>
                        <Link href="/training/all" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
                            {content.featured.viewAll}
                            <ChevronRight size={20} className={isRTL ? 'rotate-180' : ''} />
                        </Link>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {featuredCourses.map((course) => {
                            // @ts-expect-error - course id index
                            const translatedCourse = content.courseItems?.[course.id] || {};
                            const title = translatedCourse.title || course.title;
                            const categoryName = translatedCourse.category || course.category;
                            const duration = translatedCourse.duration || course.duration;

                            return (
                                <Link
                                    key={course.id}
                                    href={`/training/course/${course.id}`}
                                    className="bg-gray-5 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group"
                                >
                                    <div className="bg-gradient-to-br from-blue-500 to-teal-500 h-40 flex items-center justify-center text-6xl">
                                        {course.image}
                                    </div>
                                    <div className="p-6">
                                        <div className="text-sm text-blue-600 font-medium mb-2">{categoryName}</div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors">
                                            {title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            <span className="flex items-center gap-1">
                                                <Clock size={16} />
                                                {duration}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Play size={16} />
                                                {course.lessons} {content.featured.lessons}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Star className="text-yellow-500 fill-yellow-500" size={16} />
                                                <span className="font-medium text-gray-900 dark:text-white">{course.rating}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <Users size={16} />
                                                {course.enrolled.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="py-20 px-4">
                <div className="container-custom max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
                        {content.howItWorks.title}
                    </h2>
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-xl">
                                1
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">{content.howItWorks.step1}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {content.howItWorks.step1Desc}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-xl">
                                2
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">{content.howItWorks.step2}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {content.howItWorks.step2Desc}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-xl">
                                3
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">{content.howItWorks.step3}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {content.howItWorks.step3Desc}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-xl">
                                4
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">{content.howItWorks.step4}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {content.howItWorks.step4Desc}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="pb-20 px-4">
                <div className="container-custom max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl p-12 text-center text-white">
                        <h2 className="text-3xl font-bold mb-4">{content.cta.title}</h2>
                        <p className="text-xl mb-8 opacity-90">
                            {content.cta.subtitle}
                        </p>
                        <Link
                            href={isAuthenticated ? '/training/basics' : '/register'}
                            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                        >
                            {content.cta.button}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
