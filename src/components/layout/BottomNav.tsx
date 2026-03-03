'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Briefcase, LayoutDashboard, LogIn, ClipboardList, UserPlus, User } from 'lucide-react';
import { useAuthStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function BottomNav() {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const { t, language } = useLanguage();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Hide on specific routes


    // Robust auth check
    const isAuthenticated = !!user;

    // Hide on scroll
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Hide on specific routes
    if (pathname === '/login' || pathname === '/register') {
        return null;
    }

    const getDashboardLink = () => {
        if (!user) return '/login';
        if (user.role === 'clinic') return '/clinic/dashboard';
        const typeMap: Record<string, string> = {
            dentist: 'dentist',
            dental_assistant: 'assistant',
            sales_rep: 'sales',
            secretary: 'secretary',
            media: 'media',
        };
        const dashboard = typeMap[user.userType] || 'job-seeker';
        return `/${dashboard}/dashboard`;
    };

    const getProfileLink = () => {
        if (!user) return '/login';

        if (user.role === 'job_seeker') {
            return '/job-seeker/profile';
        }

        // For employers (clinic, company, lab)
        const type = user.userType || 'clinic';
        if (['company', 'lab'].includes(type)) {
            return `/${type}/profile`;
        }
        return '/clinic/profile';
    };

    const navItems = [
        {
            label: isAuthenticated ? (language === 'ar' ? 'ملفي' : 'Profile') : t('nav.home'),
            href: isAuthenticated ? getProfileLink() : '/',
            icon: isAuthenticated ? User : Home,
            isActive: isAuthenticated ? pathname.includes('/profile') : pathname === '/',
        },
        {
            label: language === 'ar' ? 'الوظائف' : 'Jobs',
            href: '/jobs',
            icon: Briefcase,
            isActive: pathname.startsWith('/jobs'),
        },
        // Item 3: Dashboard (Auth) or Login (Guest)
        {
            label: isAuthenticated ? (language === 'ar' ? 'لوحتي' : 'Dashboard') : (language === 'ar' ? 'دخول' : 'Login'),
            href: isAuthenticated ? getDashboardLink() : '/login',
            icon: isAuthenticated ? LayoutDashboard : LogIn,
            isActive: pathname.includes('/dashboard') || pathname === '/login',
        },
        // Item 4: Applications (Auth) or Register (Guest)
        {
            label: isAuthenticated ? (language === 'ar' ? 'طلباتي' : 'My Applications') : (language === 'ar' ? 'حساب جديد' : 'Register'),
            href: isAuthenticated
                ? (user?.role === 'clinic' ? '/clinic/applications' : '/job-seeker/applications')
                : '/register',
            icon: isAuthenticated ? ClipboardList : UserPlus,
            isActive: pathname.includes('/applications') || pathname === '/register',
        },
    ];

    return (
        <nav
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            className={cn(
                'fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-[100] transition-transform duration-300 lg:hidden pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.05)]',
                !isVisible ? 'translate-y-full' : 'translate-y-0'
            )}
        >
            <div className="grid grid-cols-4 h-18 py-1 items-center">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex flex-col items-center justify-center gap-1.5 h-full w-full app-touch transition-all duration-200 active:scale-90',
                            item.isActive
                                ? 'text-blue-600 dark:text-blue-500'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-xl transition-all duration-300",
                            item.isActive && "bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-100 dark:ring-blue-800"
                        )}>
                            <item.icon
                                size={22}
                                strokeWidth={item.isActive ? 2.5 : 2}
                                className={cn('transition-all duration-300', item.isActive && 'scale-110')}
                            />
                        </div>
                        <span className={cn(
                            "text-[10px] md:text-[11px] font-bold truncate w-full text-center px-1 font-cairo transition-all duration-300",
                            item.isActive ? "translate-y-0 opacity-100" : "translate-y-0.5 opacity-80"
                        )}>
                            {item.label}
                        </span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
