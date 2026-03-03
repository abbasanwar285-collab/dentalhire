'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './index';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden text-center p-8">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
                            <AlertTriangle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">
                            We apologize for the inconvenience. The application encountered an unexpected error.
                        </p>

                        {this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg text-left overflow-auto max-h-32 text-xs text-red-600 dark:text-red-400 font-mono">
                                {this.state.error.message}
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={() => this.setState({ hasError: false })}
                                variant="outline"
                            >
                                Try Again
                            </Button>
                            <Button
                                onClick={this.handleReload}
                                leftIcon={<RefreshCw size={16} />}
                            >
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
