import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Filter, User, Calendar, Clock, FileText } from 'lucide-react';
import { AuditLog, DOCTORS } from '../types';
import { auditService, AUDIT_ACTION_LABELS } from '../services/auditService';
import { PasswordModal } from '../components/PasswordModal';
import { useDoctorContext } from '../hooks/useDoctorContext';

export const ActivityLog: React.FC = () => {
    const navigate = useNavigate();
    const { currentDoctor } = useDoctorContext();
    const isQasim = currentDoctor?.id === 'dr_qasim';

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDoctor, setFilterDoctor] = useState<string>(isQasim ? 'dr_qasim' : 'all');
    const [isAuthorized, setIsAuthorized] = useState(isQasim || localStorage.getItem('activity_unlocked') === 'true');
    const [showPasswordModal, setShowPasswordModal] = useState(!isQasim && localStorage.getItem('activity_unlocked') !== 'true');

    useEffect(() => {
        loadLogs();

        // Subscribe to local activity triggers (for instant updates)
        const unsubscribe = auditService.subscribeToActivity(() => {
            loadLogs();
        });

        return () => unsubscribe();
    }, [filterDoctor]);

    const loadLogs = async () => {
        if (!isAuthorized) {
return;
}

        // 1. Try Local Logs (Instant)
        try {
            const local = await auditService.getLocalLogs();
            if (local.length > 0) {
                // Filter local logs if doctor filter is active
                const filteredLocal = filterDoctor === 'all'
                    ? local.slice(0, 100)
                    : local.filter(l => l.doctorId === filterDoctor).slice(0, 100);

                if (filteredLocal.length > 0) {
                    setLogs(filteredLocal);
                    setLoading(false);
                }
            }
        } catch (e) {
            console.error('Failed to load local logs:', e);
        }

        // 2. Network/Full Fetch (Fresh)
        try {
            let data: AuditLog[];
            if (filterDoctor === 'all') {
                data = await auditService.getRecent(100);
            } else {
                data = await auditService.getByDoctor(filterDoctor, 100);
            }
            setLogs(data);
        } catch (e) {
            console.error('Failed to load logs:', e);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('ar-IQ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ar-IQ', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDoctorInfo = (doctorId: string) => {
        return DOCTORS.find(d => d.id === doctorId) || {
            name: doctorId,
            badgeBg: 'bg-gray-600',
            badgeText: 'text-gray-300'
        };
    };

    const getActionColor = (action: string) => {
        if (action.includes('add')) {
return 'text-emerald-400';
}
        if (action.includes('edit')) {
return 'text-blue-400';
}
        if (action.includes('delete') || action.includes('cancel')) {
return 'text-red-400';
}
        if (action.includes('complete')) {
return 'text-violet-400';
}
        return 'text-gray-400';
    };

    // Group logs by date
    const groupedLogs = logs.reduce((acc, log) => {
        const dateKey = formatDate(log.timestamp);
        if (!acc[dateKey]) {
acc[dateKey] = [];
}
        acc[dateKey].push(log);
        return acc;
    }, {} as Record<string, AuditLog[]>);

    return (
        <div className="animate-fade-in">
            {/* Simple Sub-Header */}
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-600/20 text-violet-400 rounded-2xl">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">سجل النشاطات</h2>
                        <p className="text-gray-400 text-xs mt-0.5">تتبع آخر العمليات في العيادة</p>
                    </div>
                </div>

                {!isQasim && (
                    <div className="relative group">
                        <select
                            value={filterDoctor}
                            onChange={(e) => setFilterDoctor(e.target.value)}
                            className="appearance-none bg-gray-800 text-white text-xs font-bold py-2 px-4 pr-10 rounded-xl border border-gray-700 outline-none focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer"
                        >
                            <option value="all">جميع الأطباء</option>
                            {DOCTORS.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.name}</option>
                            ))}
                        </select>
                        <Filter size={14} className="absolute right-3 top-2.5 text-gray-500 pointer-events-none" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-4 space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">
                        <Activity size={32} className="mx-auto mb-2 animate-spin" />
                        جاري التحميل...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-800/50 rounded-3xl border border-dashed border-gray-700">
                        <FileText size={40} className="mx-auto mb-3 opacity-50" />
                        لا توجد نشاطات مسجلة
                    </div>
                ) : (
                    (Object.entries(groupedLogs) as [string, AuditLog[]][]).map(([date, dayLogs]) => (
                        <div key={date}>
                            {/* Date Header */}
                            <div className="flex items-center gap-2 mb-3 px-2">
                                <Calendar size={14} className="text-violet-400" />
                                <span className="text-sm font-bold text-gray-400">{date}</span>
                                <span className="text-xs text-gray-600">({dayLogs.length} نشاط)</span>
                            </div>

                            {/* Day Logs */}
                            <div className="space-y-2">
                                {dayLogs.map(log => {
                                    const doctor = getDoctorInfo(log.doctorId);
                                    return (
                                        <div
                                            key={log.id}
                                            className="bg-gray-800/60 backdrop-blur-md p-4 rounded-2xl border border-gray-700 hover:border-violet-500/30 transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${doctor.badgeBg} ${doctor.badgeText}`}>
                                                        {doctor.name}
                                                    </span>
                                                    <span className={`text-xs font-bold ${getActionColor(log.action)}`}>
                                                        {AUDIT_ACTION_LABELS[log.action] || log.action}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Clock size={12} />
                                                    {formatTime(log.timestamp)}
                                                </div>
                                            </div>

                                            <p className="text-gray-300 text-sm">{log.description}</p>

                                            {log.patientName && (
                                                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                                    <User size={12} />
                                                    {log.patientName}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Password Protection Modal */}
            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => navigate(-1)}
                onSuccess={() => {
                    localStorage.setItem('activity_unlocked', 'true');
                    setIsAuthorized(true);
                    setShowPasswordModal(false);
                }}
            />
        </div>
    );
};
