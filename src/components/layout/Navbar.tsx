'use client';

// ============================================
// DentalHire - Navbar Component
// ============================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import {
    Menu,
    X,
    Bell,
    MessageSquare,
    User,
    LogOut,
    ChevronDown,
    Briefcase,
    Building2,
    Shield,
} from 'lucide-react';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { NotificationBell } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Navbar() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { t, language } = useLanguage();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        // Use setTimeout to avoid synchronous state update during render
        const timer = setTimeout(() => setIsMobileMenuOpen(false), 0);
        return () => clearTimeout(timer);
    }, [pathname]);



    const getDashboardLink = () => {
        if (!user) return '/login';
        switch (user.role) {
            case 'job_seeker':
                return '/job-seeker/dashboard';
            case 'clinic':
                if (user.userType === 'company') return '/company/dashboard';
                if (user.userType === 'lab') return '/lab/dashboard';
                return '/clinic/dashboard';
            case 'admin':
                return '/admin/dashboard';
            default:
                return '/';
        }
    };

    const getRoleIcon = () => {
        if (!user) return <User size={18} />;
        switch (user.role) {
            case 'job_seeker':
                return <Briefcase size={18} />;
            case 'clinic':
                return <Building2 size={18} />;
            case 'admin':
                return <Shield size={18} />;
            default:
                return <User size={18} />;
        }
    };

    // Navigation links - Training is only for job seekers, not for employers (clinics)
    const baseNavLinks = [
        { href: isAuthenticated && user ? getDashboardLink() : '/', label: t('nav.home') },
        { href: '/jobs', label: language === 'ar' ? 'الوظائف' : 'Jobs', hideForRoles: ['clinic'] },
        { href: '/about', label: t('nav.about') },
        { href: '/training', label: t('nav.training'), hideForRoles: ['clinic'] },
        { href: '/contact', label: t('nav.contact') },
    ];

    // Filter out links that should be hidden for current user role
    const navLinks = baseNavLinks.filter(link => {
        if (!link.hideForRoles) return true;
        if (!user) return true; // Show all links for non-authenticated users
        return !link.hideForRoles.includes(user.role);
    });

    return (
        <nav
            className={cn(
                'fixed top-0 start-0 end-0 z-[100] transition-all duration-300',
                isScrolled
                    ? 'bg-white/80 backdrop-blur-lg shadow-md dark:bg-gray-900/80'
                    : 'bg-transparent'
            )}
        >
            <div className="container-custom">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative w-12 h-12 transition-transform duration-300 group-hover:scale-105">
                            <Image
                                src="/logo.png"
                                alt="Hire Me Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block group-hover:text-blue-600 transition-colors">
                            Hire Me
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'text-sm font-medium transition-colors hover:text-blue-600',
                                    pathname === link.href
                                        ? 'text-blue-600'
                                        : 'text-gray-600 dark:text-gray-300'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-2">
                        {/* Language Switcher - Hidden on mobile, shown in menu */}
                        <div className="hidden md:block">
                            <LanguageSwitcher />
                        </div>

                        {isAuthenticated && user ? (
                            <>
                                {/* Notifications */}
                                <NotificationBell />

                                {/* Messages */}
                                <Link
                                    href="/messages"
                                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden sm:flex"
                                >
                                    <MessageSquare size={20} className="text-gray-600 dark:text-gray-300" />
                                    {/* <span className="absolute top-1 end-1 w-2 h-2 bg-blue-500 rounded-full"></span> */}
                                </Link>

                                {/* Profile Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        aria-label="User profile"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-sm font-medium">
                                            {user.profile?.firstName?.[0] || 'U'}
                                            {user.profile?.lastName?.[0] || ''}
                                        </div>
                                        <ChevronDown size={16} className="text-gray-500 hidden sm:block" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isProfileOpen && (
                                        <div className="absolute end-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 animate-fade-in-down">
                                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {user.profile.firstName} {user.profile.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                    {getRoleIcon()}
                                                    {user.role === 'job_seeker' ? t('role.jobseeker') : user.role === 'clinic' ? t('role.clinic') : t('role.admin')}
                                                </p>
                                            </div>
                                            <Link
                                                href={getDashboardLink()}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                <Briefcase size={16} />
                                                {t('nav.dashboard')}
                                            </Link>
                                            <Link
                                                href={`${getDashboardLink().replace(/\/dashboard$/, '')}/profile`}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                <User size={16} />
                                                {t('nav.profile')}
                                            </Link>
                                            <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                                                <button
                                                    onClick={() => {
                                                        logout();
                                                        setIsProfileOpen(false);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                                                >
                                                    <LogOut size={16} />
                                                    {t('nav.signout')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors hidden sm:block"
                                >
                                    {t('nav.signin')}
                                </Link>
                                <Link
                                    href="/register"
                                    className="btn btn-primary"
                                >
                                    {t('nav.getstarted')}
                                </Link>
                            </>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <X size={24} className="text-gray-700 dark:text-gray-300" />
                            ) : (
                                <Menu size={24} className="text-gray-700 dark:text-gray-300" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-4 animate-fade-in-down">
                        <div className="flex flex-col gap-2">
                            {/* Language Switcher in Mobile Menu */}
                            <div className="px-4 py-2">
                                <LanguageSwitcher />
                            </div>

                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                                        pathname === link.href
                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    )}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {!isAuthenticated && (
                                <Link
                                    href="/login"
                                    className="px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
