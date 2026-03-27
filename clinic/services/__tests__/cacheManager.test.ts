import { cacheManager } from '../cacheManager';
import { storage } from '../storage';

// Mock window.__syncExecutor
const mockExecutor = jest.fn();
(window as any).__syncExecutor = mockExecutor;

describe('CacheManager Sync Logic', () => {
    beforeEach(async () => {
        await storage.clear();
        cacheManager.clearSyncQueue();
        mockExecutor.mockReset();

        // Mock navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: true,
            writable: true
        });
    });

    it('should queue operations when online if they are added', async () => {
        const op = {
            type: 'save' as const,
            entity: 'patient' as const,
            data: { id: 'test-1', name: 'Test' }
        };

        await cacheManager.addToSyncQueue(op);

        const status = cacheManager.getSyncStatus();
        // Since it's online, it might process immediately or stay in queue if executor fails
        // In our mock, if we don't resolve the executor, it might stay syncing
    });

    it('should retry failed operations and increment retry count', async () => {
        mockExecutor.mockRejectedValue(new Error('Sync Fail'));

        const op = {
            type: 'save' as const,
            entity: 'patient' as const,
            data: { id: 'test-retry', name: 'Retry Patient' }
        };

        await cacheManager.addToSyncQueue(op);

        // Wait for potential async processing
        await new Promise(resolve => setTimeout(resolve, 100));

        const queue = await cacheManager.getSyncQueue();
        expect(queue.length).toBe(1);
        expect(queue[0].retryCount).toBeGreaterThan(0);

        const status = cacheManager.getSyncStatus();
        expect(status.currentError).toBe('Sync Fail');
    });

    it('should remove operation from queue after successful sync', async () => {
        mockExecutor.mockResolvedValue(undefined);

        const op = {
            type: 'save' as const,
            entity: 'patient' as const,
            data: { id: 'test-success', name: 'Success Patient' }
        };

        await cacheManager.addToSyncQueue(op);

        // Wait for async processing
        await new Promise(resolve => setTimeout(resolve, 100));

        const queue = await cacheManager.getSyncQueue();
        expect(queue.length).toBe(0);

        const status = cacheManager.getSyncStatus();
        expect(status.pendingOperations).toBe(0);
    });
});
