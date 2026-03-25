import { useState, useEffect, useCallback } from 'react';
import { X, Download, Smartphone, Info } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isLocalIP, setIsLocalIP] = useState(false);
  const [dismissedSession, setDismissedSession] = useState(false);

  useEffect(() => {
    // Check if installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect OS & Local IP
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    setIsIOS(isIOSDevice);
    
    const local = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.') || window.location.hostname.startsWith('10.');
    setIsLocalIP(local);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Aggressively show prompt on mobile if not installed AND not dismissed in THIS session
    if (!standalone && isMobileDevice && !dismissedSession) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 1000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissedSession]);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissedSession(true); // Will reset if user refreshes page (per request to keep appearing)
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998] bg-slate-900/40 backdrop-blur-sm animate-fade-in transition-all"
        onClick={handleDismiss}
      />
      
      {/* Centered Modal Card */}
      <div className="fixed inset-0 z-[9999] p-4 flex items-center justify-center pointer-events-none">
        
        <div className="bg-white dark:bg-[#1c1f2b] w-full max-w-[360px] rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden pointer-events-auto flex flex-col animate-scale-in border border-slate-100 dark:border-white/5 relative">
          
          <button
            onClick={handleDismiss}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10"
            title="إغلاق التنبيه"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 pt-8 flex flex-col items-center text-center">
            
            <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30 mb-5 ring-4 ring-white dark:ring-[#1c1f2b]">
              <span className="text-4xl shadow-sm">🦷</span>
            </div>
            
            <h2 className="text-[20px] font-black text-slate-800 dark:text-white mb-2 tracking-tight">تثبيت عيادة آيرس</h2>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium mb-6">
              قم بتثبيت التطبيق على هاتفك للحصول على تجربة سريعة تعمل بكامل الشاشة
            </p>

            <div className="w-full">
              {isIOS ? (
                // iOS Instructions
                <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-4 text-right">
                  <p className="text-[13px] font-bold text-blue-800 dark:text-blue-300 mb-2.5 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    للتثبيت على الآيفون:
                  </p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-[13px] text-blue-700 dark:text-blue-200/90 font-medium">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center text-[11px] font-bold shrink-0">1</span>
                      انقر على أيقونة المشاركة <span className="text-[15px] -mt-1 shadow-sm">⬆️</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[13px] text-blue-700 dark:text-blue-200/90 font-medium">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center text-[11px] font-bold shrink-0">2</span>
                      اختر <strong>"الإضافة للصفحة الرئيسية"</strong>
                    </div>
                  </div>
                </div>
              ) : deferredPrompt ? (
                // Android Auto-Install Button
                <button
                  onClick={handleInstall}
                  className="w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2.5 shadow-xl shadow-teal-500/30 active:scale-[0.97] transition-all bg-gradient-to-r from-teal-500 to-teal-600 text-white"
                >
                  <Download className="w-5 h-5" />
                  تثبيت التطبيق الآن
                </button>
              ) : (
                // Android Manual/Local Instructions
                <div className="bg-teal-50/80 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30 rounded-2xl p-4 text-right">
                  {isLocalIP ? (
                     <div className="mb-4 bg-amber-100/50 dark:bg-amber-900/30 p-3 rounded-xl border border-amber-200 dark:border-amber-700/50">
                        <p className="text-amber-800 dark:text-amber-300 text-[12px] font-bold flex items-start gap-1.5">
                           <Info className="w-4 h-4 shrink-0 mt-0.5" />
                           ملاحظة للمطور: زر التثبيت لا يظهر التلقائي بسبب تجربة التطبيق على Local IP (يحتاج HTTPS). يرجى استخدام القائمة:
                        </p>
                     </div>
                  ) : (
                     <p className="text-[13px] font-bold text-teal-800 dark:text-teal-300 mb-2.5 flex items-center gap-1.5">
                       <Smartphone className="w-4 h-4" />
                       لتثبيت التطبيق يدوياً:
                     </p>
                  )}
                  
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-[13px] text-teal-700 dark:text-teal-200/90 font-medium">
                      <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-800/50 flex items-center justify-center text-[11px] font-bold shrink-0">1</span>
                      انقر على قائمة المتصفح <strong>(⋮)</strong>
                    </div>
                    <div className="flex items-center gap-2.5 text-[13px] text-teal-700 dark:text-teal-200/90 font-medium">
                      <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-800/50 flex items-center justify-center text-[11px] font-bold shrink-0">2</span>
                      اختر <strong>"Add to Home screen"</strong>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleDismiss}
                className="w-full mt-4 py-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl text-[14px] font-bold transition-colors"
              >
                المتابعة في المتصفح
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}
