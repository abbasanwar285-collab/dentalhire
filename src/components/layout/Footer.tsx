'use client';

// ============================================
// DentalHire - Footer Component
// ============================================

import Link from 'next/link';
import {
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    Mail,
    Phone,
    MapPin,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
    const { t, language } = useLanguage();
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        company: [
            { label: t('footer.aboutus'), href: '/about' },
            { label: t('footer.careers'), href: '/careers' },
            { label: t('footer.press'), href: '/press' },
            { label: t('footer.blog'), href: '/blog' },
        ],
        forJobSeekers: [
            { label: t('footer.browsejobs'), href: '/jobs' },
            { label: t('footer.createcv'), href: '/register?role=job_seeker' },
            { label: t('footer.resources'), href: '/resources' },
            { label: t('footer.salary'), href: '/salary-guide' },
        ],
        forEmployers: [
            { label: t('footer.postjob'), href: '/register?role=clinic' },
            { label: t('footer.searchcandidates'), href: '/clinic/search' },
            { label: t('footer.pricing'), href: '/pricing' },
            { label: t('footer.employerresources'), href: '/employer-resources' },
        ],
        support: [
            { label: t('footer.helpcenter'), href: '/help' },
            { label: t('footer.contactus'), href: '/contact' },
            { label: t('footer.privacypolicy'), href: '/privacy' },
            { label: t('footer.termsofservice'), href: '/terms' },
        ],
    };

    const socialLinks = [
        { icon: <Facebook size={20} />, href: 'https://facebook.com', label: 'Facebook' },
        { icon: <Twitter size={20} />, href: 'https://twitter.com', label: 'Twitter' },
        { icon: <Linkedin size={20} />, href: 'https://linkedin.com', label: 'LinkedIn' },
        { icon: <Instagram size={20} />, href: 'https://instagram.com', label: 'Instagram' },
    ];

    return (
        <footer className="bg-gray-900 text-gray-300 hidden md:block" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Main Footer */}
            <div className="container-custom py-12 md:py-16">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                                DH
                            </div>
                            <span className="text-xl font-bold text-white">
                                Dental<span className="text-blue-400">Hire</span>
                            </span>
                        </Link>
                        <p className="text-sm text-gray-400 mb-4">
                            {t('footer.desc')}
                        </p>
                        {/* Contact Info */}
                        <div className="space-y-2">
                            <a href="mailto:hello@dentalhire.com" className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors">
                                <Mail size={16} />
                                hello@dentalhire.com
                            </a>
                            <a href="tel:+1555000111" className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors">
                                <Phone size={16} />
                                +1 (555) 000-111
                            </a>
                            <p className="flex items-center gap-2 text-sm">
                                <MapPin size={16} />
                                Los Angeles, CA
                            </p>
                        </div>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t('footer.company')}</h4>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm hover:text-blue-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* For Job Seekers */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t('footer.forjobseekers')}</h4>
                        <ul className="space-y-2">
                            {footerLinks.forJobSeekers.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm hover:text-blue-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* For Employers */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t('footer.foremployers')}</h4>
                        <ul className="space-y-2">
                            {footerLinks.forEmployers.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm hover:text-blue-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t('footer.support')}</h4>
                        <ul className="space-y-2">
                            {footerLinks.support.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm hover:text-blue-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="container-custom py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500">
                        © {currentYear} {t('footer.copyright')}
                    </p>

                    {/* Social Links */}
                    <div className="flex items-center gap-4">
                        {socialLinks.map((social) => (
                            <a
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-blue-400 transition-colors"
                                aria-label={social.label}
                            >
                                {social.icon}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

