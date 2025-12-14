'use client';

// ============================================
// DentalHire - Dashboard Sidebar Component
// ============================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    LayoutDashboard,
    FileText,
    Search,
    Heart,
    MessageSquare,
    Settings,
    User,
    Users,
    BarChart3,
    Shield,
    ChevronLeft,
    ChevronRight,
    Building2,
    Briefcase,
    LogOut,
    HelpCircle,
    X
} from 'lucide-react';

interface SidebarLink {
    href: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
}

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const { t, language } = useLanguage();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (onClose && window.innerWidth < 768) {
            onClose();
        }
    }, [pathname]);

    // Get current role context from URL or user profile
    const getCurrentContext = () => {
        if (!pathname) return null;

        // e.g. /dentist/dashboard -> dentist
        const segments = pathname.split('/');
        const validRoles = ['dentist', 'assistant', 'dental_assistant', 'sales', 'sales_rep', 'secretary', 'media', 'technician', 'dental_technician', 'clinic', 'company', 'lab'];

        // Check first few segments for role (handling potential locale prefix)
        const foundRole = segments.find(s => validRoles.includes(s));

        if (foundRole) {
            if (foundRole === 'dental_assistant') return 'assistant';
            if (foundRole === 'dental_technician') return 'technician';
            if (foundRole === 'sales_rep') return 'sales';
            return foundRole;
        }

        // Fallback: Use userType from profile if available
        if (user?.userType) {
            const type = user.userType;
            if (validRoles.includes(type)) {
                if (type === 'dental_assistant') return 'assistant';
                if (type === 'dental_technician') return 'technician';
                if (type === 'sales_rep') return 'sales';
                return type;
            }
        }

        return null;
    };

    const currentContext = getCurrentContext();

    // Define links based on user role or context
    const getLinks = (): SidebarLink[] => {
        // If we are in a specific role context, show links for that role

        if (currentContext) {
            const isEmployer = ['clinic', 'company', 'lab'].includes(currentContext as string);

            if (isEmployer) {
                // Use userType to determine the correct context if available
                // This fixes the issue where a Lab Owner at /clinic/profile sees "Clinic Profile"
                const context = (user?.userType && ['clinic', 'company', 'lab'].includes(user?.userType))
                    ? user.userType
                    : currentContext;

                // Dynamic label for profile based on employer type
                const getProfileLabel = () => {
                    switch (context) {
                        case 'company':
                            return language === 'ar' ? 'معلومات الشركة' : 'Company Info';
                        case 'lab':
                            return language === 'ar' ? 'معلومات المختبر' : 'Lab Info';
                        default:
                            return t('sidebar.clinicprofile');
                    }
                };

                return [
                    { href: `/${context}/dashboard`, label: t('sidebar.dashboard'), icon: <LayoutDashboard size={20} /> },
                    { href: `/${context}/search`, label: t('sidebar.findcandidates'), icon: <Search size={20} /> },
                    { href: `/${context}/jobs`, label: t('sidebar.jobpostings'), icon: <Briefcase size={20} /> },
                    { href: `/${context}/applications`, label: t('sidebar.applications.employer') || (language === 'ar' ? 'طلبات المتقدمين' : 'Applications'), icon: <Users size={20} /> },
                    { href: `/${context}/favorites`, label: t('sidebar.savedcandidates'), icon: <Heart size={20} /> },
                    { href: '/messages', label: t('sidebar.messages'), icon: <MessageSquare size={20} /> },
                    { href: `/${context}/profile`, label: getProfileLabel(), icon: <Building2 size={20} /> },
                    { href: `/${context}/settings`, label: t('sidebar.settings'), icon: <Settings size={20} /> },
                ];
            }

            return [
                { href: `/${currentContext}/dashboard`, label: t('sidebar.dashboard'), icon: <LayoutDashboard size={20} /> },
                { href: '/jobs', label: t('sidebar.findjobs') || 'Find Jobs', icon: <Search size={20} /> },
                { href: '/job-seeker/cv-builder', label: t('sidebar.cvbuilder'), icon: <FileText size={20} /> },
                // Fix: Redirect all job seeker sub-roles to the main job-seeker profile page
                { href: '/job-seeker/profile', label: t('sidebar.myprofile'), icon: <User size={20} /> },
                { href: '/job-seeker/applications', label: t('sidebar.applications'), icon: <Briefcase size={20} /> },
                { href: '/messages', label: t('sidebar.messages'), icon: <MessageSquare size={20} /> },
                { href: '/job-seeker/settings', label: t('sidebar.settings'), icon: <Settings size={20} /> },
            ];
        }

        if (!user) return [];

        // Determine employer sub-type for fallback links
        const employerType = (user?.userType && ['company', 'lab'].includes(user.userType))
            ? user.userType
            : 'clinic';

        const getEmployerProfileLabel = () => {
            if (employerType === 'company') return language === 'ar' ? 'معلومات الشركة' : 'Company Info';
            if (employerType === 'lab') return language === 'ar' ? 'معلومات المختبر' : 'Lab Info';
            return t('sidebar.clinicprofile');
        };

        const baseLinks: Record<string, SidebarLink[]> = {
            job_seeker: [
                { href: '/job-seeker/dashboard', label: t('sidebar.dashboard'), icon: <LayoutDashboard size={20} /> },
                { href: '/jobs', label: t('sidebar.findjobs') || 'Find Jobs', icon: <Search size={20} /> },
                { href: '/job-seeker/cv-builder', label: t('sidebar.cvbuilder'), icon: <FileText size={20} /> },
                { href: '/job-seeker/profile', label: t('sidebar.myprofile'), icon: <User size={20} /> },
                { href: '/job-seeker/applications', label: t('sidebar.applications'), icon: <Briefcase size={20} /> },
                { href: '/messages', label: t('sidebar.messages'), icon: <MessageSquare size={20} /> },
                { href: '/job-seeker/settings', label: t('sidebar.settings'), icon: <Settings size={20} /> },
            ],
            clinic: [
                { href: `/${employerType}/dashboard`, label: t('sidebar.dashboard'), icon: <LayoutDashboard size={20} /> },
                { href: `/${employerType}/search`, label: t('sidebar.findcandidates'), icon: <Search size={20} /> },
                { href: `/${employerType}/jobs`, label: t('sidebar.jobpostings'), icon: <Briefcase size={20} /> },
                { href: `/${employerType}/applications`, label: t('sidebar.applications.employer') || (language === 'ar' ? 'طلبات المتقدمين' : 'Applications'), icon: <Users size={20} /> },
                { href: `/${employerType}/favorites`, label: t('sidebar.savedcandidates'), icon: <Heart size={20} /> },
                { href: '/messages', label: t('sidebar.messages'), icon: <MessageSquare size={20} /> },
                { href: `/${employerType}/profile`, label: getEmployerProfileLabel(), icon: <Building2 size={20} /> },
                { href: `/${employerType}/settings`, label: t('sidebar.settings'), icon: <Settings size={20} /> },
            ],
            admin: [
                { href: '/admin/dashboard', label: t('sidebar.dashboard'), icon: <LayoutDashboard size={20} /> },
                { href: '/admin/users', label: t('sidebar.manageusers'), icon: <Users size={20} /> },
                { href: '/admin/cvs', label: t('sidebar.managecvs'), icon: <FileText size={20} /> },
                { href: '/admin/clinics', label: t('sidebar.manageclinics'), icon: <Building2 size={20} /> },
                { href: '/admin/analytics', label: t('sidebar.analytics'), icon: <BarChart3 size={20} /> },
                { href: '/admin/moderation', label: t('sidebar.moderation'), icon: <Shield size={20} /> },
                { href: '/admin/settings', label: t('sidebar.settings'), icon: <Settings size={20} /> },
            ],
        };

        return baseLinks[user.role] || [];
    };

    const links = getLinks();

    const getRoleLabel = () => {
        if (currentContext) {
            const labels: Record<string, string> = {
                dentist: t('role.dentist') || 'Dentist',
                assistant: t('role.assistant') || 'Dental Assistant',
                sales: t('role.sales') || 'Sales Representative',
                secretary: t('role.secretary') || 'Secretary',
                media: t('role.media') || 'Public Figure',
            };
            return labels[currentContext];
        }

        if (!user) return '';
        switch (user.role) {
            case 'job_seeker':
                return t('role.jobseeker');
            case 'clinic':
                return t('role.clinic');
            case 'admin':
                return t('role.admin');
            default:
                return '';
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    'fixed start-0 top-0 h-full bg-white dark:bg-gray-900 border-e border-gray-200 dark:border-gray-800 z-[100] transition-all duration-300 pt-20',
                    isCollapsed ? 'w-20' : 'w-64',
                    // Mobile styles: translate off-screen if closed, fully visible if open
                    'transform md:transform-none',
                    isOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')
                )}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
                <div className="flex flex-col h-full">
                    {/* Functionality Buttons */}
                    <div className="absolute -end-3 top-24 flex flex-col gap-2">
                        {/* Collapse Button (Desktop only) */}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="hidden md:flex w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {isCollapsed ? (
                                <ChevronRight size={14} className={cn("text-gray-600", language === 'ar' && 'rotate-180')} />
                            ) : (
                                <ChevronLeft size={14} className={cn("text-gray-600", language === 'ar' && 'rotate-180')} />
                            )}
                        </button>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        aria-label={language === 'ar' ? 'إغلاق القائمة' : 'Close sidebar'}
                        className="absolute end-4 top-4 md:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>

                    {/* User Info */}
                    {user && (
                        <div className={cn(
                            'px-4 py-4 border-b border-gray-200 dark:border-gray-800',
                            isCollapsed && 'px-2'
                        )}>
                            <div className={cn(
                                'flex items-center gap-3',
                                isCollapsed && 'justify-center'
                            )}>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                                    {user.profile.firstName[0]}
                                    {user.profile.lastName[0]}
                                </div>
                                {!isCollapsed && (
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {user.profile.firstName} {user.profile.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {getRoleLabel()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Navigation Links */}
                    <nav className="flex-1 overflow-y-auto py-4">
                        <ul className="space-y-1 px-3">
                            {links.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                                isActive
                                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                                    : 'text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800',
                                                isCollapsed && 'justify-center px-2'
                                            )}
                                            title={isCollapsed ? link.label : undefined}
                                            onClick={() => {
                                                if (window.innerWidth < 768 && onClose) {
                                                    onClose();
                                                }
                                            }}
                                        >
                                            <span className={cn(
                                                'flex-shrink-0',
                                                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-300'
                                            )}>
                                                {link.icon}
                                            </span>
                                            {!isCollapsed && (
                                                <>
                                                    <span className="flex-1">{link.label}</span>
                                                    {link.badge && (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-full">
                                                            {link.badge}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                            {isCollapsed && link.badge && (
                                                <span className="absolute top-0 end-0 w-2 h-2 bg-blue-500 rounded-full"></span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Bottom Section */}
                    <div className="border-t border-gray-200 dark:border-gray-800 p-3">
                        <Link
                            href="/help"
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                                isCollapsed && 'justify-center px-2'
                            )}
                        >
                            <HelpCircle size={20} className="text-gray-500" />
                            {!isCollapsed && <span>{t('sidebar.help')}</span>}
                        </Link>
                        <button
                            onClick={logout}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full mt-1',
                                isCollapsed && 'justify-center px-2'
                            )}
                        >
                            <LogOut size={20} />
                            {!isCollapsed && <span>{t('sidebar.signout')}</span>}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

