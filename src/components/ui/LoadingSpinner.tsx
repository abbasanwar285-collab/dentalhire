import { Loader2 } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-apple-bg flex items-center justify-center transition-colors duration-300">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#0071E3] animate-spin" />
        <p className="text-[15px] text-apple-text-secondary">جاري التحميل...</p>
      </div>
    </div>
  );
}
