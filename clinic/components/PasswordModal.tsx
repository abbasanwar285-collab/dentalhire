import React, { useState } from 'react';
import { Lock, X, CheckCircle, AlertCircle } from 'lucide-react';

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Prevent scrolling when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) {
return null;
}

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '0005') {
            setError('');
            setPassword('');
            onSuccess();
        } else {
            setError('كلمة المرور غير صحيحة');
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-xl">
            <div className="bg-gray-800 rounded-3xl shadow-2xl w-[90%] max-w-xs border border-gray-700 p-6 relative sm:w-full">
                <button
                    onClick={onClose}
                    title="Close Modal"
                    className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center mb-4 ring-4 ring-violet-500/10">
                        <Lock size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white text-center">
                        محتوى محمي
                    </h3>
                    <p className="text-sm text-gray-400 text-center mt-1">
                        أدخل كلمة المرور للوصول إلى مرضى التقويم
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password" // Use password type usually, but user might want numbers only? sticking to password type for security.
                            inputMode="numeric" // Optimize mobile keyboard
                            pattern="[0-9]*"
                            maxLength={4}
                            autoFocus
                            value={password}
                            onChange={(e) => {
                                setError('');
                                setPassword(e.target.value);
                            }}
                            className="w-full text-center text-2xl tracking-[0.5em] font-bold p-3 rounded-xl border border-gray-600 focus:ring-2 focus:ring-violet-500 outline-none bg-gray-700/50 text-white placeholder-gray-600"
                            placeholder="••••"
                        />
                        {error && (
                            <div className="flex items-center justify-center gap-1.5 mt-2 text-rose-400 text-sm animate-pulse">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={18} />
                        تأكيد الدخول
                    </button>
                </form>
            </div>
        </div>
    );
};
