'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { courses } from '@/data/courses';
import { Navbar } from '@/components/layout';
import { Button } from '@/components/shared';
import {
    ArrowLeft,
    Clock,
    Play,
    Star,
    Users,
    Share2,
    Bookmark,
    CheckCircle,
    AlertCircle,
    Video,
    FileText,
    Award
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { language } = useLanguage();
    const courseId = params.courseId as string;

    const course = courses.find((c) => c.id === courseId);

    const t = {
        ar: {
            back: 'العودة للتدريب',
            notFound: {
                title: 'الدورة غير موجودة',
                desc: 'الدورة التي تبحث عنها غير موجودة.',
                button: 'العودة للتدريب'
            },
            video: {
                comingSoon: 'الفيديو قريباً'
            },
            stats: {
                lessons: 'درس',
                enrolled: 'طالب',
                rating: 'تقييم'
            },
            about: 'عن هذه الدورة',
            content: {
                title: 'محتوى الدورة',
                lessonTitle: 'عنوان الدرس',
                videoDuration: 'فيديو • 15 دقيقة'
            },
            sidebar: {
                free: 'مجاناً',
                start: 'ابدأ التعلم الآن',
                save: 'حفظ لوقت لاحق',
                share: 'مشاركة الدورة',
                includes: 'تتضمن هذه الدورة:',
                items: {
                    video: 'فيديو حسب الطلب',
                    resources: 'مصادر قابلة للتحميل',
                    certificate: 'شهادة إتمام'
                }
            }
        },
        en: {
            back: 'Back to Training',
            notFound: {
                title: 'Course Not Found',
                desc: 'The course you are looking for does not exist.',
                button: 'Back to Training'
            },
            video: {
                comingSoon: 'Video coming soon'
            },
            stats: {
                lessons: 'Lessons',
                enrolled: 'Enrolled',
                rating: 'Rating'
            },
            about: 'About this course',
            content: {
                title: 'Course Content',
                lessonTitle: 'Lesson Title',
                videoDuration: 'Video • 15 mins'
            },
            sidebar: {
                free: 'Free',
                start: 'Start Learning Now',
                save: 'Save for Later',
                share: 'Share Course',
                includes: 'This course includes:',
                items: {
                    video: 'on-demand video',
                    resources: 'downloadable resources',
                    certificate: 'Certificate of completion'
                }
            }
        }
    };

    const content = language === 'ar' ? t.ar : t.en;
    const isRTL = language === 'ar';

    if (!course) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{content.notFound.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{content.notFound.desc}</p>
                <Link href="/training">
                    <Button>{content.notFound.button}</Button>
                </Link>
            </div>
        );
    }

    // Extract video ID from URL if possible, or use full embed URL
    const getVideoSrc = (url: string) => {
        // Simple check if it's already an embed URL
        if (url.includes('embed')) return url;
        // Check for youtube.com/watch?v=ID
        if (url.includes('youtube.com/watch')) {
            const urlParams = new URL(url).searchParams;
            return `https://www.youtube.com/embed/${urlParams.get('v')}`;
        }
        // Check for youtu.be/ID
        if (url.includes('youtu.be')) {
            const id = url.split('/').pop();
            return `https://www.youtube.com/embed/${id}`;
        }
        return url;
    };

    const videoSrc = course.videoUrl ? getVideoSrc(course.videoUrl) : null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            <div className="pt-32 pb-12 container-custom max-w-5xl mx-auto px-4 relative z-0">
                {/* Breadcrumb / Back */}
                <div className="mb-6">
                    <Link
                        href="/training"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} className={language === 'ar' ? 'rotate-180' : ''} />
                        <span>{content.back}</span>
                    </Link>
                </div>

                {/* Video Player Section */}
                <div className="bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video mb-8 relative group">
                    {videoSrc ? (
                        <iframe
                            width="100%"
                            height="100%"
                            src={videoSrc}
                            title={course.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white">
                            <Play size={64} className="mb-4 opacity-50" />
                            <p>{content.video.comingSoon}</p>
                        </div>
                    )}
                </div>

                {/* Course Info */}
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
                                    {course.category}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium">
                                    {course.level}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                {course.title}
                            </h1>
                            <div className="flex flex-wrap gap-6 text-gray-600 dark:text-gray-400 text-sm">
                                <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-blue-500" />
                                    {course.duration}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Play size={18} className="text-blue-500" />
                                    {course.lessons} {content.stats.lessons}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={18} className="text-blue-500" />
                                    {course.enrolled.toLocaleString()} {content.stats.enrolled}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star size={18} className="text-yellow-500 fill-yellow-500" />
                                    {course.rating} {content.stats.rating}
                                </div>
                            </div>
                        </div>

                        <div className="prose dark:prose-invert max-w-none">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{content.about}</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {course.description}
                            </p>
                        </div>

                        {/* Course Content List (Mock) */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{content.content.title}</h3>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {[1, 2, 3, 4, 5].map((lesson) => (
                                    <button key={lesson} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-start group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center text-sm font-medium group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                                {lesson}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                    {content.content.lessonTitle} {lesson}
                                                </p>
                                                <p className="text-xs text-gray-500">{content.content.videoDuration}</p>
                                            </div>
                                        </div>
                                        {lesson === 1 ? (
                                            <CheckCircle size={18} className="text-green-500" />
                                        ) : (
                                            <Play size={18} className="text-gray-300 group-hover:text-blue-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 sticky top-24">
                            <div className="mb-6">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">{content.sidebar.free}</span>
                                <span className="text-gray-500 ml-2 line-through">$49.99</span>
                            </div>

                            <div className="space-y-3 mb-6">
                                <Button className="w-full" size="lg">{content.sidebar.start}</Button>
                                <Button variant="outline" className="w-full gap-2">
                                    <Bookmark size={18} />
                                    {content.sidebar.save}
                                </Button>
                                <Button variant="ghost" className="w-full gap-2">
                                    <Share2 size={18} />
                                    {content.sidebar.share}
                                </Button>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-3">{content.sidebar.includes}</h4>
                                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                    <li className="flex items-center gap-2">
                                        <Video size={16} className="text-blue-500" />
                                        {course.duration} {content.sidebar.items.video}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <FileText size={16} className="text-blue-500" />
                                        3 {content.sidebar.items.resources}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Award size={16} className="text-blue-500" />
                                        {content.sidebar.items.certificate}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
