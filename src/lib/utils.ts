import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility for merging Tailwind CSS classes with clsx.
 * This is the only utility that belongs in this file.
 * All other utilities (generateId, sanitizeInput, validatePhone, etc.)
 * live in ./security.ts to avoid duplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  } else {
    return new Promise((resolve, reject) => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // Avoid scrolling to bottom
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          resolve();
        } else {
          reject('Fallback: Copying text command was unsuccessful');
        }
      } catch (err) {
        reject(err);
      }
      document.body.removeChild(textArea);
    });
  }
}
