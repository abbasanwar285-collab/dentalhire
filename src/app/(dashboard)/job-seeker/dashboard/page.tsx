
'use client';

// ============================================
// DentalHire - Job Seeker Dashboard (Legacy/Generic)
// ============================================

import RoleBasedDashboard from '@/components/dashboard/RoleBasedDashboard';
import { useAuthStore } from '@/store';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useEffect, useState } from 'react';

export default function JobSeekerDashboard() {
    const { user } = useAuthStore();
    const { notifications, error, fetchNotifications, isLoading } = useNotificationStore();
    const [role, setRole] = useState('job_seeker');

    useEffect(() => {
        // Prioritize user type from auth store if available
        if (user?.userType) {
            setRole(user.userType);
        } else {
            // Fallback to local storage or defaults
            const storedSubRole = localStorage.getItem('user_sub_role');
            if (storedSubRole) {
                setRole(storedSubRole);
            }
        }
    }, [user]);

    return (
        <div className="relative">
            {/* DEBUG PANEL - TEMPORARY */}
            <div dir="ltr" className="bg-red-50 border-2 border-red-500 p-4 mb-6 rounded-lg text-xs font-mono text-red-800 shadow-lg">
                <h3 className="font-bold text-lg mb-2">⚠️ DEBUG DATA</h3>
                <div className="grid grid-cols-2 gap-2">
                    <p><span className="font-bold">User ID:</span> {user?.id || 'NULL'}</p>
                    <p><span className="font-bold">Email:</span> {user?.email || 'NULL'}</p>
                    <p><span className="font-bold">Notifications:</span> {notifications.length}</p>
                    <p><span className="font-bold">Loading:</span> {isLoading.toString()}</p>
                    <p><span className="font-bold">Error:</span> {error || 'None'}</p>
                </div>
                <button
                    onClick={() => user && fetchNotifications(user.id)}
                    className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                >
                    Force Fetch Notifications
                </button>
            </div>

            <RoleBasedDashboard role={role} />
        </div>
    );
}
