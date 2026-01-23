'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';
import { useJobStore, useAuthStore } from '@/store';
import { Button } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';

interface InviteCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateId: string;
    candidateName: string;
}

export const InviteCandidateModal: React.FC<InviteCandidateModalProps> = ({
    isOpen,
    onClose,
    candidateId,
    candidateName
}) => {
    const { language } = useLanguage();
    const { user } = useAuthStore();
    const { jobs, loadClinicJobs, inviteCandidate } = useJobStore() as any; // Cast to any to avoid type error before update

    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && user?.id) {
            // Load jobs for the clinic if not already loaded or reload to be fresh
            loadClinicJobs(user.id);
        }
    }, [isOpen, user?.id, loadClinicJobs]);

    // Filter only active jobs
    const activeJobs = jobs.filter((job: any) => job.status === 'active');

    const handleSubmit = async () => {
        if (!selectedJobId) {
            setError(language === 'ar' ? 'الرجاء اختيار وظيفة' : 'Please select a job');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // We assume inviteCandidate is available in store (will be added)
            const result = await inviteCandidate(selectedJobId, candidateId, message);

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setMessage('');
                    setSelectedJobId('');
                }, 2000);
            } else {
                setError(result.message || (language === 'ar' ? 'فشل إرسال الدعوة' : 'Failed to send invitation'));
            }
        } catch (err) {
            setError(language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
                        <div className="flex justify-end absolute top-4 right-4">
                            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <h3 className="text-xl font-bold mb-1">
                            {language === 'ar' ? 'دعوة للتقديم' : 'Invite to Apply'}
                        </h3>
                        <p className="text-blue-100 text-sm">
                            {language === 'ar' ? `دعوة ${candidateName} للإنضمام لفريقك` : `Invite ${candidateName} to join your team`}
                        </p>
                    </div>

                    <div className="p-6 space-y-4">
                        {success ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    {language === 'ar' ? 'تم إرسال الدعوة بنجاح' : 'Invitation Sent Successfully'}
                                </h4>
                                <p className="text-gray-500 text-sm">
                                    {language === 'ar' ? 'سيتم إشعار المرشح قريباً' : 'The candidate will be notified shortly.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Job Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {language === 'ar' ? 'اختار الوظيفة' : 'Select Job Position'}
                                    </label>
                                    {activeJobs.length > 0 ? (
                                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                            {activeJobs.map((job: any) => (
                                                <div
                                                    key={job.id}
                                                    onClick={() => setSelectedJobId(job.id)}
                                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${selectedJobId === job.id
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedJobId === job.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                                        }`}>
                                                        <Briefcase size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{job.title}</p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {job.location} • {(job.salary.min / 1000).toFixed(0)}k - {(job.salary.max / 1000).toFixed(0)}k
                                                        </p>
                                                    </div>
                                                    {selectedJobId === job.id && <CheckCircle2 size={18} className="text-blue-500" />}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                            <p className="text-sm text-gray-500 mb-2">
                                                {language === 'ar' ? 'لا توجد وظائف نشطة حالياً' : 'No active jobs found.'}
                                            </p>
                                            <Button size="sm" variant="outline" onClick={() => window.location.href = '/clinic/jobs/new'}>
                                                {language === 'ar' ? 'انشر وظيفة جديدة' : 'Post New Job'}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {language === 'ar' ? 'رسالة (اختياري)' : 'Message (Optional)'}
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder={language === 'ar' ? 'اكتب رسالة شخصية للمرشح...' : 'Write a personal message to the candidate...'}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm min-h-[80px] focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button variant="ghost" className="flex-1" onClick={onClose}>
                                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={handleSubmit}
                                        loading={isSubmitting}
                                        disabled={!selectedJobId}
                                    >
                                        <Send size={16} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                                        {language === 'ar' ? 'إرسال الدعوة' : 'Send Invitation'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
