
'use client';

// ============================================
// DentalHire - Job Seeker Dashboard (Legacy/Generic)
// ============================================

import RoleBasedDashboard from '@/components/dashboard/RoleBasedDashboard';
import { useAuthStore } from '@/store';
import { useEffect, useState } from 'react';

export default function JobSeekerDashboard() {
    const { user } = useAuthStore();
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

    return <RoleBasedDashboard role={role} />;
}
