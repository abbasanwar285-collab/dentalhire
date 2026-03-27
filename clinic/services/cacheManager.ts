/**
 * Cache Manager Service
 * 
 * Provides advanced local storage caching with:
 * - Cache-first read strategy for instant responses
 * - Background sync with Supabase
 * - Offline operation queue
 * - Automatic retry on reconnection
 * - Sync status tracking
 * - Sync status tracking
 */

import { storage } from './storage';

export interface SyncOperation {
    id: string;
    type: 'save' | 'delete';
    entity: 'patient' | 'appointment' | 'expense' | 'inventory' | 'staff';
    data: any;
    timestamp: number;
    retryCount: number;
}

export interface SyncStatus {
    isSyncing: boolean;
    pendingOperations: number;
    lastSyncTime: number | null;
    lastError: string | null;
    isOnline: boolean;
    currentError?: string | null; // Added to show the specific error causing the pending state
}

class CacheManager {
    private syncQueue: SyncOperation[] = [];
    private syncStatus: SyncStatus = {
        isSyncing: false,
        pendingOperations: 0,
        lastSyncTime: null,
        lastError: null,
        currentError: null,
        isOnline: navigator.onLine
    };
    private listeners: Set<(status: SyncStatus) => void> = new Set();
    private syncInterval: number | null = null;

    constructor() {
        this.loadSyncQueue();
        this.setupOnlineListener();
        this.startAutoSync();
    }

    // ==================== CACHE OPERATIONS ====================

    /**
     * Get cached data by key
     */
    async getCachedData<T>(key: string): Promise<T | null> {
        try {
            return await storage.getItem<T>(key);
        } catch (error) {
            console.error(`[Cache] Error reading ${key}:`, error);
            return null;
        }
    }

    /**
     * Set cached data
     */
    async setCachedData<T>(key: string, data: T): Promise<void> {
        try {
            await storage.setItem(key, data);
            await this.setLastSyncTime(key, Date.now());
        } catch (error) {
            console.error(`[Cache] Error writing ${key}:`, error);
        }
    }

    /**
     * Get last sync time for a specific cache key
     */
    async getLastSyncTime(key: string): Promise<number | null> {
        const syncTimes = await this.getCachedData<Record<string, number>>('_sync_times') || {};
        return syncTimes[key] || null;
    }

    /**
     * Set last sync time for a specific cache key
     */
    private async setLastSyncTime(key: string, timestamp: number): Promise<void> {
        const syncTimes = await this.getCachedData<Record<string, number>>('_sync_times') || {};
        syncTimes[key] = timestamp;
        await storage.setItem('_sync_times', syncTimes);
    }

    /**
     * Clear old cache entries to free up space
     * (Deprecated with IndexedDB but kept for cleanup logic if needed)
     */
    private async clearOldCache(): Promise<void> {
        // IndexedDB handles much larger quotas, so aggressive clearing is less critical
        // but we can still implement it if needed.
    }

    // ==================== SYNC QUEUE OPERATIONS ====================

    /**
     * Add operation to sync queue
     */
    async addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
        const syncOp: SyncOperation = {
            ...operation,
            id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            retryCount: 0
        };

        this.syncQueue.push(syncOp);
        await this.saveSyncQueue();
        this.updateSyncStatus({ pendingOperations: this.syncQueue.length });

