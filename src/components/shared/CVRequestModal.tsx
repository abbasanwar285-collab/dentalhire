'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Check, X as XIcon, Lock, Unlock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/shared';

interface CVRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    clinicName: string;
    requestDate: string;
    onRespond: (status: 'approved' | 'rejected') => Promise<void>;
    isLoading: boolean;
}

export const CVRequestModal: React.FC<CVRequestModalProps> = ({
    isOpen,
    onClose,
    clinicName,
    requestDate,
    onRespond,
    isLoading
}) => {
    const { language } = useLanguage();

    if (!isOpen) return null;

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: "spring", duration: 0.5, bounce: 0.3 }
        },
        exit: { opacity: 0, scale: 0.95, y: 20 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="relative h-32 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                            <div className="absolute top-4 right-4">
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg rotate-3">
                                <Building2 size={32} />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 text-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {language === 'ar' ? 'طلب عرض السيرة الذاتية' : 'CV Access Request'}
                            </h3>

                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                                {language === 'ar' ? (
                                    <>
                                        ترغب <span className="font-bold text-gray-900 dark:text-white">{clinicName}</span> في الاطلاع على سيرتك الذاتية الكاملة. هل توافق على منحهم صلاحية الوصول؟
                                    </>
                                ) : (
                                    <>
                                        <span className="font-bold text-gray-900 dark:text-white">{clinicName}</span> wants to view your full CV. Do you want to grant them access?
                                    </>
                                )}
                            </p>

                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {language === 'ar' ? 'تاريخ الطلب' : 'Request Date'}
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {new Date(requestDate).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', {
                                            dateStyle: 'medium'
                                        })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => onRespond('rejected')}
                                    variant="outline"
                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-900/20"
                                    disabled={isLoading}
                                >
                                    <XIcon size={18} />
                                    {language === 'ar' ? 'رفض' : 'Decline'}
                                </Button>
                                <Button
                                    onClick={() => onRespond('approved')}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                    loading={isLoading}
                                >
                                    <Check size={18} />
                                    {language === 'ar' ? 'موافقة' : 'Approve'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
