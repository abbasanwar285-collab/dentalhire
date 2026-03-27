import React from 'react';
import { useSyncStatus, useManualSync } from '../hooks/useSync';

export function SyncStatus() {
    const status = useSyncStatus();
    const { triggerSync, clearQueue, isSyncing, error } = useManualSync();

    // Don't show anything if everything is synced and online
    if (status.pendingOperations === 0 && status.isOnline && !status.isSyncing && !error) {
        return null;
    }

    const getStatusIcon = () => {
        if (!status.isOnline) {
            return '📡';
        }
        if (status.isSyncing || isSyncing) {
            return '🔄';
        }
        if (status.pendingOperations > 0) {
            return '⚠️';
        }
        if (error || status.lastError) {
            return '❌';
        }
        return '✅';
    };

    const getStatusText = () => {
        if (!status.isOnline) {
            return 'غير متصل';
        }
        if (status.isSyncing || isSyncing) {
            return 'جاري المزامنة...';
        }
        if (status.pendingOperations > 0) {
            return `${status.pendingOperations} عملية في الانتظار`;
        }
        if (error) {
            return error;
        }
        if (status.lastError) {
            return status.lastError;
        }
        return 'متزامن';
    };

    const getStatusColor = () => {
        if (!status.isOnline) {
            return 'bg-gray-100 border-gray-300 text-gray-700';
        }
        if (status.isSyncing || isSyncing) {
            return 'bg-blue-50 border-blue-300 text-blue-700';
        }
        if (status.pendingOperations > 0) {
            return 'bg-yellow-50 border-yellow-300 text-yellow-700';
        }
        if (error || status.lastError) {
            return 'bg-red-50 border-red-300 text-red-700';
        }
        return 'bg-green-50 border-green-300 text-green-700';
    };

    return (
        <div className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg border-2 shadow-lg backdrop-blur-sm ${getStatusColor()}`}>
            <span className="text-lg animate-pulse">{getStatusIcon()}</span>
            <span className="text-sm font-medium">
                {getStatusText()}
                {status.pendingOperations > 0 && (
                    <span className="block text-[10px] opacity-80 mt-1">
                        {status.currentError ? `السبب: ${status.currentError}` : 'جاري التحضير...'}
                    </span>
                )}
            </span>

            {status.pendingOperations > 0 && status.isOnline && !status.isSyncing && (
                <button
                    onClick={triggerSync}
                    disabled={isSyncing}
                    className="mr-2 px-2 py-1 text-xs font-medium bg-white rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    إعادة المحاولة
                </button>
            )}

            {status.pendingOperations > 0 && (
                <button
                    onClick={clearQueue}
                    title="تجاهل العمليات المعلقة"
                    className="p-1 px-2 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                    تجاهل
                </button>
            )}
        </div>
    );
}
