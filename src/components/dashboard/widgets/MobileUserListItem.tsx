'use client';

import React from 'react';
import { MoreVertical, CheckCircle, Clock } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    type: string;
    status: string;
    date: string;
}

interface MobileUserListItemProps {
    user: User;
    onAction?: (user: User) => void;
}

export default function MobileUserListItem({ user, onAction }: MobileUserListItemProps) {
    const isClinic = user.type === 'Clinic';

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 active:scale-[0.99] transition-transform">
            {/* Avatar / Icon */}
            <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                </div>
                {/* Status Indicator Dot */}
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${user.status === 'active' ? 'bg-green-500' : 'bg-amber-500'
                    }`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate pr-2">
                        {user.name}
                    </h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                        {user.date}
                    </span>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-1">
                    {user.email}
                </p>

                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isClinic
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                        {user.type}
                    </span>
                    <span className={`text-[10px] flex items-center gap-1 ${user.status === 'active' ? 'text-green-600' : 'text-amber-600'
                        }`}>
                        {user.status === 'active'
                            ? <><CheckCircle size={10} /> Active</>
                            : <><Clock size={10} /> Pending</>
                        }
                    </span>
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onAction?.(user);
                }}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full"
                aria-label="More options"
            >
                <MoreVertical size={20} />
            </button>
        </div>
    );
}
