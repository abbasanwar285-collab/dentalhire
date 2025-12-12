'use client';

import { useEffect, useState } from 'react';
import { Check, Info, X } from 'lucide-react';
import { Button } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ApplicationSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    type?: 'success' | 'duplicate';
}

export default function ApplicationSuccessModal({ isOpen, onClose, type = 'success' }: ApplicationSuccessModalProps) {
    const { language } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            setTimeout(() => setIsVisible(false), 300); // Wait for exit animation
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const isSuccess = type === 'success';

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
        >
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md p-8 transform transition-all duration-500 ease-out flex flex-col items-center text-center overflow-hidden border border-white/20",
                    isOpen ? "translate-y-0 scale-100" : "translate-y-10 scale-95"
                )}
            >
                {/* Decorative Background Elements */}
                <div className={cn(
                    "absolute top-0 left-0 w-full h-2 bg-gradient-to-r",
                    isSuccess ? "from-blue-500 via-teal-500 to-emerald-500" : "from-blue-500 via-indigo-500 to-purple-500"
                )} />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="mb-6 relative">
                    <div className={cn(
                        "w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg animate-in zoom-in duration-500",
                        isSuccess
                            ? "from-emerald-400 to-teal-500 shadow-emerald-500/30"
                            : "from-blue-400 to-indigo-500 shadow-indigo-500/30"
                    )}>
                        {isSuccess ? (
                            <Check size={48} className="text-white drop-shadow-md" strokeWidth={3} />
                        ) : (
                            <Info size={48} className="text-white drop-shadow-md" strokeWidth={3} />
                        )}
                    </div>
                    {/* Ring animation */}
                    <div className={cn(
                        "absolute inset-0 rounded-full border-4 animate-ping opacity-75",
                        isSuccess ? "border-emerald-500/30" : "border-indigo-500/30"
                    )} />
                </div>

                {/* Main Text */}
                <h2 className={cn(
                    "text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r mb-2",
                    isSuccess
                        ? "from-blue-600 to-teal-600 dark:from-blue-400 dark:to-teal-400"
                        : "from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"
                )}>
                    {isSuccess
                        ? (language === 'ar' ? 'تم التقديم بنجاح!' : 'Application Sent!')
                        : (language === 'ar' ? 'تم التقديم مسبقاً' : 'Already Applied')
                    }
                </h2>

                {/* Subtext */}
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-[80%] leading-relaxed">
                    {isSuccess
                        ? (language === 'ar' ? 'تم إرسال طلبك إلى العيادة. نتمنى لك كل التوفيق في رحلتك المهنية!' : 'Your application has been sent to the clinic. We wish you the best for your career journey!')
                        : (language === 'ar' ? 'لقد قمت بالتقديم على هذه الوظيفة مسبقاً. طلبك قيد المراجعة حالياً.' : 'You have already applied for this job. Your application is currently under review.')
                    }
                </p>

                {/* Action Button */}
                <Button
                    onClick={onClose}
                    className={cn(
                        "w-full h-12 text-lg bg-gradient-to-r shadow-lg rounded-xl hover:opacity-90 transition-opacity",
                        isSuccess
                            ? "from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-blue-500/25"
                            : "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-indigo-500/25"
                    )}
                >
                    {language === 'ar' ? 'حسناً، شكراً' : 'Great, Thanks'}
                </Button>
            </div>
        </div>
    );
}
