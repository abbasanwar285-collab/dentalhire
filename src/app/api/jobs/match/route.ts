import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { calculateMatchScore, parseSmartSearch } from '@/lib/matching-engine';
import { Database } from '@/types/database';

export async function POST(request: Request) {
    const cookieStore = await cookies();
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

    const { userId, query } = await request.json();

    try {
        // 1. Fetch User CV (for scoring)
        // If no userId provided, we can't score personnaly, but we can still search.
        let cvData = null;
        if (userId) {
            const { data: cv, error: cvError } = await supabase
                .from('cvs')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (!cvError && cv) {
                cvData = cv;
            }
        }

        // 2. Parse Smart Search Query
        const filters = query ? parseSmartSearch(query) : { query: '' };

        // 3. Fetch Jobs
        let jobsQuery = supabase
            .from('jobs')
            .select('*, clinics(name, logo)')
            .eq('status', 'active');

        // ... (Smart Filters logic)

        const { data: jobs, error: jobsError } = await jobsQuery;

        if (jobsError) throw jobsError;

        console.log('Match API Jobs Sample:', JSON.stringify(jobs?.[0], null, 2));

        // 4. Score and Filter
        let scoredJobs = (jobs as any[])?.map(job => {
            // Map DB Job to App Job Type if field names differ

            // Handle clinic name (Supabase might return array or object)
            let clinicName = 'Unknown Clinic';
            if (job.clinics) {
                if (Array.isArray(job.clinics)) {
                    clinicName = job.clinics[0]?.name || 'Unknown Clinic';
                } else if (typeof job.clinics === 'object') {
                    clinicName = job.clinics.name || 'Unknown Clinic';
                }
            }

            const appJob = {
                ...job,
                clinicName,
                salary: { min: job.salary_min, max: job.salary_max, currency: job.salary_currency },
                employmentType: job.employment_type,
            };

            // Calculate Score
            const matchResult = cvData
                ? calculateMatchScore(appJob as any, cvData as any)
                : { score: 0, breakdown: {} };

            return {
                ...job,
                clinicName, // Ensure mapped value is returned
                score: matchResult.score,
                matchBreakdown: matchResult.breakdown
            };
        }) || [];

        // 5. Apply Text Filter (Smart Search) in Memory if not done in DB
        // If we extracted specific tokens (e.g. city), we enforce them here.
        if (filters.location) {
            scoredJobs = scoredJobs.filter(j =>
                filters.location?.some(city => j.location.toLowerCase().includes(city))
            );
        }
        if (filters.employmentType) {
            scoredJobs = scoredJobs.filter(j =>
                filters.employmentType?.includes(j.employment_type)
            );
        }
        // General text match for remaining query words
        // if (filters.query) ...

        // 6. Sort by Score
        scoredJobs.sort((a, b) => b.score - a.score);

        return NextResponse.json({ jobs: scoredJobs });

    } catch (error) {
        console.error('Match API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
