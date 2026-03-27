import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (type: ToastType, message: string, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, message: string, duration = 5000) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const newToast: Toast = { id, type, message, duration };

        setToasts(prev => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({
    toasts,
    removeToast
}) => {
    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-md px-4">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const config = {
        success: {
            icon: CheckCircle2,
            className: 'bg-emerald-500/90 border-emerald-400',
            iconColor: 'text-white'
        },
        error: {
            icon: XCircle,
            className: 'bg-rose-500/90 border-rose-400',
            iconColor: 'text-white'
        },
        warning: {
            icon: AlertCircle,
            className: 'bg-amber-500/90 border-amber-400',
            iconColor: 'text-white'
        },
        info: {
            icon: Info,
            className: 'bg-blue-500/90 border-blue-400',
            iconColor: 'text-white'
        }
    };

    const { icon: Icon, className, iconColor } = config[toast.type];

    return (
        <div
            className={`${className} backdrop-blur-md border rounded-2xl p-4 shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2 fade-in`}
            role="alert"
            aria-live="assertive"
        >
            <Icon size={24} className={iconColor} />
            <p className="flex-1 text-white font-bold text-sm">{toast.message}</p>
            <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition"
                aria-label="إغلاق الإشعار"
            >
                <X size={18} />
            </button>
        </div>
    );
};

// Helper functions for easy use
export const toast = {
    success: (message: string, _duration?: number) => {
        // This will be replaced by actual implementation through context
        console.log('[Toast Success]:', message);
    },
    error: (message: string, _duration?: number) => {
        console.log('[Toast Error]:', message);
    },
    warning: (message: string, _duration?: number) => {
        console.log('[Toast Warning]:', message);
    },
    info: (message: string, _duration?: number) => {
        console.log('[Toast Info]:', message);
    }
};
