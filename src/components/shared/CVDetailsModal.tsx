'use client';

import React, { useState } from 'react';
import {
    X,
    User,
    Mail,
    Phone,
    MapPin,
    Award,
    Briefcase,
    GraduationCap,
    Calendar,
    DollarSign,
    Globe,
    Clock,
    Share2,
    CheckCircle,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/shared';

interface CVDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    cv: any;
}

export const CVDetailsModal: React.FC<CVDetailsModalProps> = ({
    isOpen,
    onClose,
    cv
}) => {
    const { language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'skills'>('overview');

    if (!cv) return null;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 50 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: "spring", duration: 0.6, bounce: 0.3 }
        },
        exit: { opacity: 0, scale: 0.9, y: 50 }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-IQ' : 'en-US', {
            style: 'currency',
            currency: currency || 'IQD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative bg-white dark:bg-gray-900 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100 dark:border-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Glassmorphic Header */}
                        <div className="relative h-48 sm:h-64 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 overflow-hidden shrink-0">
                            {/* Decorative Blobs */}
                            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

                            {/* Header Actions */}
                            <div className="absolute top-4 right-4 flex gap-2 z-10">
                                <button
                                    onClick={onClose}
                                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/20 shadow-lg hover:rotate-90 duration-300"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Profile Info in Header */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 w-full">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2, type: "spring" }}
                                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden shrink-0 relative z-20"
                                    >
                                        {cv.personalInfo?.photo || cv.photo ? (
                                            <img
                                                src={cv.personalInfo?.photo || cv.photo}
                                                alt={cv.personalInfo?.fullName || cv.full_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                                <User size={48} className="text-gray-400" />
                                            </div>
                                        )}
                                    </motion.div>

                                    <div className="text-center sm:text-start flex-1 pb-2">
                                        <motion.h2
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-3xl font-bold text-white mb-2 shadow-sm"
                                        >
                                            {cv.personalInfo?.fullName || cv.full_name || (language === 'ar' ? 'مرشح' : 'Candidate')}
                                            {(cv.personalInfo?.verified || cv.verified) && (
                                                <div className="inline-flex items-center gap-1 ms-3 px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-base font-medium text-white">
                                                    <CheckCircle size={16} className="text-blue-200" />
                                                    {language === 'ar' ? 'موثق' : 'Verified'}
                                                </div>
                                            )}
                                        </motion.h2>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="flex flex-wrap justify-center sm:justify-start gap-3 text-blue-50"
                                        >
                                            <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm border border-white/10">
                                                <Briefcase size={14} />
                                                {cv.experience?.[0]?.title || (language === 'ar' ? 'باحث عن عمل' : 'Job Seeker')}
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm border border-white/10">
                                                <MapPin size={14} />
                                                {cv.personalInfo?.city || cv.city || 'N/A'}
                                            </span>
                                        </motion.div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pb-2">
                                        <Button
                                            onClick={() => window.open(`mailto:${cv.personalInfo?.email || cv.email}`, '_blank')}
                                            className="bg-white/90 hover:bg-white text-blue-700 border-none shadow-lg backdrop-blur-sm"
                                        >
                                            <Mail size={18} className="mr-2" />
                                            {language === 'ar' ? 'تواصل' : 'Contact'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex flex-col md:flex-row h-full overflow-hidden">
                            {/* Sidebar Info */}
                            <div className="w-full md:w-80 bg-gray-50 dark:bg-gray-800/50 border-e border-gray-100 dark:border-gray-800 overflow-y-auto p-6 space-y-8 shrink-0 custom-scrollbar">

                                {/* Info Cards */}
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                            <User size={16} />
                                            {language === 'ar' ? 'معلومات شخصية' : 'Personal Info'}
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <Mail size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-400">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate" title={cv.personalInfo?.email || cv.email}>{cv.personalInfo?.email || cv.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                                    <Phone size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">{language === 'ar' ? 'الهاتف' : 'Phone'}</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200" dir="ltr">{cv.personalInfo?.phone || cv.phone}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                                    <DollarSign size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">{language === 'ar' ? 'الراتب المتوقع' : 'Expected Salary'}</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                                        {cv.salary?.expected ? formatCurrency(cv.salary.expected, cv.salary.currency) : (language === 'ar' ? 'غير محدد' : 'Not specified')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Languages */}
                                    {cv.languages && cv.languages.length > 0 && (
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                                <Globe size={16} />
                                                {language === 'ar' ? 'اللغات' : 'Languages'}
                                            </h4>
                                            <div className="space-y-3">
                                                {cv.languages.map((lang: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg">
                                                        <span className="font-medium text-gray-700 dark:text-gray-200">{lang.language}</span>
                                                        <span className="text-xs px-2 py-1 rounded-md bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-500">
                                                            {lang.proficiency}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Availability */}
                                    {cv.availability && (
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                                <Calendar size={16} />
                                                {language === 'ar' ? 'التوفر' : 'Availability'}
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <CheckCircle2 size={16} className="text-green-500" />
                                                    <span>{cv.availability.type === 'full_time' ? (language === 'ar' ? 'دوام كامل' : 'Full Time') : (language === 'ar' ? 'دوام جزئي' : 'Part Time')}</span>
                                                </div>
                                                {cv.availability.startDate && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                        <Clock size={16} className="text-blue-500" />
                                                        <span>{new Date(cv.availability.startDate).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Main Details */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-8 bg-white dark:bg-gray-900">

                                {/* Bio Section */}
                                {(cv.personalInfo?.bio || cv.bio) && (
                                    <section>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <span className="w-8 h-1 rounded-full bg-blue-500 block"></span>
                                            {language === 'ar' ? 'نبذة عني' : 'About Me'}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                                            {cv.personalInfo?.bio || cv.bio}
                                        </p>
                                    </section>
                                )}

                                {/* Skills Section (Chips) */}
                                {cv.skills && cv.skills.length > 0 && (
                                    <section>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <span className="w-8 h-1 rounded-full bg-yellow-500 block"></span>
                                            {language === 'ar' ? 'المهارات' : 'Skills'}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {cv.skills.map((skill: string, idx: number) => (
                                                <motion.span
                                                    key={idx}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    whileHover={{ scale: 1.05, y: -2 }}
                                                    className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm font-medium cursor-default hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all"
                                                >
                                                    {skill}
                                                </motion.span>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Work Experience Timeline */}
                                {cv.experience && cv.experience.length > 0 && (
                                    <section>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                            <span className="w-8 h-1 rounded-full bg-purple-500 block"></span>
                                            {language === 'ar' ? 'الخبرات العملية' : 'Work Experience'}
                                        </h3>
                                        <div className="relative border-s-2 border-gray-100 dark:border-gray-800 space-y-8 ms-3.5">
                                            {cv.experience.map((exp: any, idx: number) => (
                                                <motion.div
                                                    key={idx}
                                                    variants={itemVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="relative ps-8"
                                                >
                                                    <span className="absolute -start-[9px] top-1.5 h-4 w-4 rounded-full border-4 border-white dark:border-gray-900 bg-purple-500 shadow-sm"></span>

                                                    <div className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{exp.title}</h4>
                                                            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-white dark:bg-gray-900 px-2 py-1 rounded border border-gray-100 dark:border-gray-700 mt-1 sm:mt-0 w-fit">
                                                                {exp.startDate} - {exp.current ? (language === 'ar' ? 'الحاضر' : 'Present') : exp.endDate}
                                                            </span>
                                                        </div>
                                                        <p className="text-purple-600 dark:text-purple-400 font-medium mb-3">{exp.company} • {exp.location}</p>
                                                        {exp.description && (
                                                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-gray-200 dark:border-gray-700/50 pt-3 mt-1">
                                                                {exp.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Education Grid */}
                                {cv.certifications && cv.certifications.length > 0 && (
                                    <section>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                            <span className="w-8 h-1 rounded-full bg-indigo-500 block"></span>
                                            {language === 'ar' ? 'التعليم والشهادات' : 'Education & Certifications'}
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {cv.certifications.map((cert: any, idx: number) => (
                                                <motion.div
                                                    key={idx}
                                                    variants={itemVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    transition={{ delay: 0.2 + (idx * 0.1) }}
                                                    className="bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 hover:shadow-md hover:border-indigo-200 transition-all flex items-start gap-4"
                                                >
                                                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                                                        <GraduationCap size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1" title={cert.title || cert.name}>
                                                            {cert.title || cert.name}
                                                        </h4>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cert.issuer || cert.institution}</p>
                                                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2 bg-white dark:bg-indigo-950/50 px-2 py-0.5 rounded-md w-fit border border-indigo-100 dark:border-indigo-800/50">
                                                            {cert.date || cert.year}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
