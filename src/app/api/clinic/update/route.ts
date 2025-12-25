import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

        // Get the user's public.users.id from auth_id
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('auth_id', authUser.id)
            .single();

        if (userError || !userData) {
            console.error('User not found:', userError);
            return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
        }

        const userId = userData.id;

        // Get the update data from the request body
        const body = await request.json();
        const { name, description, website, city, address, phone } = body;

        // Build the update object (only include provided fields)
        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (website !== undefined) updateData.website = website;
        if (city !== undefined) updateData.city = city;
        if (address !== undefined) updateData.address = address;
        if (phone !== undefined) updateData.phone = phone;
        updateData.updated_at = new Date().toISOString();

        if (Object.keys(updateData).length === 1) {
            return NextResponse.json({ success: true, message: 'Nothing to update' });
        }

        // Update the clinic using admin client (bypasses RLS)
        const { data: updatedClinic, error: updateError } = await supabaseAdmin
            .from('clinics')
            .update(updateData)
            .eq('user_id', userId)
            .select('*')
            .single();

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        // If clinic doesn't exist, create it
        if (!updatedClinic) {
            console.log('Clinic not found, creating new one for user:', userId);
            const { data: newClinic, error: insertError } = await supabaseAdmin
                .from('clinics')
                .insert({
                    user_id: userId,
                    email: authUser.email || '',
                    ...updateData
                })
                .select('*')
                .single();

            if (insertError) {
                console.error('Insert error:', insertError);
                return NextResponse.json({ success: false, error: 'Failed to create clinic profile' }, { status: 500 });
            }

            return NextResponse.json({ success: true, data: newClinic });
        }

        console.log('Clinic updated successfully:', updatedClinic);
        return NextResponse.json({ success: true, data: updatedClinic });

    } catch (error: any) {
        console.error('Exception in clinic update API:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
