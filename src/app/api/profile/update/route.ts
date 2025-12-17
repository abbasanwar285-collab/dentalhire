import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role key for admin access (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    try {
        // Get the auth token from the request headers
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify the user's JWT token
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authUser) {
            console.error('Auth error:', authError);
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        // Get the update data from the request body
        const body = await request.json();
        const { firstName, lastName, city, phone, avatar } = body;

        // Build the update object (only include provided fields)
        const updateData: Record<string, any> = {};
        if (firstName !== undefined) updateData.first_name = firstName;
        if (lastName !== undefined) updateData.last_name = lastName;
        if (city !== undefined) updateData.city = city;
        if (phone !== undefined) updateData.phone = phone;
        if (avatar !== undefined) updateData.avatar = avatar;
        updateData.updated_at = new Date().toISOString();

        if (Object.keys(updateData).length === 1) {
            // Only updated_at, nothing to update
            return NextResponse.json({ success: true, message: 'Nothing to update' });
        }

        // Update the user's profile using admin client (bypasses RLS)
        const { data: updatedUser, error: updateError } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('auth_id', authUser.id)
            .select('id, first_name, last_name, city, phone, avatar, updated_at')
            .single();

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        if (!updatedUser) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        console.log('Profile updated successfully:', updatedUser);

        return NextResponse.json({
            success: true,
            data: {
                id: updatedUser.id,
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                city: updatedUser.city,
                phone: updatedUser.phone,
                avatar: updatedUser.avatar,
                updated_at: updatedUser.updated_at
            }
        });

    } catch (error: any) {
        console.error('Exception in profile update API:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
