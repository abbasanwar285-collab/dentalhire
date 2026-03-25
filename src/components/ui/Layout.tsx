import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  floatingAction?: ReactNode;
  headerAction?: ReactNode;
}

export function Layout({ children, title, subtitle, floatingAction, headerAction }: LayoutProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex flex-col font-sans text-right overflow-hidden transition-colors duration-300" dir="rtl">
      {title && (
        <header className="pt-safe shrink-0 z-40 glass border-b border-slate-200/60 transition-colors duration-300 relative">
          <div className="px-5 pt-5 pb-3">
            {headerAction && (
              <div className="absolute top-5 left-5 z-50">
                {headerAction}
              </div>
            )}
            {subtitle && (
              <p className="text-xs font-medium text-teal-600 mb-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse-soft" />
                {subtitle}
              </p>
            )}
            <h1 className="text-2xl leading-tight font-bold text-slate-800 tracking-tight">{title}</h1>
          </div>
        </header>
      )}
      <main className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar pb-28 overscroll-y-none">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="px-4 pt-4 min-h-full"
        >
          {children}
        </motion.div>
      </main>

      {floatingAction}
    </div>
  );
}
