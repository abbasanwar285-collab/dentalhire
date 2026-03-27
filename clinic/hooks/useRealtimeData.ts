import { useEffect, useState, useCallback } from 'react';
import { subscribeToDataChanges } from '../services/db';

/**
 * Hook للاشتراك في التحديثات اللحظية للبيانات
 * يعيد تحميل البيانات تلقائياً عند حدوث أي تغيير
 */
export function useRealtimeData<T>(
    entity: 'patients' | 'appointments' | 'expenses',
    fetchFunction: () => Promise<T>,
    dependencies: any[] = []
): { data: T | null; loading: boolean; refresh: () => void } {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const result = await fetchFunction();
            setData(result);
        } catch (error) {
            console.error(`[useRealtimeData] Error fetching ${entity}:`, error);
        } finally {
            setLoading(false);
        }
    }, [fetchFunction, entity]);

    useEffect(() => {
        // Initial load
        refresh();

        // Subscribe to realtime changes
        const unsubscribe = subscribeToDataChanges(entity, () => {
            console.log(`[useRealtimeData] Received update for ${entity}, refreshing...`);
            refresh();
        });

        return () => {
            unsubscribe();
        };
    }, [entity, refresh, ...dependencies]);

    return { data, loading, refresh };
}
