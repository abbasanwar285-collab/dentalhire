
const DB_NAME = 'DentalManagerDB';
const DB_VERSION = 1;
const STORE_NAME = 'DataStore';

/**
 * Storage Service (IndexedDB Wrapper)
 * Replaces localStorage for large datasets to avoid QuotaExceededError
 */
class StorageService {
    private dbPromise: Promise<IDBDatabase> | null = null;

    constructor() {
        this.initDB();
    }

    private initDB(): Promise<IDBDatabase> {
        if (this.dbPromise) {
            return this.dbPromise;
        }

        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (_event) => {
                console.error('[Storage] IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = (_event) => {
                resolve(request.result);
            };

            request.onupgradeneeded = (_event) => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });

        return this.dbPromise;
    }

    async getItem<T>(key: string): Promise<T | null> {
        try {
            const db = await this.initDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);

                request.onsuccess = () => {
                    resolve(request.result as T || null);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error(`[Storage] Error reading ${key}:`, error);
            // Fallback to localStorage if IndexedDB fails completely? 
            // Better to return null to avoid mixed sources
            return null;
        }
    }

    async setItem<T>(key: string, data: T): Promise<void> {
        try {
            const db = await this.initDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(data, key);

                request.onsuccess = () => {
                    resolve();
                };

                request.onerror = () => {
                    console.error(`[Storage] Error writing ${key}:`, request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error(`[Storage] Critical error writing ${key}:`, error);
            throw error;
        }
    }

    async removeItem(key: string): Promise<void> {
        try {
            const db = await this.initDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(key);

                request.onsuccess = () => {
                    resolve();
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error(`[Storage] Error removing ${key}:`, error);
        }
    }

    async clear(): Promise<void> {
        try {
            const db = await this.initDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('[Storage] Error clearing DB:', error);
        }
    }
}

export const storage = new StorageService();