        // Try to process immediately if online
        if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
            this.processSyncQueue();
        }
    }

    /**
     * Load sync queue from storage
     */
    private async loadSyncQueue(): Promise<void> {
        const queue = await this.getCachedData<SyncOperation[]>('_sync_queue');
        if (queue) {
            this.syncQueue = queue;
            this.updateSyncStatus({ pendingOperations: this.syncQueue.length });
        }
    }

    /**
     * Save sync queue to storage
     */
    private async saveSyncQueue(): Promise<void> {
        await storage.setItem('_sync_queue', this.syncQueue);
    }

    /**
     * Process sync queue
     */
    /**
     * Process sync queue
     */
    async processSyncQueue(): Promise<void> {
        if (this.syncQueue.length === 0 || this.syncStatus.isSyncing || !this.syncStatus.isOnline) {
            return;
        }

        this.updateSyncStatus({ isSyncing: true, lastError: null, currentError: null });

        // Sort operations by priority to resolve dependencies (FK constraints)
        // Order: Patients -> Appointments -> Others
        const ENTITY_PRIORITY = {
            'patient': 1,
            'appointment': 2,
            'visit': 2, // Ortho visits
            'inventory': 3,
            'expense': 3,
            'staff': 4
        };

        const operations = [...this.syncQueue].sort((a, b) => {
            const pA = ENTITY_PRIORITY[a.entity as keyof typeof ENTITY_PRIORITY] || 99;
            const pB = ENTITY_PRIORITY[b.entity as keyof typeof ENTITY_PRIORITY] || 99;
            return pA - pB;
        });

        let latestError: string | null = null;
        let successCount = 0;

        for (const operation of operations) {
            try {
                // Double check online status before each operation
                if (!navigator.onLine) {
                    this.updateSyncStatus({ isOnline: false });
                    break;
                }

                await this.executeSyncOperation(operation);

                // Remove from queue on success
                this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
                successCount++;

                // SAVE IMMEDIATELY after each success to prevent data loss if app closes
                await this.saveSyncQueue();
                this.updateSyncStatus({ pendingOperations: this.syncQueue.length });

            } catch (error: any) {
                console.error(`[Sync] Failed to sync operation ${operation.id}:`, error);

                // Capture the error message
                latestError = error.message || 'Unknown Sync Error';

                // Differentiate common errors for better UI feedback
                if (latestError && latestError.includes('42501')) {
                    latestError = 'خطأ في الصلاحيات (RLS)';
                }
                if (latestError && latestError.includes('timeout')) {
                    latestError = 'انتهت مهلة الاتصال';
                }

                // Increment retry count
                operation.retryCount++;

                // Update the original queue with the new retry count
                const qIdx = this.syncQueue.findIndex(o => o.id === operation.id);
                if (qIdx !== -1) {
                    this.syncQueue[qIdx].retryCount = operation.retryCount;
                }

                // If retry count exceeds limit, remove from queue
                if (operation.retryCount >= 50) {
                    console.error(`[Sync] Operation ${operation.id} failed after 50 retries, removing from queue`);
                    this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
                    this.updateSyncStatus({ lastError: `فشلت عملية المزامنة بشكل نهائي: ${latestError}` });
                } else {
                    // Update currentError for UI
                    this.updateSyncStatus({ currentError: latestError });
                }

                // Save updated retry counts
                await this.saveSyncQueue();

                // Break loop on failure to avoid hitting the same error repeatedly
                // (e.g., if it's a network issue or RLS issue)
                break;
            }
        }

        this.updateSyncStatus({
            isSyncing: false,
            pendingOperations: this.syncQueue.length,
            lastSyncTime: successCount > 0 ? Date.now() : this.syncStatus.lastSyncTime
        });
    }

    /**
     * Execute a single sync operation
     * This will be implemented by the db service
     */
    private async executeSyncOperation(operation: SyncOperation): Promise<void> {
        // This is a placeholder - the actual implementation will be in db.ts
        // which will import this and set the executor function
        if ((window as any).__syncExecutor) {
            await (window as any).__syncExecutor(operation);
        } else {
            throw new Error('Sync executor not configured');
        }
    }

    /**
     * Clear sync queue (useful for testing or manual intervention)
     */
    clearSyncQueue(): void {
        this.syncQueue = [];
        this.saveSyncQueue();
        this.updateSyncStatus({ pendingOperations: 0 });
    }

    // ==================== ONLINE/OFFLINE HANDLING ====================

    /**
     * Setup online/offline event listeners
     */
    private setupOnlineListener(): void {
        window.addEventListener('online', () => {
            console.log('[Cache] Connection restored, processing sync queue...');
            this.updateSyncStatus({ isOnline: true });
            this.processSyncQueue();
        });

        window.addEventListener('offline', () => {
            console.log('[Cache] Connection lost, operations will be queued');
            this.updateSyncStatus({ isOnline: false });
        });
    }

    /**
     * Start automatic sync interval
     */
    private startAutoSync(): void {
        // BANDWIDTH OPTIMIZATION: Changed to 30 seconds for faster updates
        // Only syncs pending operations, not full data refresh
        this.syncInterval = window.setInterval(() => {
            if (this.syncQueue.length > 0 && this.syncStatus.isOnline) {
                this.processSyncQueue();
            }
        }, 30000); // 30 seconds
    }

    /**
     * Stop automatic sync
     */
    stopAutoSync(): void {
        if (this.syncInterval !== null) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    // ==================== STATUS & LISTENERS ====================

    /**
     * Get current sync status
     */
    getSyncStatus(): SyncStatus {
        return { ...this.syncStatus };
    }

    /**
     * Update sync status and notify listeners
     */
    private updateSyncStatus(updates: Partial<SyncStatus>): void {
        this.syncStatus = { ...this.syncStatus, ...updates };
        this.notifyListeners();
    }

    /**
     * Subscribe to sync status changes
     */
    subscribe(listener: (status: SyncStatus) => void): () => void {
        this.listeners.add(listener);
        // Immediately call with current status
        listener(this.getSyncStatus());

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Clear the sync queue, optionally filtered by entity
     */
    clearQueue(entity?: string): void {
        if (entity) {
            this.syncQueue = this.syncQueue.filter(op => op.entity !== entity);
        } else {
            this.syncQueue = [];
        }
        this.saveSyncQueue();
        this.notifyListeners();
    }

    /**
     * Notify all listeners of status change
     */
    private notifyListeners(): void {
        const status = this.getSyncStatus();
        this.listeners.forEach(listener => {
            try {
                listener(status);
            } catch (error) {
                console.error('[Cache] Error in status listener:', error);
            }
        });
    }

    /**
     * Check if there are pending sync operations
     */
    isSyncPending(): boolean {
        return this.syncQueue.length > 0;
    }

    /**
     * Get the current sync queue (synchronous)
     */
    async getSyncQueue(): Promise<SyncOperation[]> {
        return [...this.syncQueue];
    }


    /**
     * Force sync now (manual trigger)
     */
    async forceSyncNow(): Promise<void> {
        if (!this.syncStatus.isOnline) {
            throw new Error('لا يوجد اتصال بالإنترنت');
        }
        await this.processSyncQueue();
    }
}

// Export singleton instance
export const cacheManager = new CacheManager();
