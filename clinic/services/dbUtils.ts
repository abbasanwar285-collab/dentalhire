/**
 * Database Utilities
 * Helper functions for database operations
 */

import { logger } from './logger';
import { RetryConfig, DEFAULT_RETRY_CONFIG } from './dbTypes';

/**
 * Executes a promise with timeout
 */
export const withTimeout = <T>(promise: PromiseLike<T>, ms: number = 10000): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), ms)
    )
  ]);
};

/**
 * Fetches data with retry logic
 */
export const fetchWithRetry = async <T>(
  operation: () => Promise<{ data: T | null; error: { message: string } | null }>,
  config: Partial<RetryConfig> = {}
): Promise<T | null> => {
  const { attempts, timeout, backoffMultiplier } = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  for (let i = 0; i < attempts; i++) {
    try {
      const { data, error } = await withTimeout(operation(), timeout);

      if (error) {
        throw new Error(error.message);
      }
      return data;
    } catch (err: unknown) {
      const isLastAttempt = i === attempts - 1;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.warn(`[DB] Attempt ${i + 1} failed: ${errorMessage}`);

      if (isLastAttempt) {
        throw err;
      }

      // Exponential backoff
      await new Promise(r => setTimeout(r, 1000 * Math.pow(backoffMultiplier, i)));
    }
  }
  return null;
};

/**
 * Generates a UUID
 */
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Gets local date string in YYYY-MM-DD format
 */
export const getLocalDateStr = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Gets current timestamp
 */
export const getTimestamp = (): number => Date.now();

/**
 * Mutex for synchronizing local database operations
 */
export class Mutex {
  private mutex = Promise.resolve();

  lock(): Promise<() => void> {
    let unlock: () => void = () => { };

    const willUnlock = new Promise<void>(resolve => {
      unlock = resolve;
    });

    const pending = this.mutex.then(() => unlock);
    this.mutex = this.mutex.then(() => willUnlock);

    return pending;
  }

  async dispatch<T>(fn: (() => T) | (() => PromiseLike<T>)): Promise<T> {
    const unlock = await this.lock();
    try {
      return await Promise.resolve(fn());
    } finally {
      unlock();
    }
  }
}

/**
 * Safely parses JSON
 */
export const safeJsonParse = <T>(json: string, defaultValue: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
};

/**
 * Safely stringifies JSON
 */
export const safeJsonStringify = (data: unknown): string | null => {
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
};

/**
 * Debounces a function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

/**
 * Validates a phone number (Iraqi format)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  return /^07[0-9]{9}$/.test(phone);
};

/**
 * Formats a phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return cleaned;
  }
  return '0' + cleaned;
};

/**
 * Calculates debt for a patient
 */
export const calculateDebt = (totalCost: number, paidAmount: number): number => {
  return Math.max(0, totalCost - paidAmount);
};

/**
 * Calculates profit margin
 */
export const calculateProfitMargin = (revenue: number, expenses: number): number => {
  if (revenue === 0) {
return 0;
}
  return ((revenue - expenses) / revenue) * 100;
};
