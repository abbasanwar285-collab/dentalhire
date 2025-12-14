'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function LogoutPage() {
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        const performLogout = async () => {
            await logout();
            router.push('/login');
        };

        performLogout();
    }, [logout, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400">Logging out...</p>
            </div>
        </div>
    );
}
