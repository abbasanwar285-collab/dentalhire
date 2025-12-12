'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { courses, categories } from '@/data/courses';
import {
    ArrowLeft,
    Play,
    Clock,
    Users,
    Star,
    AlertCircle,
    ChevronRight,
    BookOpen
} from 'lucide-react';
import { Navbar } from '@/components/layout';

export default function CategoryPage() {
    const params = useParams();
    const categoryId = params.categoryId as string;

    // Find category details
    const category = categories.find(c => c.id === categoryId);

    // Filter courses for this category
    // Note: This matches "Basics" with "basics" by lowercasing
    const categoryCourses = courses.filter(
        c => c.category.toLowerCase() === categoryId?.toLowerCase() ||
            (categoryId === 'basics' && c.category === 'Basics') ||
            (categoryId === 'instruments' && c.category === 'Instruments') ||
            (categoryId === 'materials' && c.category === 'Materials') ||
            (categoryId === 'procedures' && c.category === 'Procedures')
    );

    if (!category) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <div className="pt-32 container-custom max-w-6xl mx-auto px-4 text-center">
                    <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Category Not Found</h1>
                    <Link href="/training" className="text-blue-600 hover:underline">
                        Return to Training Hub
                    </Link>
                </div>
            </div>
        );
    }

    const Icon = category.icon;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-500 to-teal-500 text-white">
                <div className="container-custom max-w-6xl mx-auto px-4 py-12 pt-24">
                    <div className="flex items-center justify-between mb-8">
                        <Link
                            href="/training"
                            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Back to Training
                        </Link>
                    </div>

                    <div className="flex items-center gap-6 mb-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <Icon size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold mb-2">{category.title}</h1>
                            <p className="text-xl text-white/90">{category.description}</p>
                        </div>
                    </div>

                    <div className="flex gap-6 text-sm font-medium bg-white/10 w-fit px-6 py-3 rounded-full backdrop-blur-sm">
                        <span className="flex items-center gap-2">
                            <BookOpen size={18} />
                            {categoryCourses.length} Courses
                        </span>
                        <span className="flex items-center gap-2">
                            <Clock size={18} />
                            {category.duration}
                        </span>
                        <span className="flex items-center gap-2">
                            <Users size={18} />
                            {category.level}
                        </span>
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            <div className="container-custom max-w-6xl mx-auto px-4 py-12">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryCourses.length > 0 ? (
                        categoryCourses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/training/course/${course.id}`}
                                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group flex flex-col"
                            >
                                <div className="h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-500">
                                    {course.image}
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium 
                                            ${course.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                                                course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'}`}>
                                            {course.level}
                                        </span>
                                        {course.videoUrl && (
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                                                <Play size={10} /> Video
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {course.title}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                                        {course.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {course.duration}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Star className="text-yellow-400 fill-yellow-400" size={14} />
                                                {course.rating}
                                            </span>
                                        </div>
                                        <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No courses in this category yet</h3>
                            <p className="text-gray-500">Check back soon for new content!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
