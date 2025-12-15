'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Trash2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationBell() {
    const { user } = useAuthStore();
    const router = useRouter();
    const {
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        subscribeToNotifications
    } = useNotificationStore();
    const { language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        if (user) {
            console.log('NotificationBell: User found, fetching and subscribing:', user.id);
            fetchNotifications(user.id);
            // Subscribe and store the cleanup function
            // @ts-ignore - subscribeToNotifications now returns a function but lint might not see it immediately
            unsubscribe = subscribeToNotifications(user.id);
        } else {
            console.log('NotificationBell: No user found yet');
        }

        // Cleanup on unmount or user change
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user, fetchNotifications, subscribeToNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleNotificationClick = async (notification: any) => {
        markAsRead(notification.id);
        setIsOpen(false);

        // Navigation logic based on type
        if (notification.type === 'status_change') {
            router.push('/job-seeker/applications');
        } else if (notification.type === 'new_application') {
            router.push('/clinic/applications');
        } else {
            // Default fallback
            if (user?.role === 'job_seeker') {
                router.push('/job-seeker/dashboard');
            } else {
                router.push('/clinic/dashboard');
            }
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
    const toggleDropdown = (e: React.MouseEvent) => {
                e.stopPropagation();
        setIsOpen(prev => !prev);
    };

            return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={toggleDropdown}
                    className={`relative p-2 transition-colors rounded-full ${isOpen
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    aria-label={language === 'ar' ? 'الإشعارات' : 'Notifications'}
                    aria-expanded={isOpen}
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse shadow-sm">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden ${language === 'ar' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'
                                }`}
                        >
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                                </h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => user && markAllAsRead(user.id)}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                        <Check size={12} />
                                        {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                                        <Bell size={32} className="mb-2 opacity-20" />
                                        <p className="text-sm">
                                            {language === 'ar' ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {notifications.map((notification) => (
                                            <li
                                                key={notification.id}
                                                className={`p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                                    }`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.read ? 'bg-blue-500' : 'bg-transparent'
                                                        }`} />
                                                    <div className="flex-1 space-y-1">
                                                        <p className={`text-sm ${!notification.read
                                                            ? 'font-semibold text-gray-900 dark:text-white'
                                                            : 'text-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
                                                            {new Date(notification.created_at).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: 'numeric',
                                                                minute: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            );
}
