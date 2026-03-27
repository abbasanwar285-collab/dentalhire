import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 text-center" dir="rtl">
                    <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-md w-full shadow-2xl">
                        <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="text-red-500 w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">حدث خطأ غير متوقع</h1>
                        <p className="text-gray-400 mb-6 text-sm">
                            نعتذر عن هذا الخلل. يرجى تحديث الصفحة أو المحاولة لاحقاً.
                        </p>

                        <div className="bg-gray-900 p-4 rounded-xl text-left mb-6 overflow-auto max-h-40 border border-gray-700">
                            <code className="text-red-400 text-xs font-mono break-all">
                                {this.state.error?.message || 'Unknown Error'}
                            </code>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="bg-violet-600 text-white px-6 py-3 rounded-xl font-bold w-full hover:bg-violet-700 transition flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} />
                            تحديث الصفحة
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
