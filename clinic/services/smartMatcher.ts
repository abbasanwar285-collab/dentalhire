/**
 * Smart String Matching Service
 * Handles fuzzy matching, Arabic normalization, and partial token matching.
 */

export const SmartMatcher = {
    /**
     * Calculate a match score between a candidate string (file name) and a target (patient name).
     * Returns a score, higher is better. 0 means no match.
     */
    /**
     * Calculate a match score between a candidate string (file name) and a target (patient name).
     * Returns a score, higher is better. 0 means no match.
     */
    calculateMatchScore: (candidate: string, target: string): number => {
        if (!candidate || !target) {
            return 0;
        }

        const normalizedCandidate = SmartMatcher.normalize(candidate);
        const normalizedTarget = SmartMatcher.normalize(target);

        // --- 1. Direct Match (Highest Score) ---
        if (normalizedCandidate.includes(normalizedTarget)) {
            return 100;
        }
        if (normalizedTarget.includes(normalizedCandidate)) {
            return 90;
        }

        // --- 2. Transliteration Match (Arabic <-> English) ---
        // If candidate is English and target is Arabic (or vice versa), try to transliterate
        const targetAsEnglish = SmartMatcher.transliterateArabicToEnglish(normalizedTarget);
        const candidateAsEnglish = SmartMatcher.transliterateArabicToEnglish(normalizedCandidate);

        // Check if the transliterated target is found in the candidate
        if (candidateAsEnglish.includes(targetAsEnglish) || targetAsEnglish.includes(candidateAsEnglish)) {
            return 85;
        }

        // --- 3. Token Matching ---
        const candTokens = candidateAsEnglish.split(/\s+/).filter(t => t.length > 2);
        const targetTokens = targetAsEnglish.split(/\s+/).filter(t => t.length > 2);

        let matchCount = 0;
        let totalScore = 0;

        for (const tToken of targetTokens) {
            let bestTokenScore = 0;
            for (const cToken of candTokens) {
                // Exact token match (on transliterated form)
                if (cToken === tToken) {
                    bestTokenScore = 15; // Higher weight for exact token match
                    break;
                }

                // Consonant Match (High confidence for Arabic Names)
                // e.g. "Mohamed" vs "mhmd" -> "mhmd" === "mhmd"
                if (SmartMatcher.stripVowels(cToken) === SmartMatcher.stripVowels(tToken)) {
                    bestTokenScore = Math.max(bestTokenScore, 13);
                }

                // Fuzzy token match (Levenshtein)
                const distance = SmartMatcher.levenshtein(cToken, tToken);
                const maxLen = Math.max(cToken.length, tToken.length);
                const similarity = 1 - (distance / maxLen);

                if (similarity > 0.65) { // Lowered threshold for leniency
                    bestTokenScore = Math.max(bestTokenScore, 10);
                } else if (cToken.includes(tToken) || tToken.includes(cToken)) {
                    bestTokenScore = Math.max(bestTokenScore, 8);
                }
            }
            if (bestTokenScore > 0) {
                matchCount++;
                totalScore += bestTokenScore;
            }
        }

        // Boost score
        if (matchCount >= 2) {
            return Math.min(100, totalScore * 2); // 2 tokens found? Great match
        }
        if (matchCount >= 1) {
            return totalScore * 1.5;
        }

        return 0;
    },

    /**
     * Remove vowels from string to compare consonant skeletons.
     */
    stripVowels: (str: string): string => {
        return str.replace(/[aeiou]/g, '');
    },

    /**
     * Normalize text for consistent comparison.
     */
    normalize: (text: string): string => {
        if (!text) {
            return '';
        }
        let str = text.toLowerCase().trim();

        // Arabic Normalization
        str = str.replace(/[إأآا]/g, 'ا');
        str = str.replace(/ة/g, 'ه');
        str = str.replace(/ى/g, 'ي');
        str = str.replace(/ؤ/g, 'و');
        str = str.replace(/ئ/g, 'ي');
        str = str.replace(/ـ/g, ''); // Tatweel
        str = str.replace(/[\u064B-\u065F\u0670]/g, ''); // Diacritics

        // Handle separators
        str = str.replace(/[_-]/g, ' ');

        // Remove non-alphanumeric chars (keep spaces and Arabic)
        return str.replace(/[^\w\s\u0600-\u06FF]/g, ' ');
    },

    /**
     * Transliterate Arabic text to English (Phonetic Approximation)
     */
    transliterateArabicToEnglish: (text: string): string => {
        const str = text;
        const map: Record<string, string> = {
            'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
            'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's',
            'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
            'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y',
            'ة': 'a', 'ى': 'a', 'ؤ': 'o', 'ئ': 'e', 'ء': 'a'
        };

        return str.split('').map(char => map[char] || char).join('').toLowerCase()
            // Post-processing for better phonetic matching
            .replace(/aa/g, 'a')
            .replace(/ee/g, 'i')
            .replace(/oo/g, 'o')
            .replace(/ou/g, 'o')
            .replace(/\s+/g, ' ')
            .trim();
    },

    /**
     * Levenshtein Distance Algorithm (Edit Distance)
     */
    levenshtein: (a: string, b: string): number => {
        if (a.length === 0) {
            return b.length;
        }
        if (b.length === 0) {
            return a.length;
        }

        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
};
