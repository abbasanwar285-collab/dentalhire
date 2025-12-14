'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Briefcase, LayoutDashboard, Menu, User, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const { t, language } = useLanguage();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Hide on scroll down, show on scroll up (optional native feel)
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

    const navItems = [
        {
            label: t('nav.home'),
            href: '/',
            icon: Home,
            isActive: pathname === '/',
        },
        {
            label: language === 'ar' ? 'الوظائف' : 'Jobs',
            href: '/jobs',
            icon: Briefcase,
            isActive: pathname.startsWith('/jobs'),
        },
        {
            label: isAuthenticated ? (language === 'ar' ? 'لوحتي' : 'Dashboard') : (language === 'ar' ? 'دخول' : 'Login'),
            href: isAuthenticated ? getDashboardLink() : '/login',
            icon: isAuthenticated ? LayoutDashboard : LogIn,
            isActive: pathname.includes('/dashboard') || pathname === '/login',
        },
        {
            label: language === 'ar' ? 'حسابي' : 'Profile', // Simplified Menu/Profile
            href: isAuthenticated ? '/profile' : '/register',
            icon: User,
            isActive: pathname === '/profile' || pathname === '/register',
        },
    ];

    return (
        <nav
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            className={cn(
                'fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 z-[100] transition-transform duration-300 lg:hidden pb-safe',
                !isVisible ? 'translate-y-full' : 'translate-y-0'
            )}
        >
            <div className="grid grid-cols-4 h-16 items-center">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex flex-col items-center justify-center gap-1 h-full w-full app-touch transition-colors',
                            item.isActive
                                ? 'text-blue-600 dark:text-blue-500'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        )}
                    >
                        <item.icon
                            size={24}
                            strokeWidth={item.isActive ? 2.5 : 2}
                            className={cn('transition-transform duration-200', item.isActive && 'scale-110')}
                        />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
