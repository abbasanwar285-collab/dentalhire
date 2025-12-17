
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hbzuewfbqnjddoxukxyp.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhienVld2ZicW5qZGRveHVreHlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTE3ODIxOCwiZXhwIjoyMDgwNzU0MjE4fQ.0DFyq4-csfSQPcUrF9OYBi9jZVuUYwaJZlm_7djDb6Y';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testUpdate() {
    console.log('Testing Admin Client Connection...');

    // 1. Try to find the user 'toqaquiz@gmail.com'
    console.log('Searching for user toqaquiz@gmail.com...');

    // We need to query the 'users' table directly first to find the auth_id or id
    // OR query auth.users if we had access (admin client usually has access to auth.admin)

    // Try querying public.users first
    const { data: users, error: searchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', 'toqaquiz@gmail.com');

    if (searchError) {
        console.error('Error searching public.users:', searchError);
    } else {
        console.log(`Found ${users.length} users in public.users`);
        if (users.length > 0) {
            console.log('User Data:', users[0]);
            const targetUser = users[0];

            // 2. Try to update this user
            console.log(`Attempting to update user ${targetUser.id} (Auth ID: ${targetUser.auth_id})...`);

            const updatePayload = {
                updated_at: new Date().toISOString(),
                // city: 'Debug City' // Uncomment to test actual field change
            };

            const { data: updated, error: updateError } = await supabaseAdmin
                .from('users')
                .update(updatePayload)
                .eq('id', targetUser.id)
                .select()
                .single();

            if (updateError) {
                console.error('UPDATE FAILED:', updateError);
            } else {
                console.log('UPDATE SUCCESS:', updated);
            }
        } else {
            console.log('User not found in public.users. Trying Auth Admin...');
            const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
            if (authError) {
                console.error('Error listing auth users:', authError);
            } else {
                const foundAuth = authUsers.find(u => u.email === 'toqaquiz@gmail.com');
                if (foundAuth) {
                    console.log('Found in Auth:', foundAuth.id);
                } else {
                    console.log('User not found in Auth either.');
                }
            }
        }
    }
}

testUpdate();
