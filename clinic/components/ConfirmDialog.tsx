import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    type = 'warning',
    isLoading = false
}) => {
    if (!isOpen) {
return null;
}

    const typeConfig = {
        danger: {
            iconColor: 'text-rose-400',
            confirmBg: 'bg-rose-600 hover:bg-rose-700',
            borderColor: 'border-rose-500/30'
        },
        warning: {
            iconColor: 'text-amber-400',
            confirmBg: 'bg-amber-600 hover:bg-amber-700',
            borderColor: 'border-amber-500/30'
        },
        info: {
            iconColor: 'text-blue-400',
            confirmBg: 'bg-blue-600 hover:bg-blue-700',
            borderColor: 'border-blue-500/30'
        }
    };

    const config = typeConfig[type];

    const handleConfirm = () => {
        onConfirm();
        // Don't auto-close - let parent handle it after async operation completes
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={onClose}
        >
            <div
                className={`bg-gray-900 border ${config.borderColor} rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4`}
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-labelledby="dialog-title"
                aria-describedby="dialog-description"
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 text-gray-500 hover:text-gray-300 transition"
                    aria-label="إغلاق"
                    disabled={isLoading}
                >
                    <X size={24} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className={`bg-gray-800/50 rounded-full p-4 ${config.borderColor} border`}>
                        <AlertTriangle size={32} className={config.iconColor} />
                    </div>
                </div>

                {/* Title */}
                <h2
                    id="dialog-title"
                    className="text-xl font-bold text-white text-center mb-3"
                >
                    {title}
                </h2>

                {/* Message */}
                <p
                    id="dialog-description"
                    className="text-gray-400 text-center mb-6 text-sm leading-relaxed"
                >
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-2xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`flex-1 ${config.confirmBg} text-white py-3 rounded-2xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                جاري التنفيذ...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Hook for easy usage
export const useConfirmDialog = () => {
    const [dialogState, setDialogState] = React.useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void | Promise<void>;
        type?: 'danger' | 'warning' | 'info';
    } | null>(null);

    const [isLoading, setIsLoading] = React.useState(false);

    const confirm = React.useCallback((
        title: string,
        message: string,
        onConfirm: () => void | Promise<void>,
        type: 'danger' | 'warning' | 'info' = 'warning'
    ) => {
        setDialogState({ isOpen: true, title, message, onConfirm, type });
    }, []);

    const handleConfirm = React.useCallback(async () => {
        if (!dialogState) {
return;
}

        setIsLoading(true);
        try {
            await dialogState.onConfirm();
            setDialogState(null);
        } catch (error) {
            console.error('Confirmation action failed:', error);
            // Keep dialog open on error
        } finally {
            setIsLoading(false);
        }
    }, [dialogState]);

    const handleClose = React.useCallback(() => {
        if (!isLoading) {
            setDialogState(null);
        }
    }, [isLoading]);

    const dialog = dialogState ? (
        <ConfirmDialog
            isOpen={dialogState.isOpen}
            onClose={handleClose}
            onConfirm={handleConfirm}
            title={dialogState.title}
            message={dialogState.message}
            type={dialogState.type}
            isLoading={isLoading}
        />
    ) : null;

    return { confirm, dialog };
};
