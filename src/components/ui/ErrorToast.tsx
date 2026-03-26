import { useEffect, useState } from 'react';
import { AlertCircle, X, WifiOff, RefreshCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { haptic } from '../../lib/haptics';

interface ErrorToastProps {
  message: string | null;
  onClear: () => void;
}

export function ErrorToast({ message, onClear }: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      haptic.error();
      
      // Auto-clear after 6 seconds if it's not a connection error
      const isConnectionError = message.includes('الاتصال');
      if (!isConnectionError) {
        const timer = setTimeout(() => {
          handleClose();
        }, 6000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [message]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClear, 300); // Wait for animation to finish
  };

  if (!message && !isVisible) return null;

  const isConnectionError = message?.includes('الاتصال');

  return (
    <div 
      className={cn(
        "fixed bottom-24 left-4 right-4 z-[100] transition-all duration-500 transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
      )}
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl shadow-[0_10px_40px_-10px_rgba(239,68,68,0.3)] border p-4 backdrop-blur-xl",
        isConnectionError 
          ? "bg-amber-50/90 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800/50" 
          : "bg-red-50/90 dark:bg-red-900/40 border-red-200 dark:border-red-800/50"
      )}>
        {/* Decorative background pulse */}
        <div className={cn(
          "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 animate-pulse",
          isConnectionError ? "bg-amber-400" : "bg-red-400"
        )} />

        <div className="flex items-start gap-3 relative z-10">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            isConnectionError ? "bg-amber-100 dark:bg-amber-800" : "bg-red-100 dark:bg-red-800"
          )}>
            {isConnectionError ? (
              <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
          </div>

          <div className="flex-1 pt-0.5">
            <h4 className={cn(
              "text-sm font-extrabold mb-1",
              isConnectionError ? "text-amber-900 dark:text-amber-100" : "text-red-900 dark:text-red-100"
            )}>
              {isConnectionError ? 'مشكلة في المزامنة' : 'خطأ في العملية'}
            </h4>
            <p className={cn(
              "text-[13px] leading-relaxed",
              isConnectionError ? "text-amber-800/80 dark:text-amber-200/80" : "text-red-800/80 dark:text-red-200/80"
            )}>
              {message}
            </p>
            
            {isConnectionError && (
              <button 
                onClick={() => window.location.reload()}
                className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-100 bg-amber-200/50 dark:bg-amber-700/50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                إعادة المحاولة
              </button>
            )}
          </div>

          <button 
            onClick={handleClose}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              isConnectionError 
                ? "text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800" 
                : "text-red-400 hover:bg-red-100 dark:hover:bg-red-800"
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
