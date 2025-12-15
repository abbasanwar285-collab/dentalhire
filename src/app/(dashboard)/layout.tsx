'use client';

// ============================================
// DentalHire - Dashboard Layout
// ============================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, Sidebar } from '@/components/layout';
import { useAuthStore } from '@/store';
import { PageLoader, NotificationBell } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import EmployerOnboardingModal from '@/components/onboarding/EmployerOnboardingModal';
import { getSupabaseClient } from '@/lib/supabase';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useAuthStore();
    const { language } = useLanguage();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [checkingProfile, setCheckingProfile] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                const { data: clinicData, error } = await supabase
                    .from('clinics')
                    .select('name, city')
                    .eq('user_id', user.id)
                    .maybeSingle();

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

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        // Role-Based Access Control
        if (!isLoading && user) {
            const path = window.location.pathname;
            const segment = path.split('/')[1]; // 'clinic', 'dentist', 'job-seeker', etc.

            // 1. Prevent Job Seekers from accessing Employer routes
            const employerRoutes = ['clinic', 'company', 'lab'];
            if (user.role === 'job_seeker' && employerRoutes.includes(segment)) {
                // Redirect to their specific dashboard
                const map: Record<string, string> = {
                    dentist: 'dentist',
                    dental_assistant: 'assistant',
                    sales_rep: 'sales',
                    secretary: 'secretary',
                    media: 'media',
                    dental_technician: 'technician',
                };
                const target = map[user.userType] || 'job-seeker';
                router.push(`/${target}/dashboard`);
                return;
            }

            // 2. Prevent Employers from accessing Job Seeker routes (except profile viewing which might be different URL)
            const jobSeekerRoutes = ['job-seeker', 'dentist', 'assistant', 'technician', 'sales', 'secretary', 'media'];

            if (['clinic', 'company', 'lab'].includes(user.role) && jobSeekerRoutes.includes(segment)) {
                if (path.includes('/dashboard')) {
                    // Redirect to their employer dashboard
                    if (user.userType === 'company') router.push('/company/dashboard');
                    else if (user.userType === 'lab') router.push('/lab/dashboard');
                    else router.push('/clinic/dashboard');
                    return;
                }
            }

            // 3. Prevent Employers from accessing other Employer routes
            if (user.role === 'clinic') {
                if (user.userType === 'company' && (segment === 'clinic' || segment === 'lab')) {
                    router.push('/company/dashboard');
                } else if (user.userType === 'lab' && (segment === 'clinic' || segment === 'company')) {
                    router.push('/lab/dashboard');
                } else if (user.userType === 'clinic' && (segment === 'company' || segment === 'lab')) {
                    router.push('/clinic/dashboard');
                }
            }
        }
    }, [isAuthenticated, isLoading, router, user]);

    const handleOnboardingComplete = async () => {
        setShowOnboarding(false);
        // Re-check session to update user profile data (name, etc.) without reloading
        await useAuthStore.getState().checkSession();
        setCheckingProfile(false);
    };

    if (isLoading || checkingProfile) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <PageLoader />;
    }

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
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                        Dental<span className="text-blue-600">Hire</span>
                    </span>
                </div>
                {/* Placeholder for future actions (e.g. notifications) */}
                <div className="flex items-center">
                    <NotificationBell />
                </div>
            </div>

            <main className="md:ps-64 pt-20 md:pt-8 min-h-screen transition-all duration-300">
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
