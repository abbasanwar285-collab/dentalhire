'use client';

import { useEffect, useState } from 'react';
import { useJobStore } from '@/store';
import { useAuthStore } from '@/store';
import { useMessageStore } from '@/store/useMessageStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import {
    Briefcase,
    MapPin,
    Clock,
    Building2,
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle,
    Mail,
    Phone,
    User,
    Filter,
    ChevronDown,
    X,
    Award,
    Globe,
    MessageCircle
} from 'lucide-react';
import { Button } from '@/components/shared';
import { getSupabaseClient } from '@/lib/supabase';

export default function ClinicApplicationsPage() {
    const { user } = useAuthStore();
    const { clinicApplications, loadClinicApplications, updateApplicationStatus, isLoading } = useJobStore();
    const { createConversation, setActiveConversation } = useMessageStore();
    const router = useRouter();
    const { language, t } = useLanguage();
    const [selectedJob, setSelectedJob] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedCV, setSelectedCV] = useState<any>(null);
    const [showCVModal, setShowCVModal] = useState(false);

    useEffect(() => {
        if (user) {
            loadClinicApplications(user.id);
        }
    }, [user, loadClinicApplications]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'reviewed':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'interview':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'accepted':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'rejected':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock size={16} />;
            case 'reviewed':
                return <CheckCircle size={16} />;
            case 'interview':
                return <Calendar size={16} />;
            case 'accepted':
                return <CheckCircle size={16} />;
            case 'rejected':
                return <XCircle size={16} />;
            default:
                return <AlertCircle size={16} />;
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, { en: string; ar: string }> = {
            pending: { en: 'Pending', ar: 'قيد المراجعة' },
            reviewed: { en: 'Reviewed', ar: 'تمت المراجعة' },
            interview: { en: 'Interview', ar: 'مقابلة' },
            accepted: { en: 'Accepted', ar: 'مقبول' },
            rejected: { en: 'Rejected', ar: 'مرفوض' },
        };
        return language === 'ar' ? labels[status]?.ar || status : labels[status]?.en || status;
    };

    const handleStatusChange = async (applicationId: string, newStatus: string) => {
        const success = await updateApplicationStatus(applicationId, newStatus);

        if (success) {
            // Find application and CV data to send notification
            const app = clinicApplications.find(a => a.id === applicationId);
            // Finding application and CV data
            const cvUserId = app?.cv?.userId;

            if (cvUserId) {
                const supabase = getSupabaseClient();
                const notificationTitle = language === 'ar' ? 'تحديث حالة الطلب' : 'Application Status Update';
                const statusText = getStatusLabel(newStatus);
                const jobTitle = app.job?.title || (language === 'ar' ? 'الوظيفة' : 'Job');

                const message = language === 'ar'
                    ? `تم تغيير حالة طلبك لوظيفة "${jobTitle}" إلى "${statusText}"`
                    : `Your application status for "${jobTitle}" has been updated to "${statusText}"`;

                const { error: notificationError } = await supabase.from('notifications').insert({
                    user_id: cvUserId,
                    title: notificationTitle,
                    message: message,
                    type: 'status_change',
                    related_id: applicationId
                });

                if (notificationError) {
                    console.error('Error sending notification:', notificationError);
                } else {
                    console.log('Notification sent successfully to user:', cvUserId);
                }
            } else {
                console.error('Cannot send notification: cvUserId is missing for application', applicationId, app);
            }
        } else {
            alert(language === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status');
        }
    };

    const handleMessageApplicant = async (application: any) => {
        if (!user || !application.cv) return;

        try {
            const conversationId = await createConversation(
                [user.id, application.cv.userId],
                {
                    [user.id]: application.job?.clinicName || user.email,
                    [application.cv.userId]: application.cv.fullName
                }
            );

            if (conversationId) {
                setActiveConversation(conversationId);
                router.push('/messages');
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            alert(language === 'ar' ? 'فشل بدء المحادثة' : 'Failed to start conversation');
        }
    };

    // Get unique jobs for filter
    const uniqueJobs = Array.from(
        new Map(clinicApplications.map(app => [app.job?.id, app.job])).values()
    ).filter(Boolean);

    // Filter applications
    const filteredApplications = clinicApplications.filter(app => {
        const jobMatch = selectedJob === 'all' || app.jobId === selectedJob;
        const statusMatch = selectedStatus === 'all' || app.status === selectedStatus;
        return jobMatch && statusMatch;
    });

    if (isLoading) {
        return (
            <div className="p-8 flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'ar' ? 'طلبات التوظيف' : 'Job Applications'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {language === 'ar'
                        ? 'إدارة ومراجعة طلبات التوظيف المستلمة'
                        : 'Manage and review received job applications'}
                </p>
            </div>

            {/* Filters */}
            {clinicApplications.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter size={18} className="text-gray-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            {language === 'ar' ? 'تصفية النتائج' : 'Filter Results'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Job Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {language === 'ar' ? 'الوظيفة' : 'Job'}
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedJob}
                                    onChange={(e) => setSelectedJob(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                                    aria-label={language === 'ar' ? 'تصفية حسب الوظيفة' : 'Filter by Job'}
                                >
                                    <option value="all">{language === 'ar' ? 'جميع الوظائف' : 'All Jobs'}</option>
                                    {uniqueJobs.map((job) => (
                                        <option key={job?.id} value={job?.id}>
                                            {job?.title}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {language === 'ar' ? 'الحالة' : 'Status'}
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                                    aria-label={language === 'ar' ? 'تصفية حسب الحالة' : 'Filter by Status'}
                                >
                                    <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
                                    <option value="pending">{getStatusLabel('pending')}</option>
                                    <option value="reviewed">{getStatusLabel('reviewed')}</option>
                                    <option value="interview">{getStatusLabel('interview')}</option>
                                    <option value="accepted">{getStatusLabel('accepted')}</option>
                                    <option value="rejected">{getStatusLabel('rejected')}</option>
                                </select>
                                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Briefcase size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {language === 'ar' ? 'لا توجد طلبات' : 'No applications'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        {language === 'ar'
                            ? 'لم يتم استلام أي طلبات توظيف بعد.'
                            : 'No job applications have been received yet.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredApplications.map((application) => (
                        <div
                            key={application.id}
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Applicant Info */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                            {application.cv?.photo ? (
                                                <img
                                                    src={application.cv.photo}
                                                    alt={application.cv.fullName}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <User size={32} />
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                                {application.cv?.fullName || (language === 'ar' ? 'غير متوفر' : 'N/A')}
                                            </h3>

                                            <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                                                    <span className="truncate">{application.cv?.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-gray-400 flex-shrink-0" />
                                                    <span>{application.cv?.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                                    <span>{application.cv?.city}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Job Info */}
                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
                                            <Building2 size={16} className="text-gray-400" />
                                            <span className="font-medium">{application.job?.title}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} />
                                                {language === 'ar' ? 'تقدم في' : 'Applied'} {formatDate(application.appliedAt)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skills Preview */}
                                    {application.cv?.skills && application.cv.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {application.cv.skills.slice(0, 5).map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-md"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {application.cv.skills.length > 5 && (
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                                                    +{application.cv.skills.length - 5}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Status & Actions */}
                                <div className="flex flex-col gap-4 lg:min-w-[200px]">
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {language === 'ar' ? 'الحالة' : 'Status'}
                                        </label>
                                        <select
                                            value={application.status}
                                            onChange={(e) => handleStatusChange(application.id, e.target.value)}
                                            className={`w-full px-3 py-2 rounded-lg border-2 font-medium text-sm appearance-none cursor-pointer transition-colors ${getStatusColor(application.status)}`}
                                            style={{
                                                backgroundImage: 'none'
                                            }}
                                            aria-label={language === 'ar' ? 'تحديث حالة الطلب' : 'Update Application Status'}
                                        >
                                            <option value="pending" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2">{getStatusLabel('pending')}</option>
                                            <option value="reviewed" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2">{getStatusLabel('reviewed')}</option>
                                            <option value="interview" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2">{getStatusLabel('interview')}</option>
                                            <option value="accepted" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2">{getStatusLabel('accepted')}</option>
                                            <option value="rejected" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2">{getStatusLabel('rejected')}</option>
                                        </select>
                                        <ChevronDown className="absolute left-3 top-[42px] text-current pointer-events-none" size={16} />
                                    </div>

                                    <Button
                                        variant="primary"
                                        className="w-full"
                                        onClick={() => {
                                            setSelectedCV(application.cv);
                                            setShowCVModal(true);
                                        }}
                                    >
                                        <User size={16} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                                        {language === 'ar' ? 'عرض السيرة الذاتية' : 'View CV'}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleMessageApplicant(application)}
                                    >
                                        <MessageCircle size={16} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                                        {language === 'ar' ? 'مراسلة' : 'Message'}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => window.open(`mailto:${application.cv?.email}`, '_blank')}
                                    >
                                        <Mail size={16} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                                        {language === 'ar' ? 'إرسال بريد' : 'Send Email'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            {clinicApplications.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700 dark:text-blue-400">
                            {language === 'ar' ? 'إجمالي الطلبات:' : 'Total Applications:'}
                        </span>
                        <span className="font-bold text-blue-900 dark:text-blue-300">
                            {filteredApplications.length} {language === 'ar' ? 'من' : 'of'} {clinicApplications.length}
                        </span>
                    </div>
                </div>
            )}

            {/* CV Modal */}
            {showCVModal && selectedCV && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCVModal(false)}>
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                                    {selectedCV.photo ? (
                                        <img
                                            src={selectedCV.photo}
                                            alt={selectedCV.fullName}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User size={32} />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {selectedCV.fullName}
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400">{selectedCV.city}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCVModal(false)}
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
                                        <span className="text-sm">{selectedCV.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <Phone size={18} className="text-green-500" />
                                        <span className="text-sm">{selectedCV.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <MapPin size={18} className="text-red-500" />
                                        <span className="text-sm">{selectedCV.city}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Skills */}
                            {selectedCV.skills && selectedCV.skills.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Award size={20} className="text-yellow-500" />
                                        {language === 'ar' ? 'المهارات' : 'Skills'}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCV.skills.map((skill: string, idx: number) => (
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
                            {selectedCV.experience && selectedCV.experience.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Briefcase size={20} className="text-purple-500" />
                                        {language === 'ar' ? 'الخبرات' : 'Experience'}
                                    </h3>
                                    <div className="space-y-4">
                                        {selectedCV.experience.map((exp: any, idx: number) => (
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
                                    onClick={() => window.open(`mailto:${selectedCV.email}`, '_blank')}
                                >
                                    <Mail size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                                    {language === 'ar' ? 'إرسال بريد إلكتروني' : 'Send Email'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        // We need application object here. 
                                        // But we only have selectedCV.
                                        // We need to pass application to modal, or find it.
                                        // Simpler: find application matching this CV? 
                                        // Or just pass entire application to selectedCV state?
                                        // For now, let's disable this button in modal or fix state.
                                        // Re-finding application:
                                        const app = clinicApplications.find(a => a.cv?.id === selectedCV.id);
                                        if (app) handleMessageApplicant(app);
                                    }}
                                >
                                    <MessageCircle size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                                    {language === 'ar' ? 'مراسلة' : 'Message'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCVModal(false)}
                                >
                                    {language === 'ar' ? 'إغلاق' : 'Close'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
