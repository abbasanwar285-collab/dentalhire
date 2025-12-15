// ============================================
// DentalHire - Smart Matching Algorithm
// ============================================

import { CV, Clinic, MatchBreakdown, MatchResult } from '@/types';
import { calculateDistance, calculateExperienceYears } from './utils';

/**
 * Smart Matching Algorithm
 * Calculates a match score (0-100) between a CV and clinic preferences
 * 
 * Weights:
 * - Location: 20%
 * - Salary: 25%
 * - Experience: 20%
 * - Skills: 25%
 * - Availability: 10%
 */
export function calculateMatchScore(cv: CV, clinic: Clinic): MatchResult {
    const breakdown: MatchBreakdown = {
        location: calculateLocationScore(cv, clinic),
        salary: calculateSalaryScore(cv, clinic),
        experience: calculateExperienceScore(cv, clinic),
        skills: calculateSkillsScore(cv, clinic),
        availability: calculateAvailabilityScore(cv, clinic),
    };

    const totalScore = Math.round(
        breakdown.location +
        breakdown.salary +
        breakdown.experience +
        breakdown.skills +
        breakdown.availability
    );

    return {
        cv,
        score: Math.min(100, Math.max(0, totalScore)),
        breakdown,
    };
}

/**
 * Calculate location match score (0-20 points)
 */
function calculateLocationScore(cv: CV, clinic: Clinic): number {
    const maxScore = 20;
    const defaultRadius = 50; // km

    // Check if both have coordinates
    if (cv.location.coordinates && clinic.location.coordinates) {
        const distance = calculateDistance(cv.location.coordinates, clinic.location.coordinates);
        const radius = clinic.preferences.radius || defaultRadius;

        if (distance <= radius) {
            // Linear decay: closer = higher score
            return maxScore * (1 - distance / radius);
        }
        return 0;
    }

    // Fallback to city matching
    const cvCity = cv.location.preferred[0]?.toLowerCase() || cv.personalInfo.city?.toLowerCase();
    const clinicCity = clinic.location.city?.toLowerCase();

    if (cvCity && clinicCity && cvCity === clinicCity) {
        return maxScore;
    }

    // Partial match if CV lists the clinic's city in preferences
    if (cv.location.preferred.some(loc => loc.toLowerCase() === clinicCity)) {
        return maxScore * 0.8;
    }

    // Willing to relocate gives partial score
    if (cv.location.willingToRelocate) {
        return maxScore * 0.5;
    }

    return 0;
}

/**
 * Calculate salary match score (0-25 points)
 */
function calculateSalaryScore(cv: CV, clinic: Clinic): number {
    const maxScore = 25;
    const { min, max } = clinic.preferences.salaryRange;
    const expected = cv.salary.expected;

    if (!expected || !min || !max) {
        return maxScore * 0.5; // Neutral if data missing
    }

    // Perfect match if within range
    if (expected >= min && expected <= max) {
        return maxScore;
    }

    // Slightly below range is still good (clinic saves money)
    if (expected < min) {
        const difference = min - expected;
        const percentBelow = difference / min;
        return percentBelow <= 0.2 ? maxScore * 0.9 : maxScore * 0.7;
    }

    // Above range
    if (expected > max) {
        const difference = expected - max;
        const percentAbove = difference / max;

        // Negotiable gives some leeway
        if (cv.salary.negotiable) {
            if (percentAbove <= 0.1) return maxScore * 0.8;
            if (percentAbove <= 0.2) return maxScore * 0.6;
            return maxScore * 0.3;
        }

        if (percentAbove <= 0.1) return maxScore * 0.6;
        if (percentAbove <= 0.2) return maxScore * 0.4;
        return maxScore * 0.1;
    }

    return 0;
}

/**
 * Calculate experience match score (0-20 points)
 */
function calculateExperienceScore(cv: CV, clinic: Clinic): number {
    const maxScore = 20;
    const experienceYears = calculateExperienceYears(cv.experience);
    const { min, max } = clinic.preferences.experienceYears;

    // Perfect match if within range
    if (experienceYears >= min && experienceYears <= (max || 100)) {
        return maxScore;
    }

    // Below minimum
    if (experienceYears < min) {
        const difference = min - experienceYears;
        if (difference <= 1) return maxScore * 0.7;
        if (difference <= 2) return maxScore * 0.4;
        return maxScore * 0.2;
    }

    // Above maximum (over-qualified) - still good but slightly penalized
    return maxScore * 0.85;
}

