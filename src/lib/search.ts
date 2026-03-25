// src/lib/search.ts

/**
 * Normalizes Arabic text for searching by removing diacritics (tashkeel),
 * tatweel, and normalizing letters that are often mistyped (أ, إ, آ -> ا),
 * (ة -> ه), (ى -> ي). Also converts to lowercase.
 */
export function normalizeArabicText(text: string): string {
    if (!text) return '';
    return text
        .replace(/[أإآا]/g, 'ا')
        .replace(/[ةه]/g, 'ه')
        .replace(/[يىئ]/g, 'ي')
        .replace(/[ؤو]/g, 'و')
        .replace(/ـ/g, '') // remove tatweel
        .replace(/ً|ٌ|ٍ|َ|ُ|ِ|ّ|ْ/g, '') // remove tashkeel
        .toLowerCase()
        .trim();
}

/**
 * Normalizes a phone number by removing everything except digits.
 */
export function normalizePhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
}

/**
 * Performs a smart fuzzy-like match of a query against a target text.
 * It ensures ALL words in the query exist somewhere in the target string.
 */
export function smartMatch(query: string, target: string): boolean {
    if (!query || query.trim() === '') return true;
    if (!target) return false;

    const normalizedQuery = normalizeArabicText(query);
    const normalizedTarget = normalizeArabicText(target);

    // If the query looks like a phone number, clean it and match against cleaned target
    if (/^[\d\s+\-\(\)]+$/.test(query)) {
        const queryDigits = normalizePhone(query);
        const targetDigits = normalizePhone(target);
        if (queryDigits && targetDigits && targetDigits.includes(queryDigits)) {
            return true;
        }
    }

    // Split query into words to ensure ALL words exist in the target (order independent)
    const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

    return queryWords.every(word => normalizedTarget.includes(word));
}
