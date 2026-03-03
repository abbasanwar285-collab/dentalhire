import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role key for admin access (bypasses RLS)
// Client initialized lazily inside handler


export async function POST(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hbzuewfbqnjddoxukxyp.supabase.co';
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

        // Self-Healing: If user not found via update, try to insert (recover from specific auth trigger failures)
        if (!updatedUser) {
            console.log('User not found via update, attempting self-healing insert for:', authUser.id);

            // We need email for insert
            const email = authUser.email;
            if (!email) {
                return NextResponse.json({ success: false, error: 'User email not found in auth token' }, { status: 400 });
            }

            const { data: insertedUser, error: insertError } = await supabaseAdmin
                .from('users')
                .insert({
                    auth_id: authUser.id,
                    email: email,
                    first_name: firstName || '',
                    last_name: lastName || '',
                    role: 'job_seeker', // Default role if recovering
                    user_type: 'dental_assistant', // Default type
                    ...updateData
                })
                .select('id, first_name, last_name, city, phone, avatar, updated_at')
                .single();

            if (insertError) {
                console.error('Self-healing insert error:', insertError);
                return NextResponse.json({ success: false, error: 'Failed to create profile: ' + insertError.message }, { status: 500 });
            }

            console.log('Profile self-healed successfully:', insertedUser);
            return NextResponse.json({
                success: true,
                data: {
                    id: insertedUser.id,
                    first_name: insertedUser.first_name,
                    last_name: insertedUser.last_name,
                    city: insertedUser.city,
                    phone: insertedUser.phone,
                    avatar: insertedUser.avatar,
                    updated_at: insertedUser.updated_at
                }
            });
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
