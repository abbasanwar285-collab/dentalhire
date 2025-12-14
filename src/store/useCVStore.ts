'use client';

// ============================================
// DentalHire - CV Store with Supabase
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import {
    PersonalInfo,
    Experience,
    Certification,
    Language,
    SalaryExpectation,
    LocationPreference,
    Availability,
    Document,
    EmploymentType,
} from '@/types';

interface CVState {
    // Current step
    currentStep: number;

    // CV Data
    personalInfo: Partial<PersonalInfo>;
    experience: Experience[];
    skills: string[];
    certifications: Certification[];
    languages: Language[];
    salary: Partial<SalaryExpectation>;
    location: Partial<LocationPreference>;
    availability: Partial<Availability>;
    documents: Document[];

    // Loading state
    isLoading: boolean;
    isSaving: boolean;
    cvId: string | null;

    // Navigation
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;

    // Personal Info
    updatePersonalInfo: (data: Partial<PersonalInfo>) => void;

    // Experience
    addExperience: (exp: Omit<Experience, 'id'>) => void;
    updateExperience: (id: string, exp: Partial<Experience>) => void;
    removeExperience: (id: string) => void;

    // Skills
    addSkill: (skill: string) => void;
    removeSkill: (skill: string) => void;

    // Certifications
    addCertification: (cert: Omit<Certification, 'id'>) => void;
    updateCertification: (id: string, cert: Partial<Certification>) => void;
    removeCertification: (id: string) => void;

    // Languages
    addLanguage: (lang: Language) => void;
    updateLanguage: (index: number, lang: Language) => void;
    removeLanguage: (language: string) => void;

    // Salary
    updateSalary: (data: Partial<SalaryExpectation>) => void;

    // Location
    updateLocation: (data: Partial<LocationPreference>) => void;

    // Availability
    updateAvailability: (data: Partial<Availability>) => void;

    // Documents
    addDocument: (doc: Document) => void;
    removeDocument: (id: string) => void;

    // Supabase operations
    loadCV: (userId: string) => Promise<void>;
    saveCV: (userId: string) => Promise<boolean>;

    // Validation
    isStepValid: (step: number) => boolean;
    getCompletionPercentage: () => number;
}

const defaultSchedule = {
    monday: { available: true, hours: '9:00 AM - 5:00 PM' },
    tuesday: { available: true, hours: '9:00 AM - 5:00 PM' },
    wednesday: { available: true, hours: '9:00 AM - 5:00 PM' },
    thursday: { available: true, hours: '9:00 AM - 5:00 PM' },
    friday: { available: true, hours: '9:00 AM - 5:00 PM' },
    saturday: { available: false },
    sunday: { available: false },
};

