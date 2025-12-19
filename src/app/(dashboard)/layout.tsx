'use client';

// ============================================
// DentalHire - Dashboard Layout
// ============================================

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Navbar, Sidebar } from '@/components/layout';
import { useAuthStore } from '@/store';
import { PageLoader, NotificationBell } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import EmployerOnboardingModal from '@/components/onboarding/EmployerOnboardingModal';
import { getSupabaseClient } from '@/lib/supabase';
import { Menu, Bell } from 'lucide-react';
import Link from 'next/link';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, user } = useAuthStore();
    const { language } = useLanguage();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [checkingProfile, setCheckingProfile] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { unreadCount, fetchNotifications } = useNotificationStore();

    // Check if employer needs to complete profile
    useEffect(() => {
        const checkEmployerProfile = async () => {
            if (!user || !isAuthenticated) {
                setCheckingProfile(false);
                return;
            }

            // Only check for employer types
            const employerTypes = ['clinic', 'company', 'lab'];
            if (user.role !== 'clinic' || !employerTypes.includes(user.userType || 'clinic')) {
                setCheckingProfile(false);
                return;
            }

            try {
                const supabase = getSupabaseClient();

                // Add timeout to prevent hanging indefinitely
                const timeoutPromise = new Promise<null>((resolve) =>
                    setTimeout(() => resolve(null), 5000)
                );

                const queryPromise = supabase
                    .from('clinics')
                    .select('name, city')
                    .eq('user_id', user.id)
                    .maybeSingle();

                const result = await Promise.race([queryPromise, timeoutPromise]);

                // If timeout occurred, just continue without showing onboarding
                if (result === null) {
                    console.warn('Employer profile check timed out, continuing without onboarding');
                    setCheckingProfile(false);
                    return;
                }

                const { data: clinicData, error } = result;
                const typedData = clinicData as { name: string; city: string } | null;

                // If no clinic record or missing name/city, show onboarding
                if (error) {
                    console.warn('Error checking employer profile (non-critical):', error.message);
                    // If there's an error, show onboarding to let user create profile
                    setShowOnboarding(true);
                } else if (!typedData || !typedData.name || !typedData.city) {
                    setShowOnboarding(true);
                }
            } catch (err) {
                console.error('Error checking employer profile:', err);
                // On error, still allow the dashboard to load but show onboarding
                setShowOnboarding(true);
            } finally {
                setCheckingProfile(false);
            }
        };

        if (!isLoading && isAuthenticated && user) {
            checkEmployerProfile();
        } else {
            setCheckingProfile(false);
        }
    }, [user, isAuthenticated, isLoading]);

    // Role-Based Access Control - Calculated Synchronously to prevent FOUC
    const redirectPath = useMemo(() => {
        if (isLoading || !user) return null;

        const path = pathname;
        // Handle root dashboard path or redirects
        if (!path) return null;

        const segment = path.split('/')[1]; // 'clinic', 'dentist', 'job-seeker', etc.

        // 1. Prevent Job Seekers from accessing Employer routes
        const employerRoutes = ['clinic', 'company', 'lab'];
        if (user.role === 'job_seeker' && employerRoutes.includes(segment)) {
            const map: Record<string, string> = {
                dentist: 'dentist',
                dental_assistant: 'assistant',
                sales_rep: 'sales',
                secretary: 'secretary',
                media: 'media',
                dental_technician: 'technician',
            };
            const target = map[user.userType] || 'job-seeker';
            return `/${target}/dashboard`;
        }

        // 2. Prevent Employers from accessing Job Seeker routes
        const jobSeekerRoutes = ['job-seeker', 'dentist', 'assistant', 'technician', 'sales', 'secretary', 'media'];
        if (['clinic', 'company', 'lab'].includes(user.role) && jobSeekerRoutes.includes(segment)) {
            // Only redirect if they are trying to access a dashboard-like route
            if (path.includes('/dashboard')) {
                if (user.userType === 'company') return '/company/dashboard';
                else if (user.userType === 'lab') return '/lab/dashboard';
                else return '/clinic/dashboard';
            }
        }

        // 3. Prevent Employers from accessing other Employer routes
        if (user.role === 'clinic') {
            if (user.userType === 'company' && (segment === 'clinic' || segment === 'lab')) {
                return '/company/dashboard';
            } else if (user.userType === 'lab' && (segment === 'clinic' || segment === 'company')) {
                return '/lab/dashboard';
            } else if (user.userType === 'clinic' && (segment === 'company' || segment === 'lab')) {
                return '/clinic/dashboard';
            }
        }

        // 4. Force Admin to Admin Dashboard & Prevent Others from Admin
        if (user.role === 'admin' && segment !== 'admin') {
            return '/admin/dashboard';
        }
        if (user.role !== 'admin' && segment === 'admin') {
            const map: Record<string, string> = {
                job_seeker: 'job-seeker',
                clinic: 'clinic',
                company: 'company',
                lab: 'lab'
            };
            if (user.role === 'job_seeker') {
                const jsMap: Record<string, string> = {
                    dentist: 'dentist',
                    dental_assistant: 'assistant',
                    sales_rep: 'sales',
                    secretary: 'secretary',
                    media: 'media',
                    dental_technician: 'technician',
                };
                const target = jsMap[user.userType] || 'job-seeker';
                return `/${target}/dashboard`;
            } else {
                const target = map[user.role] || 'login';
                return `/${target}/dashboard`;
            }
        }

        return null;
    }, [isLoading, user, pathname]);

    // Handle authentication redirect
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    // Handle RBAC redirect
    useEffect(() => {
        if (redirectPath) {
            router.push(redirectPath);
        }
    }, [redirectPath, router]);

    // Show loader during loading, profile check, or if a redirect is pending
    if (isLoading || checkingProfile || redirectPath) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <PageLoader />;
    }

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="hidden md:block">
                <Navbar />
            </div>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Mobile Sticky Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30 flex items-center justify-between px-4 transition-all duration-300">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ms-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        aria-label={language === 'ar' ? 'فتح القائمة' : 'Open Menu'}
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">
                        Hire Me
                    </span>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Link
                        href="/notifications"
                        aria-label={language === 'ar' ? 'الإشعارات' : 'Notifications'}
                        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse shadow-sm">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Link>
                </div>
            </div>

            <main className="md:ps-64 pt-20 md:pt-28 min-h-screen transition-all duration-300">
                <div className="px-4 md:px-6 pb-20 md:pb-6">
                    {children}
                </div>
            </main>

            {/* Employer Onboarding Modal */}
            <EmployerOnboardingModal
                isOpen={showOnboarding}
                onComplete={handleOnboardingComplete}
            />
        </div>
    );
}
