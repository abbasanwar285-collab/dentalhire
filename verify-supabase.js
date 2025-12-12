
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually since we don't have dotenv
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing connection to:', url);
console.log('Using Key (first 10 chars):', key ? key.substring(0, 10) + '...' : 'MISSING');

if (!url || !key) {
    console.error('Missing URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
    try {
        // Try a simple public table select, or checking health
        // We'll just try to get the session, which doesn't require tables
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        // Even if table doesn't exist, we might get a different error than "Invalid API Key"
        // Better: try to sign in with a fake user to see the AUTH error
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'wrongpassword'
        });

        if (authError) {
            console.log('Auth Error:', authError.message);
            if (authError.message === 'Invalid API key') {
                console.error('FAIL: The API Key is INVALID.');
            } else {
                console.log('SUCCESS: The API Key is valid (we got a normal auth error like Invalid login credentials).');
            }
        } else {
            console.log('SUCCESS: Connection worked (unexpectedly logged in?)');
        }

    } catch (err) {
        console.error('Exception:', err);
    }
}

testConnection();
