// ============================================
// DentalHire - Logger Utility
// ============================================

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LoggerConfig {
    isDevelopment: boolean;
    enableProduction: boolean;
}

const config: LoggerConfig = {
    isDevelopment: process.env.NODE_ENV === 'development',
    enableProduction: false, // Set to true to enable logging in production
};

class Logger {
    private shouldLog(level: LogLevel): boolean {
        // Always log errors
        if (level === 'error') return true;

        // In development, log everything
        if (config.isDevelopment) return true;

        // In production, only log if explicitly enabled
        return config.enableProduction;
    }

    log(...args: any[]): void {
        if (this.shouldLog('log')) {
            console.log('[APP]', ...args);
        }
    }

    info(...args: any[]): void {
        if (this.shouldLog('info')) {
            console.info('[INFO]', ...args);
        }
    }

    warn(...args: any[]): void {
        if (this.shouldLog('warn')) {
            console.warn('[WARN]', ...args);
        }
    }

    error(...args: any[]): void {
        if (this.shouldLog('error')) {
            console.error('[ERROR]', ...args);
            // TODO: Send to monitoring service (Sentry, LogRocket, etc.)
            // this.sendToMonitoring('error', args);
        }
    }

    debug(...args: any[]): void {
        if (this.shouldLog('debug')) {
            console.debug('[DEBUG]', ...args);
        }
    }

    // Helper method for logging with context
    withContext(context: string) {
        return {
            log: (...args: any[]) => this.log(`[${context}]`, ...args),
            info: (...args: any[]) => this.info(`[${context}]`, ...args),
            warn: (...args: any[]) => this.warn(`[${context}]`, ...args),
            error: (...args: any[]) => this.error(`[${context}]`, ...args),
            debug: (...args: any[]) => this.debug(`[${context}]`, ...args),
        };
    }

    // Future: Send to monitoring service
    private sendToMonitoring(level: string, data: any[]): void {
        // Implementation for Sentry, LogRocket, etc.
        // Example:
        // if (typeof window !== 'undefined' && window.Sentry) {
        //   window.Sentry.captureMessage(data.join(' '), level);
        // }
    }
}

// Export singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;
