import { useState, useEffect } from 'react';
import { BellRing, Sparkles, ShieldCheck } from 'lucide-react';
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
      }, 2000); 
      
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

  if (!show || Notification.permission === 'denied') return null;

  if (granted) {
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in pointer-events-none w-max">
        <div className="bg-emerald-50/90 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 px-5 py-3.5 rounded-full flex items-center gap-3 shadow-[0_8px_30px_rgba(16,185,129,0.2)] backdrop-blur-xl">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold">تم تفعيل الإشعارات بنجاح!</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9998] animate-fade-in pointer-events-auto" />
      
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none w-full h-full">
        {/* Main Card */}
        <div className="bg-white dark:bg-[#1c1f2b] p-6 sm:p-8 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-white/5 relative overflow-hidden w-full max-w-[400px] pointer-events-auto animate-scale-up">
          
          {/* Decorative gradients */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center text-center relative z-10 pt-2">
            {/* Icon Container with pulsing effect */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] blur-xl opacity-40 animate-pulse" />
              <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200/50 dark:border-amber-500/20 flex items-center justify-center shadow-inner">
                <BellRing className="w-12 h-12 text-orange-500 dark:text-amber-400 animate-wiggle" style={{ filter: 'drop-shadow(0 4px 6px rgba(249, 115, 22, 0.2))' }} />
                <Sparkles className="absolute -top-2 -right-2 w-7 h-7 text-amber-400 animate-pulse delay-75" />
              </div>
            </div>

            <h3 className="font-extrabold text-[22px] text-slate-800 dark:text-white mb-3 tracking-tight">تفعيل إشعارات العيادة</h3>
            <p className="text-[14px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8 px-2">
              لإبقائك على اطلاع دائم بآخر التحديثات والتذكيرات المهمة (كالمواعيد الجديدة)، يرجى تفعيل الإشعارات للاستمرار في استخدام النظام.
            </p>

            {/* Action Buttons */}
            <div className="w-full">
              <button
                onClick={handleRequest}
                className="group relative w-full bg-gradient-to-l from-orange-600 to-amber-500 text-white font-bold py-4 rounded-xl text-[16px] shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                <span className="relative z-10">الاستمرار وتفعيل الإشعارات</span>
              </button>
            </div>
            {/* Omitted "Maybe later" to make flow strictly mandatory */}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-up {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
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
          animation: scale-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
