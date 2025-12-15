'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Bell, Check, Clock, Briefcase, MessageSquare, Star, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageLoader } from '@/components/shared';

export default function NotificationsPage() {
    const { user } = useAuthStore();
    const {
        notifications,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    } = useNotificationStore();
    const { language } = useLanguage();

    useEffect(() => {
        if (user) {
            fetchNotifications(user.id);
        }
    }, [user, fetchNotifications]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'job_match': return Briefcase;
            case 'application': return Briefcase;
            case 'message': return MessageSquare;
            case 'profile': return Star;
            case 'status_change': return Info;
            default: return Bell;
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'job_match':
                return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
            case 'application':
                return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            case 'message':
                return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
            case 'profile':
                return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
            case 'status_change':
                return 'text-teal-600 bg-teal-100 dark:bg-teal-900/30';
            default:
                return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
        }
    };

    if (isLoading) {
        return <PageLoader />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {language === 'ar' ? 'ابق على اطلاع بآخر نشاطاتك' : 'Stay updated with your latest activities'}
                    </p>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={() => user && markAllAsRead(user.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                        <Check size={16} />
                        {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.length > 0 ? (
                    notifications.map((notification) => {
                        const Icon = getIcon(notification.type);
                        return (
                            <div
                                key={notification.id}
                                onClick={() => markAsRead(notification.id)}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                    }`}
                            >
                                <div className="flex gap-4">
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(notification.type)}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {new Date(notification.created_at).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', {
                                                        month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                        <Bell size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">
                            {language === 'ar' ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
