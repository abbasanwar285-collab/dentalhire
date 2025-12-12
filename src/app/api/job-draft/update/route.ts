
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
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

        const { draftId, stepData, status } = await request.json();

        if (!draftId) {
            return NextResponse.json(
                { error: 'Missing draft ID' },
                { status: 400 }
            );
        }

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (stepData) updateData.step_data = stepData;
        if (status) updateData.status = status;

        const { data, error } = await supabase
            .from('job_drafts')
            .update(updateData)
            .eq('id', draftId)
            .select()
            .single();

        if (error) {
            console.error('Error updating job draft:', error);
            return NextResponse.json(
                { error: 'Failed to update job draft' },
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
