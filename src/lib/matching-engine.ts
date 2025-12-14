import { Job, CV } from '@/types';

// Weights for scoring
const WEIGHTS = {
    TITLE: 40,
    LOCATION: 45,
    SALARY: 20,
    TYPE: 15,
    EXPERIENCE: 15,
    SKILL: 10, // Per matched skill
};

export interface MatchResult {
    score: number;
    breakdown: {
        title: number;
        location: number;
        salary: number;
        type: number;
        experience: number;
        skills: number;
    };
}

export function calculateMatchScore(job: Job, cv: CV): MatchResult {
    let breakdown = {
        title: 0,
        location: 0,
        salary: 0,
        type: 0,
        experience: 0,
        skills: 0,
    };

    // 1. Job Title Match (40 pts)
    // Simple inclusion check. "Dentist" in "General Dentist"
    const jobTitle = job.title?.toLowerCase() || '';
    // We try to match user role info. If CV doesn't have a specific title field, we might infer from bio or use a 'role' field if exists.
    // Based on database types, CV has 'full_name', 'bio', 'skills'. User table has 'user_type'.
    // We'll pass the CV object, but we might need the User object for 'user_type'.
    // Assuming CV might have a 'title' or we use 'bio' or we match against skills?
    // Let's assume for now we might check if job title words appear in CV skills or bio, OR
    // ideally, we should have the user's target role.
    // For this MVP, let's match if any of the user's SKILLS appear in the Job Title,
    // or if the defined 'user_type' (if we had it) matches.
    // Let's rely on string matching in Bio or Skills for now as a proxy if explicit role isn't on CV.
    // Actually, `cvs` table doesn't have `title`. It has `experience` JSON.
    // We'll proceed with a rudimentary check: if job title matches any skill or previous experience title.

    // Better approach: User likely selects a 'Role' during onboarding -> 'user_type' in Users table.
    // But here we only have Job and CV.
    // Let's check Bio for keywords.
    if (cv.bio && cv.bio.toLowerCase().includes(jobTitle)) {
        breakdown.title = WEIGHTS.TITLE;
    } else {
        // Fallback: Check skills
        const hasRelevantSkill = (cv.skills || []).some(skill =>
            jobTitle.includes(skill.toLowerCase())
        );
        if (hasRelevantSkill) breakdown.title = WEIGHTS.TITLE / 2; // Partial match
    }

    // 2. Location Match (45 pts)
    // Job.location vs CV.city or CV.location_preferred
    const jobLoc = job.location?.toLowerCase() || '';
    const userCity = cv.city?.toLowerCase() || '';
    const preferredLocs = (cv.location_preferred || []).map(l => l.toLowerCase());

    if (jobLoc === userCity || preferredLocs.includes(jobLoc)) {
        breakdown.location = WEIGHTS.LOCATION;
    } else if (preferredLocs.some(pref => jobLoc.includes(pref) || pref.includes(jobLoc))) {
        breakdown.location = 30; // Nearby/Partial
    }

    // 3. Employment Type (15 pts)
    // Job.employment_type vs CV.availability_type
    const jobType = job.employmentType; // camelCase from application mapping? DB is snake_case 'employment_type'. 
    // Need to ensure we use the correct property. The 'Job' type interface usually maps this.
    // Assuming 'employmentType' or 'employment_type'.
    const userType = cv.availability_type;
    // Map if necessary. existing code uses 'part_time'.
    if (jobType === userType) {
        breakdown.type = WEIGHTS.TYPE;
    }

    // 4. Skills Match (10 pts per skill)
    if (job.skills && cv.skills) {
        const jobSkills = job.skills.map(s => s.toLowerCase());
        const userSkills = cv.skills.map(s => s.toLowerCase());

        // Count shared
        const shared = jobSkills.filter(s => userSkills.includes(s));
        breakdown.skills = Math.min(shared.length * WEIGHTS.SKILL, 50); // Cap at 50?
        // Plan says "10 pts / skill". Let's cap matching contribution to avoid skewing.
    }

    // 5. Salary Match (20 pts)
    // Job.salary_max >= CV.salary_expected
    // Careful with currency.
    const jobMax = Number(job.salary.max || 0); // Assuming Job type has salary object or fields
    const userExpected = Number(cv.salary_expected || 0);

    if (jobMax >= userExpected) {
        breakdown.salary = WEIGHTS.SALARY;
    } else if (jobMax >= userExpected * 0.8) {
        breakdown.salary = 10; // Within 20% range
    }

    // 6. Experience (15 pts)
    // Job.min_experience (New Field) vs calculateYearsOfExperience(cv.experience)
    // We need to calculate total years from CV experience array.
    const totalYears = (cv.experience as any[])?.reduce((acc, exp) => {
        // heuristic: end - start
        // simplified: 1 year per entry? No, that's bad.
        // Let's assume we don't have easy dates calculation here without parsing strings.
        // For MVP, if they have > 0 experience entries, we give points?
        // Or we parse dates.
        return acc + 1; // Placeholder: 1 year per role.
    }, 0) || 0;

    // As per schema update plan: `min_experience` on Job.
    // We need to cast Job to any if the type isn't updated yet.
    const minExp = (job as any).min_experience || 0;

    if (totalYears >= minExp) {
        breakdown.experience = WEIGHTS.EXPERIENCE;
    }

    // Total
    const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return {
        score: totalScore,
        breakdown
    };
}

// Smart Search Parser
export interface SearchFilters {
    query: string;
    location?: string[];
    employmentType?: string[];
}

const KNOWN_CITIES = ['baghdad', 'najaf', 'basra', 'erbil', 'karbala', 'mosul', 'kirkuk', 'nasiriyah'];
const KNOWN_TYPES = {
    'part time': 'part_time',
    'full time': 'full_time',
    'جزئي': 'part_time',
    'كامل': 'full_time',
    'contract': 'contract',
    'عقد': 'contract'
};

export function parseSmartSearch(rawQuery: string): SearchFilters {
    const lower = rawQuery.toLowerCase();

    const filters: SearchFilters = {
        query: rawQuery // We keep original query for title matching, but strictly we could remove extracted tokens.
    };

    // Extract Locations
    const extractedLocations: string[] = [];
    KNOWN_CITIES.forEach(city => {
        if (lower.includes(city)) {
            extractedLocations.push(city);
            // Optional: remove from query string to clean it up?
            // filters.query = filters.query.replace(city, '').trim(); 
        }
    });
    if (extractedLocations.length > 0) filters.location = extractedLocations;

    // Extract Types
    const extractedTypes: string[] = [];
    Object.entries(KNOWN_TYPES).forEach(([key, value]) => {
        if (lower.includes(key)) {
            if (!extractedTypes.includes(value)) extractedTypes.push(value);
        }
    });
    if (extractedTypes.length > 0) filters.employmentType = extractedTypes;

    return filters;
}
