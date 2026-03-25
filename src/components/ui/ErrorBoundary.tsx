import React, { ReactNode, useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Calendar, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setHasError(true);
      setError(event.error?.stack || event.error?.message || event.message || 'Unknown Error');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setHasError(true);
      setError(event.reason?.stack || event.reason?.message || String(event.reason) || 'Promise Rejection');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleReset = () => {
    setHasError(false);
    window.location.reload();
  };

  const handleGoHome = () => {
    setHasError(false);
    window.location.href = '/dashboard';
  };

  if (hasError) {
    return (
      <div className="min-h-screen bg-apple-bg flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="w-20 h-20 bg-[#FF3B30]/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-[#FF3B30]" />
        </div>
        <h1 className="text-[24px] font-bold text-apple-text mb-2">حدث خطأ غير متوقع</h1>
        <p className="text-[15px] text-apple-text-secondary mb-8 max-w-[300px]">
          نعتذر عن الإزعاج. يرجى إعادة تحميل الصفحة أو العودة للرئيسية.
          {error && (
            <span className="block mt-4 p-2 bg-red-500/10 text-red-500 rounded text-xs text-left overflow-auto max-h-[150px]" dir="ltr">
              {error.toString()}
            </span>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 bg-[#0071E3] text-white rounded-full font-semibold active:scale-[0.98] transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة تحميل
          </button>
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-5 py-3 bg-apple-card text-apple-text rounded-full font-semibold border border-apple-separator active:scale-[0.98] transition-all"
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default ErrorBoundary;
