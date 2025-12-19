'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function getAdminJobs() {
    try {
        const cookieStore = await cookies();

        // 1. Verify current user session using standard client
        const supabase = createServerClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // server component context
                        }
                    },
                },
            }
        );

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error('Unauthorized');
        }

        // 2. Check if user is admin
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('auth_id', session.user.id)
            .single();

        if (userError || user?.role !== 'admin') {
            throw new Error('Unauthorized: Admin access required');
        }

        // 3. Initialize Admin Client with Service Role Key
        // Note: We use the direct supabase-js client for service role operations
        const adminSupabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 4. Fetch all jobs with clinic details
        const { data: jobs, error: jobsError } = await adminSupabase
            .from('jobs')
            .select(`
                id, 
                title, 
                description, 
                status, 
                created_at,
                location,
                type: employment_type,
                salary_range: salary_max, 
                clinic_id,
                clinic:clinics (
                    id,
                    name,
                    user:users (
                        first_name,
                        last_name,
                        email
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (jobsError) {
            console.error('Error fetching admin jobs:', jobsError);
            throw jobsError;
        }

        // Transform data to match UI expectations
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (jobs as any[])?.map(job => ({
            ...job,
            type: job.employment_type || job.type, // Handle different potential field names
            salary_range: `${job.salary_min} - ${job.salary_max} ${job.salary_currency}`,
        })) || [];

    } catch (error) {
        console.error('getAdminJobs error:', error);
        throw error;
    }
}
