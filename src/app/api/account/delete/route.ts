import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hbzuewfbqnjddoxukxyp.supabase.co';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhienVld2ZicW5qZGRveHVreHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzgyMTgsImV4cCI6MjA0ODA3NTQyMTh9.X38YSYo8UiiSbf9lAfmSc_4zIVp4GMHrynnFy5sdqZA';
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
            console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
            return NextResponse.json({ success: false, error: 'Configuration Error' }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            supabaseUrl,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // First try to get user from Authorization header (sent from client)
        const authHeader = request.headers.get('authorization');
        let authUser = null;
        let authError = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            if (token) {
                const result = await supabaseAdmin.auth.getUser(token);
                authUser = result.data.user;
                authError = result.error;
            }
        }

        // If no user from header, try to get from cookies using createServerClient
        if (!authUser) {
            const cookieStore = await cookies();
            const supabase = createServerClient(
                supabaseUrl,
                supabaseAnonKey,
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
                                // Ignore errors from Server Components
                            }
                        },
                    },
                }
            );

            const result = await supabase.auth.getUser();
            authUser = result.data.user;
            authError = result.error;
        }

        if (authError || !authUser) {
            console.error('Auth error:', authError);
            return NextResponse.json({ success: false, error: 'Unauthorized - no token' }, { status: 401 });
        }

        const authUserId = authUser.id;

        // 1. Find the user's public.users record
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('auth_id', authUserId)
            .single();

        if (userError) {
            console.error('Error finding user:', userError);
        }

        const publicUserId = userData?.id;

        // 2. Delete related data (cascade should handle most, but let's be thorough)
        if (publicUserId) {
            // Delete CVs
            await supabaseAdmin.from('cvs').delete().eq('user_id', publicUserId);

            // Delete clinic profiles
            await supabaseAdmin.from('clinics').delete().eq('user_id', publicUserId);

            // Delete jobs posted by this user
            await supabaseAdmin.from('jobs').delete().eq('clinic_id', publicUserId);

            // Delete applications
            await supabaseAdmin.from('applications').delete().eq('applicant_id', publicUserId);

            // Delete messages
            await supabaseAdmin.from('messages').delete().eq('sender_id', publicUserId);
            await supabaseAdmin.from('messages').delete().eq('receiver_id', publicUserId);

            // Delete conversations
            await supabaseAdmin.from('conversations').delete().or(`participant1_id.eq.${publicUserId},participant2_id.eq.${publicUserId}`);

            // Delete the public.users record
            await supabaseAdmin.from('users').delete().eq('id', publicUserId);
        }

        // 3. Delete the auth user (this is the main deletion)
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);

        if (deleteAuthError) {
            console.error('Error deleting auth user:', deleteAuthError);
            return NextResponse.json({
                success: false,
                error: 'Failed to delete authentication record'
            }, { status: 500 });
        }

        console.log('Account deleted successfully:', authUserId);

        return NextResponse.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error: any) {
        console.error('Exception in account delete API:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
