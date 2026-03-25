import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2 } from 'lucide-react';
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

    // Don't show immediately on login, wait 3 seconds on dashboard
    if (Notification.permission === 'default' && location.pathname === '/dashboard') {
      const timer = setTimeout(() => {
        // Prevent showing if the user just dismissed it in this session
        if (!sessionStorage.getItem('notification_prompt_dismissed')) {
          setShow(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleRequest = async () => {
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        setGranted(true);
        setTimeout(() => setShow(false), 2000); // Show success indicator briefly
      } else {
        setShow(false);
        sessionStorage.setItem('notification_prompt_dismissed', 'true');
      }
    } catch (e) {
      console.error('Notification request failed', e);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('notification_prompt_dismissed', 'true');
  };

  if (!show || Notification.permission === 'denied') return null;

  if (granted) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in pointer-events-none">
        <div className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-emerald-500/10 backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-bold">تم تفعيل الإشعارات بنجاح!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 z-[9999] max-w-sm ml-auto animate-slide-down">
      <div className="bg-white dark:bg-[#1c1f2b] p-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 dark:border-white/5 relative flex gap-4">
        
        <button
          onClick={handleDismiss}
          title="إغلاق"
          className="absolute top-2 left-2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800/30">
          <Bell className="w-6 h-6 text-amber-500 dark:text-amber-400" />
        </div>

        <div className="flex-1 pt-1 ml-6">
          <h3 className="font-bold text-[15px] text-slate-800 dark:text-white mb-1">تنبيهات المواعيد</h3>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            فعّل الإشعارات لتلقي تنبيهات عند إضافة مواعيد جديدة أو تغيير حالتها.
          </p>
          <button
            onClick={handleRequest}
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-2.5 rounded-xl text-[13px] shadow-md shadow-slate-900/10 dark:shadow-white/10 transition-all active:scale-[0.98]"
          >
            تفعيل الإشعارات
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-down {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
