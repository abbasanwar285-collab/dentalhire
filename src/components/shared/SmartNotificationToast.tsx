'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Briefcase, User, MapPin } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export function SmartNotificationToast() {
    const { lastNotification, markAsRead } = useNotificationStore();
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();
    const { language } = useLanguage();

    useEffect(() => {
        if (lastNotification && !lastNotification.read) {
            // Only show if it's recent (created within last 10 seconds to avoid showing old on reload)
            const now = new Date();
            const created = new Date(lastNotification.created_at);
            const diff = now.getTime() - created.getTime();

            if (diff < 10000) {
                setIsVisible(true);
                // Auto-hide after 6 seconds
                const timer = setTimeout(() => setIsVisible(false), 6000);
                return () => clearTimeout(timer);
            }
        }
    }, [lastNotification]);

    if (!lastNotification) return null;

    const handleClick = () => {
        setIsVisible(false);
        markAsRead(lastNotification.id);

        // Smart navigation based on type
        if (lastNotification.type === 'job_match') {
            if (lastNotification.data?.job_id) {
                router.push(`/jobs?id=${lastNotification.data.job_id}`);
            } else {
                router.push('/jobs');
            }
        } else if (lastNotification.type === 'viewed_profile') {
            router.push('/job-seeker/profile'); // Or statistics page
        } else if (lastNotification.type === 'nearby_clinic') {
            router.push('/jobs');
        }
    };

    // Icon selection
    const getIcon = () => {
        switch (lastNotification.type) {
            case 'job_match': return <Briefcase className="text-blue-600" size={24} />;
            case 'viewed_profile': return <User className="text-purple-600" size={24} />;
            case 'nearby_clinic': return <MapPin className="text-green-600" size={24} />;
            default: return <Bell className="text-yellow-600" size={24} />;
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-20 left-4 md:left-8 z-[110] max-w-sm w-full"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                    <div
                        className="bg-white dark:bg-gray-800 border-l-4 border-blue-500 shadow-2xl rounded-lg p-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        onClick={handleClick}
                    >
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-full flex-shrink-0">
                            {getIcon()}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                {lastNotification.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                                {lastNotification.message}
                            </p>
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            aria-label="Close notification"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
