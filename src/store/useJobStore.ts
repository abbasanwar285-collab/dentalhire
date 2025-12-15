'use client';

// ============================================
// DentalHire - Jobs Store with Supabase
// ============================================

import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabase';
import { Job, JobApplication, EmploymentType } from '@/types';
import { useAuthStore } from './useAuthStore';

interface JobState {
    jobs: Job[];
    selectedJob: Job | null;
    isLoading: boolean;
    userApplications: JobApplication[];
    clinicApplications: JobApplication[];
    favorites: string[];

    // Actions
    loadJobs: () => Promise<void>;
    loadClinicJobs: (clinicId: string) => Promise<void>;
    loadUserApplications: (userId: string) => Promise<void>;
    loadClinicApplications: (clinicId: string) => Promise<void>;
    updateApplicationStatus: (applicationId: string, status: string) => Promise<boolean>;
    loadFavorites: (userId: string) => Promise<void>;
    toggleFavorite: (userId: string, cvId: string) => Promise<boolean>;
    addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'applications'>) => Promise<boolean>;
    updateJob: (id: string, updates: Partial<Job>) => Promise<boolean>;
    deleteJob: (id: string) => Promise<boolean>;
    setSelectedJob: (job: Job | null) => void;
    applyToJob: (jobId: string, userId: string, cvId: string) => Promise<'success' | 'duplicate' | 'error'>;
    searchJobs: (query: string, filters?: JobFilters) => Promise<void>;
    searchJobsSmart: (userId: string, query: string) => Promise<void>;
    savedJobs: string[];
    toggleSavedJob: (jobId: string) => Promise<void>;
    subscribeToJobs: () => () => void;
}

interface JobFilters {
    location?: string;
    employmentType?: EmploymentType;
    salaryMin?: number;
    salaryMax?: number;
}

