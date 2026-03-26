import { useState, useEffect } from 'react';
import { BellRing, X, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [granted, setGranted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Only check if notifications are supported
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      setGranted(true);
      return;
    }

    // Always prompt on dashboard if permission is 'default'
    if (Notification.permission === 'default' && location.pathname === '/dashboard') {
      const timer = setTimeout(() => {
        setShow(true);
      }, 3000); // 3 seconds delay for less jarring experience
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleRequest = async () => {
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        setGranted(true);
        setTimeout(() => setShow(false), 3000); // Show success indicator before hiding
      } else {
        setShow(false);
      }
    } catch (e) {
      console.error('Notification request failed', e);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // Note: intentionally not saving to sessionStorage or localStorage
    // so that it keeps appearing until they activate it.
  };

  if (!show || Notification.permission === 'denied') return null;

  if (granted) {
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in pointer-events-none">
        <div className="bg-emerald-50/90 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 px-5 py-3.5 rounded-full flex items-center gap-3 shadow-[0_8px_30px_rgba(16,185,129,0.2)] backdrop-blur-xl">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold">تم تفعيل الإشعارات بنجاح!</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[9998] animate-fade-in" onClick={handleDismiss} />
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[calc(100%-2rem)] max-w-[420px] animate-scale-up">
        {/* Main Card */}
        <div className="bg-white/95 dark:bg-[#1c1f2b]/95 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/5 relative overflow-hidden">
          
          {/* Decorative gradients */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-400/20 rounded-full blur-3xl" />

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            title="إغلاق"
            className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center relative z-10 pt-2">
            {/* Icon Container with pulsing effect */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] blur-xl opacity-40 animate-pulse" />
              <div className="relative w-20 h-20 rounded-[2rem] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200/50 dark:border-amber-500/20 flex items-center justify-center shadow-inner">
                <BellRing className="w-10 h-10 text-orange-500 dark:text-amber-400 animate-wiggle" style={{ filter: 'drop-shadow(0 4px 6px rgba(249, 115, 22, 0.2))' }} />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-pulse delay-75" />
              </div>
            </div>

            <h3 className="font-extrabold text-2xl text-slate-800 dark:text-white mb-3">مرحباً!</h3>
            <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed mb-8 px-2">
              تفعيل الإشعارات لتلقي ملخص يومي الأربعاء عند إضافة مواعيد جديدة أو تغيير حالتها.
            </p>

            {/* Action Buttons */}
            <div className="w-full space-y-3">
              <button
                onClick={handleRequest}
                className="group relative w-full bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 font-bold py-4 rounded-xl text-base shadow-xl shadow-slate-900/20 dark:shadow-white/10 transition-all active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                <span className="relative z-10">تفعيل الإشعارات</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="w-full py-3 text-[14px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                ربما لاحقاً
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-up {
          0% { transform: translate(-50%, -45%) scale(0.95); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-scale-up {
          animation: scale-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
