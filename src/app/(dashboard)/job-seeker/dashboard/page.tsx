
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
            <RoleBasedDashboard role={role} />
        </div>
    );
}
