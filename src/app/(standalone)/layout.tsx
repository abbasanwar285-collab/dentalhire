'use client';

// ============================================
// DentalHire - Standalone Layout
// ============================================

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { PageLoader } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/layout'; // Optional: might want a different simple navbar or just a back button in the page itself.
// The user asked for a "new window" look, likely full screen. 
// But a simple Navbar with just "DentalHire" logo or similar might be nice. 
// For now, I will stick to MINIMAL as requested (no sidebar). 
// I'll add the Navbar but maybe a simplified one? 
// Or just let the page handle its header. The page has a big blue header.
// Let's keep it really empty, just auth check.

export default function StandaloneLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuthStore();
    const { language } = useLanguage();

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <PageLoader />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* No Navbar, No Sidebar as requested. Just content. */}
            {children}
        </div>
    );
}