export const useCVStore = create<CVState>()(
    persist(
        (set, get) => ({
            currentStep: 0,
            personalInfo: {},
            experience: [],
            skills: [],
            certifications: [],
            languages: [],
            salary: { currency: 'USD', negotiable: true },
            location: { preferred: [], willingToRelocate: false, remoteWork: false },
            availability: { type: 'full_time', schedule: defaultSchedule },
            documents: [],
            isLoading: false,
            isSaving: false,
            cvId: null,

            setStep: (step) => set({ currentStep: step }),
            nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 8) })),
            prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

            updatePersonalInfo: (data) =>
                set((state) => ({ personalInfo: { ...state.personalInfo, ...data } })),

            addExperience: (exp) =>
                set((state) => ({
                    experience: [...state.experience, { ...exp, id: generateId() }],
                })),
            updateExperience: (id, exp) =>
                set((state) => ({
                    experience: state.experience.map((e) => (e.id === id ? { ...e, ...exp } : e)),
                })),
            removeExperience: (id) =>
                set((state) => ({
                    experience: state.experience.filter((e) => e.id !== id),
                })),

            addSkill: (skill) =>
                set((state) => ({
                    skills: state.skills.includes(skill) ? state.skills : [...state.skills, skill],
                })),
            removeSkill: (skill) =>
                set((state) => ({ skills: state.skills.filter((s) => s !== skill) })),

            addCertification: (cert) =>
                set((state) => ({
                    certifications: [...state.certifications, { ...cert, id: generateId() }],
                })),
            updateCertification: (id, cert) =>
                set((state) => ({
                    certifications: state.certifications.map((c) => (c.id === id ? { ...c, ...cert } : c)),
                })),
            removeCertification: (id) =>
                set((state) => ({
                    certifications: state.certifications.filter((c) => c.id !== id),
                })),

            addLanguage: (lang) =>
                set((state) => ({
                    languages: state.languages.some((l) => l.language === lang.language)
                        ? state.languages
                        : [...state.languages, lang],
                })),
            updateLanguage: (index, lang) =>
                set((state) => {
                    const newLanguages = [...state.languages];
                    newLanguages[index] = lang;
                    return { languages: newLanguages };
                }),
            removeLanguage: (language) =>
                set((state) => ({
                    languages: state.languages.filter((l) => l.language !== language),
                })),

            updateSalary: (data) =>
                set((state) => ({ salary: { ...state.salary, ...data } })),

            updateLocation: (data) =>
                set((state) => ({ location: { ...state.location, ...data } })),

            updateAvailability: (data) =>
                set((state) => ({ availability: { ...state.availability, ...data } })),

            addDocument: (doc) =>
                set((state) => ({ documents: [...state.documents, doc] })),
            removeDocument: (id) =>
                set((state) => ({ documents: state.documents.filter((d) => d.id !== id) })),

            loadCV: async (userId: string) => {
                set({ isLoading: true });
                try {
                    const supabase = getSupabaseClient();
                    const { data, error } = await supabase
                        .from('cvs')
                        .select('*')
                        .eq('user_id', userId)
                        .single() as { data: any, error: any };

                    if (error && error.code !== 'PGRST116') {
                        console.error('Error loading CV:', error);
                    }

                    if (data) {
                        set({
                            cvId: data.id,
                            personalInfo: {
                                fullName: data.full_name,
                                email: data.email,
                                phone: data.phone,
                                city: data.city,
                                bio: data.bio,
                                photo: data.photo,
                            },
                            experience: data.experience as Experience[] || [],
                            skills: data.skills || [],
                            certifications: data.certifications as Certification[] || [],
                            languages: data.languages as Language[] || [],
                            salary: {
                                expected: data.salary_expected,
                                currency: data.salary_currency,
                                negotiable: data.salary_negotiable,
                            },
                            location: {
                                preferred: data.location_preferred || [],
                                willingToRelocate: data.willing_to_relocate,
                                remoteWork: data.remote_work,
                            },
                            availability: {
                                type: data.availability_type as EmploymentType,
                                startDate: data.availability_start_date,
                                schedule: data.availability_schedule || defaultSchedule,
                            },
                            documents: data.documents as Document[] || [],
                        });
                    }
                } catch (error) {
                    console.error('Error loading CV:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            saveCV: async (userId: string) => {
                set({ isSaving: true });
                try {
                    const state = get();
                    const supabase = getSupabaseClient();

                    const cvData = {
                        user_id: userId,
                        full_name: state.personalInfo.fullName || '',
                        email: state.personalInfo.email || '',
                        phone: state.personalInfo.phone || '',
                        city: state.personalInfo.city || '',
                        bio: state.personalInfo.bio,
                        photo: state.personalInfo.photo,
                        experience: state.experience,
                        skills: state.skills,
                        certifications: state.certifications,
                        languages: state.languages,
                        salary_expected: state.salary.expected || 0,
                        salary_currency: state.salary.currency || 'USD',
                        salary_negotiable: state.salary.negotiable ?? true,
                        location_preferred: state.location.preferred || [],
                        willing_to_relocate: state.location.willingToRelocate ?? false,
                        remote_work: state.location.remoteWork ?? false,
                        availability_type: state.availability.type || 'full_time',
                        availability_start_date: state.availability.startDate,
                        availability_schedule: state.availability.schedule,
                        documents: state.documents,
                        status: 'active',
                    };

                    if (state.cvId) {
                        // Update existing CV
                        const { error } = await (supabase
                            .from('cvs') as any)
                            .update(cvData)
                            .eq('id', state.cvId);

                        if (error) {
                            console.error('Error updating CV:', error);
                            return false;
                        }
                    } else {
                        // Insert new CV
                        const { data, error } = await (supabase
                            .from('cvs') as any)
                            .insert(cvData)
                            .select()
                            .single();

                        if (error) {
                            console.error('Error creating CV:', error);
                            return false;
                        }

                        if (data) {
                            set({ cvId: data.id });
                        }
                    }

                    // Sync city to User Profile
                    if (state.personalInfo.city) {
                        // We use the imported auth store to update profile
                        // This ensures local state and DB are updated
                        const { useAuthStore } = await import('./useAuthStore');
                        useAuthStore.getState().updateProfile({
                            city: state.personalInfo.city
                        });
                    }

                    return true;
                } catch (error) {
                    console.error('Error saving CV:', error);
                    return false;
                } finally {
                    set({ isSaving: false });
                }
            },

            isStepValid: (step) => {
                const state = get();
                switch (step) {
                    case 0: // Personal Info
                        return !!(
                            state.personalInfo.fullName &&
                            state.personalInfo.email &&
                            state.personalInfo.phone &&
                            state.personalInfo.city
                        );
                    case 1: // Experience
                        return state.experience.length > 0;
                    case 2: // Skills
                        return state.skills.length >= 3;
                    case 3: // Certifications
                        return true; // Optional
                    case 4: // Languages
                        return state.languages.length > 0;
                    case 5: // Salary
                        return !!(state.salary.expected && state.salary.currency);
                    case 6: // Location
                        return (state.location.preferred?.length || 0) > 0;
                    case 7: // Availability
                        return !!state.availability.type;
                    case 8: // Documents
                        return true; // Optional
                    default:
                        return false;
                }
            },

            getCompletionPercentage: () => {
                const state = get();
                let score = 0;

                // Personal Info (20%)
                if (state.personalInfo.fullName && state.personalInfo.email && state.personalInfo.phone && state.personalInfo.city) {
                    score += 20;
                }

                // Experience (20%)
                if (state.experience.length > 0) {
                    score += 20;
                }

                // Skills (15%)
                if (state.skills.length >= 3) {
                    score += 15;
                }

                // Languages (10%)
                if (state.languages.length > 0) {
                    score += 10;
                }

                // Preferences (Salary & Location) (20%)
                if (state.salary.expected && state.location.preferred && state.location.preferred.length > 0) {
                    score += 20;
                }

                // Availability (15%)
                if (state.availability.type) {
                    score += 15;
                }

                return Math.min(score, 100);
            },
        }),
        {
            name: 'dentalhire-cv',
        }
    )
);
