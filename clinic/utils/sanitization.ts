/**
 * Input Sanitization Utilities
 * Prevents XSS and SQL injection attacks
 */

/**
 * Sanitizes HTML content to prevent XSS
 */
export const sanitizeHtml = (input: string): string => {
  if (!input) {
return '';
}
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Sanitizes patient name (allows Arabic, English, numbers, spaces)
 */
export const sanitizePatientName = (name: string): string => {
  if (!name) {
return '';
}
  
  // Allow Arabic letters, English letters, numbers, and spaces
  return name
    .replace(/[^\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s]/g, '')
    .trim();
};

/**
 * Sanitizes phone number (digits only)
 */
export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone) {
return '';
}
  
  return phone.replace(/[^0-9]/g, '').trim();
};

/**
 * Sanitizes notes field (allows text, numbers, and basic punctuation)
 */
export const sanitizeNotes = (notes: string): string => {
  if (!notes) {
return '';
}
  
  // Allow Arabic, English, numbers, and common punctuation
  return notes
    .replace(/[^\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s.,!?;:'"()[\]{}\-@#$%&*+/=]/g, '')
    .trim();
};

/**
 * Validates and sanitizes email
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) {
return '';
}
  
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
};

/**
 * Validates Iraqi phone number format
 */
export const isValidIraqiPhone = (phone: string): boolean => {
  const cleaned = sanitizePhoneNumber(phone);
  return /^07[0-9]{9}$/.test(cleaned);
};

/**
 * Validates date format (YYYY-MM-DD)
 */
export const isValidDate = (date: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) {
return false;
}
  
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Validates time format (HH:mm)
 */
export const isValidTime = (time: string): boolean => {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(time);
};

/**
 * Sanitizes numeric input
 */
export const sanitizeNumber = (value: unknown, defaultValue = 0): number => {
  if (typeof value === 'number') {
return value;
}
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

/**
 * Truncates string to max length
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (!str || str.length <= maxLength) {
return str;
}
  return str.substring(0, maxLength) + '...';
};

/**
 * Removes all HTML tags from string
 */
export const stripHtml = (html: string): string => {
  if (!html) {
return '';
}
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Deep sanitizes an object
 */
export const deepSanitize = <T extends Record<string, unknown>>(obj: T): T => {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Sanitize based on field name
      if (key.includes('name')) {
        result[key] = sanitizePatientName(value);
      } else if (key.includes('phone') || key.includes('mobile')) {
        result[key] = sanitizePhoneNumber(value);
      } else if (key.includes('notes') || key.includes('description')) {
        result[key] = sanitizeNotes(value);
      } else if (key.includes('email')) {
        result[key] = sanitizeEmail(value);
      } else {
        result[key] = sanitizeHtml(value);
      }
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'string' ? sanitizeHtml(item) : item
      );
    } else if (value && typeof value === 'object') {
      result[key] = deepSanitize(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
};
