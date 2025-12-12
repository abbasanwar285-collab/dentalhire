'use client';

import { useAuthStore } from '@/store';
// import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, Check, Clock, Briefcase, MessageSquare, Star } from 'lucide-react';

export default function NotificationsPage() {

    const { user } = useAuthStore();

    // Sample notifications data based on role
    const getNotifications = () => {
        const baseNotifications = [
            {
                id: 3,
                type: 'message',
                icon: MessageSquare,
                title: 'New message received',
                message: 'Dr. Ahmed sent you a message',
                time: '1 day ago',
                read: true,
            },
            {
                id: 4,
                type: 'profile',
                icon: Star,
                title: 'Profile update reminder',
                message: 'Complete your profile to increase your chances',
                time: '1 day ago',
                read: true,
            },
        ];

        if (!user) return baseNotifications;

        if (user.role === 'clinic') {
            if (user.userType === 'company') {
                return [
                    {
                        id: 1,
                        type: 'application',
                        icon: Briefcase,
                        title: 'New Sales Rep Application',
                        message: 'John Doe applied for "Senior Sales Representative"',
                        time: '2 hours ago',
                        read: false,
                    },
                    ...baseNotifications
                ];
            }
            if (user.userType === 'lab') {
                return [
                    {
                        id: 1,
                        type: 'application',
                        icon: Briefcase,
                        title: 'New Technician Application',
                        message: 'Sarah Smith applied for "Dental Ceramist"',
                        time: '3 hours ago',
                        read: false,
                    },
                    ...baseNotifications
                ];
            }
            // Clinic
            return [
                {
                    id: 1,
                    type: 'application',
                    icon: Briefcase,
                    title: 'New Dentist Application',
                    message: 'Dr. Ali applied for "General Dentist"',
                    time: '1 hour ago',
                    read: false,
                },
                ...baseNotifications
            ];
        }

        // Job Seekers
        if (user.userType === 'sales_rep') {
            return [
                {
                    id: 1,
                    type: 'job_match',
                    icon: Briefcase,
                    title: 'New Sales Position',
                    message: 'Medical Corp is hiring a Sales Rep in your area',
                    time: '4 hours ago',
                    read: false,
                },
                ...baseNotifications
            ];
        }

        // Default Job Seeker (Dentist, Assistant, etc)
        return [
            {
                id: 1,
                type: 'job_match',
                icon: Briefcase,
                title: 'New Job Match',
                message: 'A clinic in your area is looking for a ' + (user.userType || 'staff member'),
                time: '2 hours ago',
                read: false,
            },
            {
                id: 2,
                type: 'application',
                icon: Check,
                title: 'Application Viewed',
                message: 'Your application was viewed by Smile Dental Clinic',
                time: '5 hours ago',
                read: false,
            },
            ...baseNotifications
        ];
    };

    const notifications = getNotifications();

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
            default:
                return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Stay updated with your latest activities
                    </p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Mark all as read
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => {
                    const Icon = notification.icon;
                    return (
                        <div
                            key={notification.id}
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
                                                {notification.time}
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
                })}
            </div>

            {notifications.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Bell size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        When you get notifications, they&apos;ll show up here
                    </p>
                </div>
            )}
        </div>
    );
}
