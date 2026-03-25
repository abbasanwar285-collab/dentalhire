/**
 * Generates a cryptographically secure unique ID
 * Uses crypto API for secure random values
 * @returns A unique string ID
 */
export function generateId(): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  const timestamp = Date.now().toString(36);
  const randomPart = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${timestamp}-${randomPart}`;
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

export function parseJSON<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString || jsonString === 'undefined' || jsonString === 'null') return fallback;
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed === null && fallback !== null) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function formatCurrency(amount: number, currency = 'د.ع'): string {
  return new Intl.NumberFormat('ar-IQ', {
    maximumFractionDigits: 0,
  }).format(amount) + ' ' + currency;
}

/**
 * Validates phone number format (supports Iraqi and Saudi formats)
 * Iraqi: 07xxxxxxxxx, +9647xxxxxxxxx
 * Saudi: 05xxxxxxxxx
 * @param phone - Phone number to validate
 * @returns boolean indicating if phone is valid
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const iraqiPhoneRegex = /^(\+?964|0)?7[0-9]{9}$/;
  const saudiPhoneRegex = /^05\d{8}$/;
  return iraqiPhoneRegex.test(cleanPhone) || saudiPhoneRegex.test(cleanPhone);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