/**
 * Calculate skills match score (0-25 points)
 */
function calculateSkillsScore(cv: CV, clinic: Clinic): number {
    const maxScore = 25;
    const requiredSkills = clinic.preferences.requiredSkills;

    if (!requiredSkills || requiredSkills.length === 0) {
        return maxScore * 0.75; // Neutral if no requirements
    }

    const cvSkillsLower = cv.skills.map(s => s.toLowerCase());
    const matchedSkills = requiredSkills.filter(skill =>
        cvSkillsLower.some(cvSkill =>
            cvSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cvSkill)
        )
    );

    const matchPercentage = matchedSkills.length / requiredSkills.length;

    // Bonus for having more skills than required
    const extraSkillsBonus = cv.skills.length > requiredSkills.length ? 0.05 : 0;

    return maxScore * Math.min(1, matchPercentage + extraSkillsBonus);
}

/**
 * Calculate availability match score (0-10 points)
 */
function calculateAvailabilityScore(cv: CV, clinic: Clinic): number {
    const maxScore = 10;
    const preferredTypes = clinic.preferences.employmentType;

    if (!preferredTypes || preferredTypes.length === 0) {
        return maxScore; // No preference means any type is fine
    }

    // Check if CV's availability type matches any preferred type
    if (preferredTypes.includes(cv.availability.type)) {
        return maxScore;
    }

    // Partial match for flexible types
    const isFlexible =
        (cv.availability.type === 'full_time' && preferredTypes.includes('part_time')) ||
        (cv.availability.type === 'part_time' && preferredTypes.includes('full_time'));

    if (isFlexible) {
        return maxScore * 0.6;
    }

    return maxScore * 0.2;
}

/**
 * Get top matches for a clinic
 */
export function getTopMatches(cvs: CV[], clinic: Clinic, limit: number = 10): MatchResult[] {
    const matches = cvs.map(cv => calculateMatchScore(cv, clinic));

    return matches
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Filter CVs by criteria and return with match scores
 */
export function filterAndMatchCVs(
    cvs: CV[],
    clinic: Clinic,
    filters: {
        minScore?: number;
        skills?: string[];
        location?: string;
        experienceMin?: number;
        experienceMax?: number;
        verified?: boolean;
    }
): MatchResult[] {
    let filteredCVs = [...cvs];

    // Apply filters
    if (filters.skills && filters.skills.length > 0) {
        filteredCVs = filteredCVs.filter(cv =>
            filters.skills!.some(skill =>
                cv.skills.some(cvSkill =>
                    cvSkill.toLowerCase().includes(skill.toLowerCase())
                )
            )
        );
    }

    if (filters.location) {
        filteredCVs = filteredCVs.filter(cv =>
            cv.location.preferred.some(loc =>
                loc.toLowerCase().includes(filters.location!.toLowerCase())
            ) ||
            cv.personalInfo.city?.toLowerCase().includes(filters.location!.toLowerCase())
        );
    }

    if (filters.experienceMin !== undefined || filters.experienceMax !== undefined) {
        filteredCVs = filteredCVs.filter(cv => {
            const years = calculateExperienceYears(cv.experience);
            if (filters.experienceMin !== undefined && years < filters.experienceMin) return false;
            if (filters.experienceMax !== undefined && years > filters.experienceMax) return false;
            return true;
            if (filters.experienceMax !== undefined && years > filters.experienceMax) return false;
            return true;
        });
    }

    if (filters.verified) {
        filteredCVs = filteredCVs.filter(cv => cv.personalInfo.verified === true);
    }

    // Calculate match scores
    const matches = filteredCVs.map(cv => calculateMatchScore(cv, clinic));

    // Filter by minimum score if specified
    if (filters.minScore !== undefined) {
        return matches.filter(m => m.score >= filters.minScore!);
    }

    return matches.sort((a, b) => b.score - a.score);
}

/**
 * Get match score color based on score value
 */
export function getMatchColor(score: number): string {
    if (score >= 90) return '#10B981'; // Emerald
    if (score >= 75) return '#22C55E'; // Green
    if (score >= 60) return '#EAB308'; // Yellow
    if (score >= 40) return '#F97316'; // Orange
    return '#EF4444'; // Red
}

/**
 * Get match score label
 */
export function getMatchLabel(score: number): string {
    if (score >= 90) return 'Excellent Match';
    if (score >= 75) return 'Great Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Low Match';
}
