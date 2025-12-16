'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Share, PlusSquare, Download } from 'lucide-react';

export default function PWAInstallPrompt() {
    const { t, language } = useLanguage();
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if user has already dismissed or installed
        const hasSeenPrompt = localStorage.getItem('has_seen_pwa_prompt');
        if (hasSeenPrompt) return;

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Detect redundant standalone mode (already installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) return;

        if (isIOSDevice) {
            // For iOS, show prompt after a small delay
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        } else {
            // For/Android/Desktop, wait for event
            const handleBeforeInstallPrompt = (e: Event) => {
                e.preventDefault();
                setDeferredPrompt(e);
                setShowPrompt(true);
            };

            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            };
        }
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            localStorage.setItem('has_seen_pwa_prompt', 'true');
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        localStorage.setItem('has_seen_pwa_prompt', 'true');
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    const isRTL = language === 'ar';

    return (
        <div className="fixed inset-x-0 bottom-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700 max-w-md mx-auto relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-teal-500" />

                <button
                    onClick={handleDismiss}
                    className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} text-gray-400 hover:text-gray-600 transition-colors`}
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shrink-0">
                            DH
                        </div>
                        <div className="flex-1 pt-1">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                {language === 'ar' ? 'قم بتثبيت التطبيق' : 'Install App'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                {language === 'ar'
                                    ? 'للحصول على أفضل تجربة، أضف تطبيق DentalHire إلى شاشتك الرئيسية.'
                                    : 'For the best experience, add DentalHire to your home screen.'}
                            </p>
                        </div>
                    </div>

                    {isIOS ? (
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 text-sm text-gray-600 dark:text-gray-300 space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-bold">1</span>
                                <span>
                                    {language === 'ar' ? 'اضغط على زر المشاركة' : 'Tap the Share button'}
                                    <Share className="inline-block w-4 h-4 mx-1 text-blue-500" />
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-bold">2</span>
                                <span>
                                    {language === 'ar' ? 'اختر "إضافة إلى الصفحة الرئيسية"' : 'Select "Add to Home Screen"'}
                                    <PlusSquare className="inline-block w-4 h-4 mx-1 text-blue-500" />
                                </span>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleInstallClick}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={20} />
                            {language === 'ar' ? 'تثبيت التطبيق الآن' : 'Install App Now'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
