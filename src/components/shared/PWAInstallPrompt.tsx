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
            // For iOS, show prompt after a longer delay to not interrupt user
            const timer = setTimeout(() => setShowPrompt(true), 15000); // 15 seconds instead of 3
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
        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0)+70px)] z-[60] p-3 md:p-4 animate-in slide-in-from-bottom duration-500">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-gray-100 dark:border-gray-700 max-w-lg mx-auto relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-teal-500" />

                <button
                    onClick={handleDismiss}
                    className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} text-gray-400 hover:text-gray-600 transition-colors z-10`}
                    aria-label={language === 'ar' ? 'إغلاق' : 'Dismiss'}
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                        DH
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white truncate">
                            {language === 'ar' ? 'ثبت تطبيق DentalHire' : 'Install DentalHire App'}
                        </h3>
                        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                            {language === 'ar'
                                ? 'للحصول على أفضل تجربة وسرعة في الوصول.'
                                : 'For the best experience and faster access.'}
                        </p>
                    </div>

                    <div className="shrink-0 flex items-center ms-2">
                        {isIOS ? (
                            <button
                                onClick={() => {/* iOS doesn't have programmatic prompt, maybe show tooltip? */ }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-xs font-semibold"
                            >
                                <Share size={14} className="text-blue-500" />
                                {language === 'ar' ? 'كيفية التثبيت' : 'How to install'}
                            </button>
                        ) : (
                            <button
                                onClick={handleInstallClick}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs shadow-md shadow-blue-500/10 active:scale-95 transition-all flex items-center gap-1.5"
                            >
                                <Download size={14} />
                                {language === 'ar' ? 'تثبيت' : 'Install'}
                            </button>
                        )}
                    </div>
                </div>

                {isIOS && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex gap-4 text-[10px] text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold">1</span>
                            <span>{language === 'ar' ? 'اضغط مشاركة' : 'Tap Share'}</span>
                            <Share size={12} className="text-blue-500" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold">2</span>
                            <span>{language === 'ar' ? 'إضافة للشاشة' : 'Add to Home'}</span>
                            <PlusSquare size={12} className="text-blue-500" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
