/**
 * Secure Logger Service
 * Replaces console.log with environment-aware logging
 * Sanitizes sensitive data before logging
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_APP_MODE === 'development';

/**
 * Sanitizes sensitive data from log messages
 */
const sanitizeLogData = (data: unknown): unknown => {
  if (typeof data === 'string') {
    return data
      .replace(/eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, '[JWT_TOKEN]')
      .replace(/AIza[0-9A-Za-z_-]{35}/g, '[API_KEY]')
      .replace(/gsk_[a-zA-Z0-9]{40,}/g, '[API_KEY]')
      .replace(/https:\/\/[a-z0-9-]+\.supabase\.co/g, '[SUPABASE_URL]');
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive keys
      if (['password', 'token', 'secret', 'key', 'apiKey', 'serviceKey'].includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogData(value);
      }
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Logger interface
 */
interface Logger {
  debug: (message: string, ...data: unknown[]) => void;
  info: (message: string, ...data: unknown[]) => void;
  warn: (message: string, ...data: unknown[]) => void;
  error: (message: string, ...data: unknown[]) => void;
}

/**
 * Production-safe logger
 */
const createLogger = (): Logger => {
  const log = (level: string, message: string, ...data: unknown[]) => {
    if (!isDevelopment) {
      // In production, only log errors
      if (level !== 'ERROR') {
return;
}
    }
    
    const timestamp = new Date().toISOString();
    const sanitizedData = data.map(sanitizeLogData);
    
    // eslint-disable-next-line no-console
    console[level.toLowerCase() as 'log' | 'info' | 'warn' | 'error'](
      `[${timestamp}] [${level}] ${message}`,
      ...sanitizedData
    );
  };

  return {
    debug: (message: string, ...data: unknown[]) => log('DEBUG', message, ...data),
    info: (message: string, ...data: unknown[]) => log('INFO', message, ...data),
    warn: (message: string, ...data: unknown[]) => log('WARN', message, ...data),
    error: (message: string, ...data: unknown[]) => log('ERROR', message, ...data),
  };
};

export const logger = createLogger();
