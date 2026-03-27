import { useState, useEffect } from 'react';
import { cacheManager, SyncStatus } from '../services/cacheManager';

/**
 * Hook to get current sync status
 */
export function useSyncStatus(): SyncStatus {
    const [status, setStatus] = useState<SyncStatus>(cacheManager.getSyncStatus());

    useEffect(() => {
        const unsubscribe = cacheManager.subscribe(setStatus);
        return unsubscribe;
    }, []);

    return status;
}

/**
 * Hook to manually trigger sync
 */
export function useManualSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const triggerSync = async () => {
        setIsSyncing(true);
        setError(null);
        try {
            await cacheManager.forceSyncNow();
        } catch (err: any) {
            setError(err.message || 'فشلت المزامنة');
        } finally {
            setIsSyncing(false);
        }
    };

    const clearQueue = () => {
        cacheManager.clearSyncQueue();
    };

    return { triggerSync, clearQueue, isSyncing, error };
}

/**
 * Hook to monitor online status
 */
export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}
