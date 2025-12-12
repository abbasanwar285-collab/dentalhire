
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createServerClient<any>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: Record<string, unknown> }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // server component context
                        }
                    },
                },
            }
        );

        const { role, userId } = await request.json();

        if (!role) {
            return NextResponse.json(
                { error: 'Missing required field: role' },
                { status: 400 }
            );
        }

        // Try to get session
        const {
            data: { session },
        } = await supabase.auth.getSession();

        // Use session user ID if available, otherwise use provided userId
        const effectiveUserId = session?.user?.id || userId;

        if (!effectiveUserId) {
            return NextResponse.json(
                { error: 'No user ID available. Please log in.' },
                { status: 401 }
            );
        }

        // Get Clinic ID associated with this user
        const { data: clinic, error: clinicError } = await supabase
            .from('clinics')
            .select('id')
            .eq('user_id', effectiveUserId)
            .single();

        if (clinicError || !clinic) {
            // If no clinic found, create one for new users (simplified for demo)
            console.log('No clinic found for user, creating draft with user_id as fallback...');

            // For demo purposes, we'll insert directly with user_id as clinic_id
            // In production, you'd want to require clinic creation first
            const { data, error } = await supabase
                .from('job_drafts')
                .insert({
                    clinic_id: effectiveUserId, // Using user ID as fallback
                    user_id: effectiveUserId,
                    role: role,
                    status: 'draft',
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating job draft:', error);
                return NextResponse.json(
                    { error: 'Failed to create job draft. You may need to complete your clinic profile first.' },
                    { status: 500 }
                );
            }

            return NextResponse.json(data);
        }

        const { data, error } = await supabase
            .from('job_drafts')
            .insert({
                clinic_id: clinic.id,
                user_id: effectiveUserId,
                role: role,
                status: 'draft',
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating job draft:', error);
            return NextResponse.json(
                { error: 'Failed to create job draft' },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