export const useJobStore = create<JobState>()((set, get) => ({
    jobs: [],
    selectedJob: null,
    isLoading: false,

    loadJobs: async () => {
        set({ isLoading: true });
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await (supabase
                .from('jobs') as any)
                .select(`
          *,
          clinics!inner(name)
        `)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading jobs:', error);
                return;
            }

            if (data) {
                const jobs: Job[] = data.map((job: any) => ({
                    id: job.id,
                    clinicId: job.clinic_id,
                    clinicName: job.clinics?.name || 'Unknown Clinic',
                    title: job.title,
                    description: job.description,
                    requirements: job.requirements || [],
                    salary: {
                        min: job.salary_min,
                        max: job.salary_max,
                        currency: job.salary_currency,
                    },
                    location: job.location,
                    employmentType: job.employment_type as EmploymentType,
                    skills: job.skills || [],
                    status: job.status as 'active' | 'closed' | 'draft',
                    applications: job.applications || 0,
                    createdAt: new Date(job.created_at),
                    updatedAt: new Date(job.updated_at),
                    gender: job.gender,
                    workingHours: job.working_hours,
                }));

                set({ jobs });
            }
        } catch (error) {
            console.error('Error loading jobs:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    loadClinicJobs: async (clinicId: string) => {
        console.log('[loadClinicJobs] Starting with clinicId:', clinicId);
        set({ isLoading: true });
        try {
            const supabase = getSupabaseClient();

            // First, let's try a simple query without the join to see if it works
            const { data: simpleData, error: simpleError } = await (supabase
                .from('jobs') as any)
                .select('*')
                .eq('clinic_id', clinicId);

            console.log('[loadClinicJobs] Simple query result:', { simpleData, simpleError });

            // Now try the full query with join
            const { data, error } = await (supabase
                .from('jobs') as any)
                .select(`
          *,
          clinics!inner(name)
        `)
                .eq('clinic_id', clinicId)
                .order('created_at', { ascending: false });

            console.log('[loadClinicJobs] Full query result:', { data, error });

            if (error) {
                console.error('[loadClinicJobs] Error:', error);
                // Try using simple data if join fails
                if (simpleData && simpleData.length > 0) {
                    console.log('[loadClinicJobs] Using simple data as fallback');
                    const jobs: Job[] = simpleData.map((job: any) => ({
                        id: job.id,
                        clinicId: job.clinic_id,
                        clinicName: 'My Clinic',
                        title: job.title,
                        description: job.description,
                        requirements: job.requirements || [],
                        salary: {
                            min: job.salary_min,
                            max: job.salary_max,
                            currency: job.salary_currency,
                        },
                        location: job.location,
                        employmentType: job.employment_type as EmploymentType,
                        skills: job.skills || [],
                        status: job.status as 'active' | 'closed' | 'draft',
                        applications: job.applications || 0,
                        createdAt: new Date(job.created_at),
                        updatedAt: new Date(job.updated_at),
                        gender: job.gender,
                        workingHours: job.working_hours,
                    }));
                    set({ jobs });
                }
                return;
            }

            if (data) {
                const jobs: Job[] = data.map((job: any) => ({
                    id: job.id,
                    clinicId: job.clinic_id,
                    clinicName: job.clinics?.name || 'Unknown Clinic',
                    title: job.title,
                    description: job.description,
                    requirements: job.requirements || [],
                    salary: {
                        min: job.salary_min,
                        max: job.salary_max,
                        currency: job.salary_currency,
                    },
                    location: job.location,
                    employmentType: job.employment_type as EmploymentType,
                    skills: job.skills || [],
                    status: job.status as 'active' | 'closed' | 'draft',
                    applications: job.applications || 0,
                    createdAt: new Date(job.created_at),
                    updatedAt: new Date(job.updated_at),
                    gender: job.gender,
                    workingHours: job.working_hours,
                }));

                console.log('[loadClinicJobs] Mapped jobs:', jobs.length);
                set({ jobs });
            }
        } catch (error) {
            console.error('[loadClinicJobs] Catch error:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    searchJobs: async (query: string, filters?: JobFilters) => {
        set({ isLoading: true });
        const supabase = getSupabaseClient();

        let builder = (supabase
            .from('jobs') as any)
            .select(`
          *,
          clinics!inner(name)
        `)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (query.trim()) {
            builder = builder.ilike('title', `%${query}%`);
        }

        if (filters?.location) {
            builder = builder.ilike('location', `%${filters.location}%`);
        }

        if (filters?.employmentType) {
            builder = builder.eq('employment_type', filters.employmentType);
        }

        if (filters?.salaryMin) {
            builder = builder.gte('salary_min', filters.salaryMin);
        }

        const { data, error } = await builder;

        if (error) {
            console.error('Error searching jobs:', error);
            set({ isLoading: false });
            return;
        }

        if (data) {
            const jobs: Job[] = data.map((job: any) => ({
                id: job.id,
                clinicId: job.clinic_id,
                clinicName: job.clinics?.name || 'Unknown Clinic',
                title: job.title,
                description: job.description,
                requirements: job.requirements || [],
                salary: {
                    min: job.salary_min,
                    max: job.salary_max,
                    currency: job.salary_currency,
                },
                location: job.location,
                employmentType: job.employment_type as EmploymentType,
                skills: job.skills || [],
                status: job.status as 'active' | 'closed' | 'draft',
                applications: job.applications || 0,
                createdAt: new Date(job.created_at),
                updatedAt: new Date(job.updated_at),
                gender: job.gender,
                workingHours: job.working_hours,
            }));

            set({ jobs, isLoading: false });
        }
    },

    searchJobsSmart: async (userId: string, query: string) => {
        set({ isLoading: true });
        try {
            const response = await fetch('/api/jobs/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, query }),
            });

            if (!response.ok) throw new Error('Failed to fetch jobs');

            const { jobs: rawJobs } = await response.json();

            // Map jobs and preserve score
            const jobs: Job[] = rawJobs.map((job: any) => ({
                id: job.id,
                clinicId: job.clinic_id,
                clinicName: job.clinics?.name || 'Unknown Clinic',
                title: job.title,
                description: job.description,
                requirements: job.requirements || [],
                salary: {
                    min: job.salary_min,
                    max: job.salary_max,
                    currency: job.salary_currency,
                },
                location: job.location,
                employmentType: job.employment_type as EmploymentType,
                skills: job.skills || [],
                status: job.status as 'active' | 'closed' | 'draft',
                applications: job.applications || 0,
                createdAt: new Date(job.created_at),
                updatedAt: new Date(job.updated_at),
                gender: job.gender,
                workingHours: job.working_hours,
                score: job.score,
                matchBreakdown: job.matchBreakdown,
            }));

            set({ jobs });
        } catch (error) {
            console.error('Error in smart search:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    userApplications: [],
    clinicApplications: [],

    loadUserApplications: async (userId: string) => {
        set({ isLoading: true });
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await (supabase
                .from('job_applications') as any)
                .select(`
                    *,
                    jobs:jobs!inner(
                        *,
                        clinics:clinics!inner(name)
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading user applications:', error);
                return;
            }

            if (data) {
                const applications: JobApplication[] = data.map((app: any) => ({
                    id: app.id,
                    jobId: app.job_id,
                    userId: app.user_id,
                    cvId: app.cv_id,
                    status: app.status,
                    appliedAt: new Date(app.created_at),
                    updatedAt: new Date(app.updated_at || app.created_at),
                    job: {
                        id: app.jobs.id,
                        clinicId: app.jobs.clinic_id,
                        clinicName: app.jobs.clinics?.name || 'Unknown Clinic',
                        title: app.jobs.title,
                        description: app.jobs.description,
                        requirements: app.jobs.requirements || [],
                        salary: {
                            min: app.jobs.salary_min,
                            max: app.jobs.salary_max,
                            currency: app.jobs.salary_currency,
                        },
                        location: app.jobs.location,
                        employmentType: app.jobs.employment_type as EmploymentType,
                        skills: app.jobs.skills || [],
                        status: app.jobs.status as 'active' | 'closed' | 'draft',
                        applications: app.jobs.applications || 0,
                        createdAt: new Date(app.jobs.created_at),
                        updatedAt: new Date(app.jobs.updated_at),

                        gender: app.jobs.gender,
                        workingHours: app.jobs.working_hours,
                    }
                }));

                set({ userApplications: applications });
            }
        } catch (error) {
            console.error('Error loading user applications:', error);
        } finally {
            set({ isLoading: false });
        }
    },


    loadClinicApplications: async (clinicId: string) => {
        set({ isLoading: true });
        try {
            const supabase = getSupabaseClient();

            // First, get the clinic record to find the actual clinic ID
            const { data: clinicData, error: clinicError } = await (supabase
                .from('clinics') as any)
                .select('id')
                .eq('user_id', clinicId)
                .single();

            if (clinicError) {
                console.error('Error loading clinic:', clinicError);
                set({ isLoading: false });
                return;
            }

            if (!clinicData) {
                console.log('No clinic found for user:', clinicId);
                set({ clinicApplications: [], isLoading: false });
                return;
            }

            const actualClinicId = clinicData.id;
            console.log('[loadClinicApplications] Found clinic ID:', actualClinicId);

            // Get all applications for jobs posted by this clinic
            const { data, error } = await (supabase
                .from('job_applications') as any)
                .select(`
                    *,
                    jobs:jobs!inner(
                        *,
                        clinics:clinics!inner(name)
                    ),
                    cvs:cvs!inner(
                        id,
                        full_name,
                        email,
                        phone,
                        photo,
                        city,
                        skills,
                        photo,
                        city,
                        skills,
                        experience,
                        user_id
                    )
                `)
                .eq('jobs.clinic_id', actualClinicId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading clinic applications:', error);
                return;
            }

            console.log('[loadClinicApplications] Found applications:', data?.length || 0);

            if (data) {
                console.log('[loadClinicApplications] Raw Data:', data);

                const applications: JobApplication[] = data.map((app: any) => {
                    const cvData = Array.isArray(app.cvs) ? app.cvs[0] : app.cvs;
                    return {
                        id: app.id,
                        jobId: app.job_id,
                        userId: app.user_id,
                        cvId: app.cv_id,
                        status: app.status,
                        appliedAt: new Date(app.created_at),
                        updatedAt: new Date(app.updated_at || app.created_at),
                        job: {
                            id: app.jobs.id,
                            clinicId: app.jobs.clinic_id,
                            clinicName: app.jobs.clinics?.name || 'Unknown Clinic',
                            title: app.jobs.title,
                            description: app.jobs.description,
                            requirements: app.jobs.requirements || [],
                            salary: {
                                min: app.jobs.salary_min,
                                max: app.jobs.salary_max,
                                currency: app.jobs.salary_currency,
                            },
                            location: app.jobs.location,
                            employmentType: app.jobs.employment_type as EmploymentType,
                            skills: app.jobs.skills || [],
                            status: app.jobs.status as 'active' | 'closed' | 'draft',
                            applications: app.jobs.applications || 0,
                            createdAt: new Date(app.jobs.created_at),
                            updatedAt: new Date(app.jobs.updated_at),

                            gender: app.jobs.gender,
                            workingHours: app.jobs.working_hours,
                        },
                        cv: cvData ? {
                            id: cvData.id,
                            fullName: cvData.full_name,
                            email: cvData.email,
                            phone: cvData.phone,
                            photo: cvData.photo,
                            city: cvData.city,
                            skills: cvData.skills || [],
                            experience: cvData.experience || [],
                            userId: cvData.user_id,
                        } : undefined
                    };
                });

                set({ clinicApplications: applications });
            }
        } catch (error) {
            console.error('Error loading clinic applications:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    updateApplicationStatus: async (applicationId: string, status: string) => {
        try {
            const supabase = getSupabaseClient();
            console.log('[updateApplicationStatus] Starting update for:', applicationId, 'to', status);

            // 1. Get basic application info first
            const { data: appData, error: appError } = await (supabase
                .from('job_applications') as any)
                .select('user_id, job_id')
                .eq('id', applicationId)
                .single();

            if (appError) {
                console.error('[updateApplicationStatus] Error fetching application basic info:', appError);
            }

            // 2. Update status
            const { error: updateError } = await (supabase
                .from('job_applications') as any)
                .update({
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', applicationId);

            if (updateError) {
                console.error('[updateApplicationStatus] Error updating status:', updateError);
                return false;
            }

            console.log('[updateApplicationStatus] Status updated successfully');

            // 3. Create Notification
            if (appData) {
                try {
                    // Fetch job details separately to avoid join permission issues
                    const { data: jobData } = await (supabase
                        .from('jobs') as any)
                        .select('title, clinic_id, clinics(name)')
                        .eq('id', appData.job_id)
                        .single();

                    const jobTitle = jobData?.title || 'Job Application';
                    const clinicName = jobData?.clinics?.name || 'Clinic';

                    // Map status to message
                    let message = '';
                    let title = '';

                    switch (status) {
                        case 'accepted':
                            title = 'Application Accepted! 🎉';
                            message = `Congratulations! Your application for "${jobTitle}" at ${clinicName} has been accepted.`;
                            break;
                        case 'rejected':
                            title = 'Application Update';
                            message = `Your application for "${jobTitle}" at ${clinicName} has been updated to rejected.`;
                            break;
                        case 'interview':
                            title = 'Interview Invitation 📅';
                            message = `${clinicName} would like to interview you for the "${jobTitle}" position. Check your messages!`;
                            break;
                        case 'shortlisted':
                            title = 'Shortlisted! 🌟';
                            message = `You have been shortlisted for the "${jobTitle}" position at ${clinicName}.`;
                            break;
                        default:
                            title = 'Application Status Updated';
                            message = `Your application status for "${jobTitle}" has been updated to ${status}.`;
                    }

                    console.log('[updateApplicationStatus] Attempting to insert notification for user:', appData.user_id);

                    const { error: notifError } = await (supabase.from('notifications') as any).insert({
                        user_id: appData.user_id,
                        title,
                        message,
                        type: 'status_change',
                        read: false,
                        data: { applicationId, status, jobTitle, clinicName }
                    });

                    if (notifError) {
                        console.error('[updateApplicationStatus] Notification Insert Error:', notifError);
                    } else {
                        console.log('[updateApplicationStatus] Notification sent successfully');
                    }

                } catch (err) {
                    console.error('[updateApplicationStatus] Error preparing notification:', err);
                }
            }

            // Update local state
            set((state) => ({
                clinicApplications: state.clinicApplications.map((app) =>
                    app.id === applicationId
                        ? { ...app, status: status as any, updatedAt: new Date() }
                        : app
                ),
            }));

            return true;
        } catch (error) {
            console.error('[updateApplicationStatus] Fatal Error:', error);
            return false;
        }
    },

    favorites: [],

    loadFavorites: async (userId: string) => {
        const supabase = getSupabaseClient();
        const { data, error } = await (supabase
            .from('candidate_favorites') as any)
            .select('cv_id')
            .eq('user_id', userId);

        if (error) {
            console.error('Error loading favorites:', error);
            return;
        }

        if (data) {
            set({ favorites: data.map((f: any) => f.cv_id) });
        }
    },

    toggleFavorite: async (userId: string, cvId: string) => {
        const { favorites } = get();
        const supabase = getSupabaseClient();
        const isFavorite = favorites.includes(cvId);

        // Optimistic update
        const newFavorites = isFavorite
            ? favorites.filter(id => id !== cvId)
            : [...favorites, cvId];

        set({ favorites: newFavorites });

        try {
            if (isFavorite) {
                // Remove
                const { error } = await (supabase
                    .from('candidate_favorites') as any)
                    .delete()
                    .eq('user_id', userId)
                    .eq('cv_id', cvId);

                if (error) throw error;
            } else {
                // Add
                const { error } = await (supabase
                    .from('candidate_favorites') as any)
                    .insert({ user_id: userId, cv_id: cvId });

                if (error) throw error;
            }
            return true;
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Revert
            set({ favorites });
            return false;
        }
    },

    addJob: async (jobData) => {
        try {
            const supabase = getSupabaseClient();

            // Debug verify configuration
            // Debug verify configuration
            console.log('[addJob] Checking Supabase config...');

            if (!navigator.onLine) {
                alert('Network Error: You appear to be offline. Please check your internet connection.');
                return false;
            }

            console.log('[addJob] Attempting to insert job with clinicId:', jobData.clinicId);

            const { data, error } = await (supabase
                .from('jobs') as any)
                .insert({
                    clinic_id: jobData.clinicId,
                    title: jobData.title,
                    description: jobData.description,
                    requirements: jobData.requirements,
                    salary_min: jobData.salary.min,
                    salary_max: jobData.salary.max,
                    salary_currency: jobData.salary.currency,
                    location: jobData.location,
                    employment_type: jobData.employmentType,
                    skills: jobData.skills,
                    status: jobData.status,
                    applications: 0,
                    gender: jobData.gender,
                    working_hours: jobData.workingHours,
                })
                .select(`
          *,
          clinics!inner(name)
        `)
                .single();

            if (error) {
                console.error('[addJob] Supabase error:', error);
                // Show the error to the user via alert
                alert(`Error: ${error.message}\nCode: ${error.code}\nDetails: ${error.details || 'N/A'}`);
                return false;
            }

            console.log('[addJob] Job created successfully:', data);

            if (data) {
                const newJob: Job = {
                    id: data.id,
                    clinicId: data.clinic_id,
                    clinicName: data.clinics?.name || 'Unknown Clinic',
                    title: data.title,
                    description: data.description,
                    requirements: data.requirements || [],
                    salary: {
                        min: data.salary_min,
                        max: data.salary_max,
                        currency: data.salary_currency,
                    },
                    location: data.location,
                    employmentType: data.employment_type as EmploymentType,
                    skills: data.skills || [],
                    status: data.status as 'active' | 'closed' | 'draft',
                    applications: 0,
                    createdAt: new Date(data.created_at),
                    updatedAt: new Date(data.updated_at),
                    gender: data.gender,
                    workingHours: data.working_hours,
                };

                set((state) => ({ jobs: [newJob, ...state.jobs] }));
                return true;
            }

            return false;
        } catch (error: any) {
            console.error('[addJob] Catch error:', error);
            alert(`Unexpected error: ${error?.message || 'Unknown error'}`);
            return false;
        }
    },

    updateJob: async (id, updates) => {
        try {
            const supabase = getSupabaseClient();

            const updateData: Record<string, unknown> = {};
            if (updates.title) updateData.title = updates.title;
            if (updates.description) updateData.description = updates.description;
            if (updates.requirements) updateData.requirements = updates.requirements;
            if (updates.salary) {
                updateData.salary_min = updates.salary.min;
                updateData.salary_max = updates.salary.max;
                updateData.salary_currency = updates.salary.currency;
            }
            if (updates.location) updateData.location = updates.location;
            if (updates.employmentType) updateData.employment_type = updates.employmentType;
            if (updates.skills) updateData.skills = updates.skills;
            if (updates.status) updateData.status = updates.status;
            if (updates.gender) updateData.gender = updates.gender;
            if (updates.workingHours) updateData.working_hours = updates.workingHours;

            const { error } = await (supabase
                .from('jobs') as any)
                .update(updateData)
                .eq('id', id);

            if (error) {
                console.error('Error updating job:', error);
                return false;
            }

            set((state) => ({
                jobs: state.jobs.map((job) =>
                    job.id === id ? { ...job, ...updates, updatedAt: new Date() } : job
                ),
            }));

            return true;
        } catch (error) {
            console.error('Error updating job:', error);
            return false;
        }
    },

    deleteJob: async (id) => {
        try {
            const supabase = getSupabaseClient();

            // Use the secure RPC function to delete (handles FK constraints & ownership)
            const { data, error } = await (supabase as any).rpc('delete_job_safely', { target_job_id: id });

            if (error) {
                console.error('Error deleting job (RPC):', error);
                // Fallback to standard delete if RPC doesn't exist yet (backward compatibility)
                const { error: deleteError } = await (supabase.from('jobs') as any).delete().eq('id', id);
                if (deleteError) {
                    console.error('Error deleting job (Standard):', deleteError);
                    return false;
                }
            } else if (!data) {
                // RPC returned false (not owner or not found)
                console.warn('RPC returned false. Checking if job exists...');

                // Verify if job actually exists
                const { data: jobExists } = await (supabase.from('jobs') as any)
                    .select('id')
                    .eq('id', id)
                    .single();

                if (!jobExists) {
                    console.log('Job no longer exists in DB (Ghost job). Removing from UI.');
                    // It was already deleted (maybe by deduplication script), so we just clean up UI
                    set((state) => ({
                        jobs: state.jobs.filter((job) => job.id !== id),
                        selectedJob: state.selectedJob?.id === id ? null : state.selectedJob,
                    }));
                    return true;
                }

                console.error('Failed to delete job: Access denied (Job exists but not owned by this clinic)');
                return false;
            }

            // Remove from local state
            set((state) => ({
                jobs: state.jobs.filter((job) => job.id !== id),
                selectedJob: state.selectedJob?.id === id ? null : state.selectedJob,
            }));

            return true;
        } catch (error) {
            console.error('Error deleting job:', error);
            return false;
        }
    },

    setSelectedJob: (job) => {
        set({ selectedJob: job });
    },

    applyToJob: async (jobId, userId, cvId) => {
        try {
            const supabase = getSupabaseClient();

            // Check if already applied
            const { data: existing } = await (supabase
                .from('job_applications') as any)
                .select('id')
                .eq('job_id', jobId)
                .eq('user_id', userId)
                .single();

            if (existing) {
                console.log('Already applied to this job');
                return 'duplicate';
            }

            // Create application
            const { error } = await (supabase.from('job_applications') as any).insert({
                job_id: jobId,
                cv_id: cvId,
                user_id: userId,
                status: 'pending',
            });

            if (error) {
                console.error('Error applying to job:', error);
                return 'error';
            }

            // Increment applications count
            await (supabase as any).rpc('increment_job_applications', { job_id: jobId });

            // Reload user applications
            await get().loadUserApplications(userId);

            return 'success';
        } catch (error) {
            console.error('Error applying to job:', error);
            return 'error';
        }
    },

    subscribeToJobs: () => {
        const supabase = getSupabaseClient();
        console.log('Subscribing to realtime jobs...');

        const channel = supabase
            .channel('public:jobs')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'jobs'
                },
                (payload) => {
                    console.log('Realtime job change received:', payload);
                    const state = get();

                    // Handle DELETE
                    if (payload.eventType === 'DELETE') {
                        if (payload.old && payload.old.id) {
                            console.log('Removing deleted job:', payload.old.id);
                            set((state) => ({
                                jobs: state.jobs.filter((job) => job.id !== payload.old.id),
                                selectedJob: state.selectedJob?.id === payload.old.id ? null : state.selectedJob
                            }));
                        } else {
                            // Fallback if ID is missing (e.g. Replica Identity issue)
                            console.log('DELETE payload missing ID, reloading all jobs...');
                            state.loadJobs();
                        }
                    }
                    // Handle UPDATE (Status Change)
                    else if (payload.eventType === 'UPDATE') {
                        const newStatus = payload.new.status;

                        // If job became inactive (closed/draft), remove it instantly
                        if (newStatus !== 'active') {
                            console.log('Job became inactive, removing:', payload.new.id);
                            set((state) => ({
                                jobs: state.jobs.filter((job) => job.id !== payload.new.id),
                                selectedJob: state.selectedJob?.id === payload.new.id ? null : state.selectedJob
                            }));
                        } else {
                            // Otherwise reload to get updates (e.g. edited title)
                            state.loadJobs();
                        }
                    }
                    // Handle INSERT
                    else {
                        state.loadJobs();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
}));
