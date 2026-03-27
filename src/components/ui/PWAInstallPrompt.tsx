import { useState, useEffect, useCallback } from 'react';
import { Download, Smartphone, Info, Compass, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // Default true to avoid flash
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if installed
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone === true
        || document.referrer.includes('android-app://');
      setIsStandalone(standalone);
      if (!standalone) {
        setShowPrompt(true);
      }
    };
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    // Detect OS & Browser
    const ua = window.navigator.userAgent.toLowerCase();
    const isMacLike = /macintosh|mac os x/i.test(ua);
    const isIpadOS = isMacLike && navigator.maxTouchPoints && navigator.maxTouchPoints > 2;
    const iosDevice = (/ipad|iphone|ipod/.test(ua) || isIpadOS) && !(window as any).MSStream;
    setIsIOS(iosDevice);
    
    // Detect In-App Browsers
    const telegram = /telegram/i.test(ua);
    const inAppStr = ['fbav', 'instagram', 'line', 'snapchat', 'micromessenger', 'twitter'];
    const inAppRegex = new RegExp(inAppStr.join('|'), 'i');
    
    // iOS Safari WebViews often don't contain 'safari', but real Safari does
    const isIOSWebView = iosDevice && !/safari/i.test(ua) && !/crios/i.test(ua) && !/fxios/i.test(ua);
    
    setIsInAppBrowser(inAppRegex.test(ua) || telegram || isIOSWebView);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        // Assume installed, usually triggers display-mode media query
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  if (isStandalone || !showPrompt) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9998] bg-slate-900/60 backdrop-blur-md animate-fade-in transition-all" />
      
      <div className="fixed inset-0 z-[9999] p-4 flex items-center justify-center pointer-events-none">
        <div className="bg-white dark:bg-[#1c1f2b] w-full max-w-[400px] rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.2)] overflow-hidden pointer-events-auto flex flex-col animate-scale-in border border-slate-100 dark:border-white/5">
          
          <div className="p-6 pt-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30 mb-5 ring-4 ring-white dark:ring-[#1c1f2b] overflow-hidden">
              <img src="https://cdn-icons-png.flaticon.com/128/3467/3467831.png" alt="App Icon" className="w-12 h-12 object-contain" />
            </div>
            
            <h2 className="text-[22px] font-black text-slate-800 dark:text-white mb-2 tracking-tight">إلزامية تثبيت التطبيق</h2>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed">
              لضمان أفضل أداء وأمان وحفظ للبيانات، يرجى تثبيت التطبيق على جهازك. لا يمكن استخدام النظام عبر المتصفح العادي.
            </p>

            <div className="w-full text-right">
              {isInAppBrowser ? (
                // In-App Browser Instructions (Telegram, FB, etc)
                <div className="bg-purple-50/80 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-2xl p-4">
                  <p className="text-[13px] font-bold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    أنت تتصفح من خلال تطبيق تليجرام أو تطبيق آخر
                  </p>
                  <p className="text-[12px] font-bold text-purple-700 dark:text-purple-400 mb-3">
                    لإكمال تثبيت عيادة آيرس، يجب فتح الرابط في المتصفح الأساسي أولاً:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5 text-[13px] text-purple-800 dark:text-purple-200/90 font-medium">
                      <span className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800/50 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">1</span>
                      <span className="leading-snug">
                        {isIOS ? 'اضغط على علامة المتصفح (البوصلة)' : 'اضغط على قائمة الخيارات المتمثلة بثلاث نقاط '}
                        <span className="inline-flex items-center justify-center bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-purple-200 dark:border-purple-700 mx-1 shadow-sm">
                          {isIOS ? <Compass className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /> : <MoreVertical className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
                        </span>
                        {isIOS ? 'في الزاوية لفتح الرابط في متصفح سفاري (Safari)' : 'في أعلى الشاشة واختر "فتح في متصفح Chrome"'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 text-[13px] text-purple-800 dark:text-purple-200/90 font-medium">
                      <span className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800/50 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">2</span>
                      <span className="leading-snug">
                        {isIOS ? 'بمجرد فتح سفاري، اضغط على زر المشاركة ثم "إضافة للصفحة الرئيسية"' : 'بمجرد فتح Chrome، ستظهر لك رسالة تثبيت التطبيق تلقائياً أو من القائمة الجانبية'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : isIOS ? (
                // Standard iOS Safari
                <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-2xl p-4">
                  <p className="text-[14px] font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-1.5">
                    <Smartphone className="w-4.5 h-4.5" />
                    لتثبيت التطبيق على جهازك (آيفون/آيباد):
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5 text-[14px] text-blue-800 dark:text-blue-200/90 font-medium">
                      <span className="w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800/50 flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5">1</span>
                      <span className="leading-snug">انقر على أيقونة المشاركة (Share) في المتصفح <span className="text-[16px] mx-1 inline-block -translate-y-0.5 shadow-sm">⬆️</span></span>
                    </div>
                    <div className="flex items-start gap-2.5 text-[14px] text-blue-800 dark:text-blue-200/90 font-medium">
                      <span className="w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800/50 flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5">2</span>
                      <span className="leading-snug">اسحب لأسفل ضمن الخيارات، واختر <strong>"الإضافة للصفحة الرئيسية"</strong> (Add to Home Screen)</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-[14px] text-blue-800 dark:text-blue-200/90 font-medium opacity-80 mt-1">
                      <span className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5"></span>
                      <span className="leading-snug text-xs flex items-center gap-1"><Info className="w-3.5 h-3.5" /> ثم اضغط <strong>إضافة</strong> (Add) في الزاوية العليا</span>
                    </div>
                  </div>
                </div>
              ) : deferredPrompt ? (
                // Android & Desktop (Chrome, Edge etc) Auto-Install
                <button
                  onClick={handleInstall}
                  className="w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2.5 shadow-xl shadow-teal-500/30 active:scale-[0.97] transition-all bg-gradient-to-r from-teal-500 to-teal-600 text-white"
                >
                  <Download className="w-5 h-5" />
                  تثبيت التطبيق الآن
                </button>
              ) : (
                // Fallback for Android/General browsers without specific PWA handling
                <div className="bg-teal-50/80 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/30 rounded-2xl p-4">
                  <p className="text-[14px] font-bold text-teal-800 dark:text-teal-300 mb-3 flex items-center gap-1.5">
                    <Smartphone className="w-4.5 h-4.5" />
                    خطوات التثبيت اليدوية:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5 text-[14px] text-teal-800 dark:text-teal-200/90 font-medium">
                      <span className="w-6 h-6 rounded-full bg-teal-200 dark:bg-teal-800/50 flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5">1</span>
                      <span className="leading-snug">انقر على قائمة الخيارات السريعة للمتصفح <strong>(⋮) أو (≡)</strong></span>
                    </div>
                    <div className="flex items-start gap-2.5 text-[14px] text-teal-800 dark:text-teal-200/90 font-medium">
                      <span className="w-6 h-6 rounded-full bg-teal-200 dark:bg-teal-800/50 flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5">2</span>
                      <span className="leading-snug">اختر <strong>"إضافة إلى الشاشة الرئيسية"</strong> (Add to Home screen) أو <strong>"تثبيت التطبيق"</strong> (Install App)</span>
                    </div>
                  </div>
                  <p className="mt-4 flex items-start gap-1.5 text-[11px] font-bold text-teal-600 dark:text-teal-400">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ملاحظة: إذا لم يظهر زر التثبيت التلقائي، تأكد من أنك تستخدم متصفح Google Chrome الحديث.
                  </p>
                </div>
              )}
            </div>
            
            {/* FORCE INSTALLATION: Intentionally omitting any "Skip" button to ensure full compliance with 'an insistence on the issue until this app is installed'. */}
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
