
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, ''); // Remove quotes
            if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
            if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value;
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key. Url found:', !!supabaseUrl, 'Key found:', !!supabaseKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking users table...');

    // Get a single user to inspect structure
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    if (users && users.length > 0) {
        const user = users[0];
        console.log('User sample:', {
            id: user.id,
            auth_id: user.auth_id,
            email: user.email
        });

        if (user.id === user.auth_id) {
            console.log('CONCLUSION: id is SAME as auth_id');
        } else {
            console.log('CONCLUSION: id is DIFFERENT from auth_id');
        }
    } else {
        console.log('No users found to inspect.');
    }
}

checkSchema();
