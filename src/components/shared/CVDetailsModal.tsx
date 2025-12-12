import React from 'react';
import { Button } from '@/components/shared';
import {
    X,
    User,
    Mail,
    Phone,
    MapPin,
    Award,
    Briefcase
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CVDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    cv: any; // We can improve type later
}

export const CVDetailsModal: React.FC<CVDetailsModalProps> = ({
    isOpen,
    onClose,
    cv
}) => {
    const { language } = useLanguage();

    if (!isOpen || !cv) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                            {cv.personalInfo?.photo || cv.photo ? (
                                <img
                                    src={cv.personalInfo?.photo || cv.photo}
                                    alt={cv.personalInfo?.fullName || cv.full_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={32} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {cv.personalInfo?.fullName || cv.full_name || 'Candidate Name'}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                {cv.personalInfo?.city || cv.city || 'City'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                    {/* Contact Information */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                <Mail size={18} className="text-blue-500" />
                                <span className="text-sm">{cv.personalInfo?.email || cv.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                <Phone size={18} className="text-green-500" />
                                <span className="text-sm">{cv.personalInfo?.phone || cv.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                <MapPin size={18} className="text-red-500" />
                                <span className="text-sm">{cv.personalInfo?.city || cv.city || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    {(cv.skills?.length > 0) && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <Award size={20} className="text-yellow-500" />
                                {language === 'ar' ? 'المهارات' : 'Skills'}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {cv.skills.map((skill: string, idx: number) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm rounded-lg font-medium"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Experience */}
                    {(cv.experience?.length > 0) && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <Briefcase size={20} className="text-purple-500" />
                                {language === 'ar' ? 'الخبرات' : 'Experience'}
                            </h3>
                            <div className="space-y-4">
                                {cv.experience.map((exp: any, idx: number) => (
                                    <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{exp.title}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{exp.company}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            {exp.startDate} - {exp.current ? (language === 'ar' ? 'حتى الآن' : 'Present') : exp.endDate}
                                        </p>
                                        {exp.description && (
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{exp.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="primary"
                            className="flex-1"
                            onClick={() => window.open(`mailto:${cv.personalInfo?.email || cv.email}`, '_blank')}
                        >
                            <Mail size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                            {language === 'ar' ? 'إرسال بريد إلكتروني' : 'Send Email'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onClose}
                        >
                            {language === 'ar' ? 'إغلاق' : 'Close'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
