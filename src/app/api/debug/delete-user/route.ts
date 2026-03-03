
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hbzuewfbqnjddoxukxyp.supabase.co';
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const targetEmail = 'reammuath2002@gmail.com';

        if (!key) {
            return NextResponse.json({ success: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable.' });
        }

        const supabaseAdmin = createClient(url, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Strategy 2: Find in public.users first
        const { data: publicUser, error: findError } = await supabaseAdmin
            .from('users')
            .select('auth_id, email')
            .eq('email', targetEmail)
            .single();

        if (findError) {
            // If not found in public users, we might be stuck. But let's report it.
            return NextResponse.json({ success: false, step: 'Find Public User', error: findError.message });
        }

        if (!publicUser) {
            return NextResponse.json({ success: false, message: 'User not found in public table' });
        }

        console.log('Found public user:', publicUser);

        // 3. Delete from Auth (which cascades)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(publicUser.auth_id);

        if (deleteError) {
            return NextResponse.json({ success: false, step: 'Delete Auth User', error: deleteError.message });
        }

        return NextResponse.json({
            success: true,
            message: `User ${targetEmail} deleted`,
            auth_id: publicUser.auth_id
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
