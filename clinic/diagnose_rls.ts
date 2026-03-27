
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
// IMPORTANT: We need a valid USER EMAIL/PASSWORD to test actual RLS, not just admin access
// But since we don't have user credentials, we will test Anon access vs Service Role (if available)
// or try to sign up a test user.

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnosePermissions() {
    console.log('--- Diagnosing RLS Permissions ---');

    // 1. Try Anon Read (Should fail if restricted to authenticated)
    console.log('\n[Test 1] Anonymous Read (Public Access Check)...');
    const { data: anonData, error: anonError } = await supabase.from('patients').select('id').limit(1);
    if (anonError) {
        console.log('✅ Anon Read Blocked/Failed as expected (or DB error):', anonError.message);
    } else {
        console.log('⚠️ Anon Read SUCCEEDED. Rows found:', anonData.length);
        console.log('   This means data might be publicly visible, but RLS usually blocks this for standard users.');
    }

    // 2. Try Anon Write (Should DEFINITELY fail)
    console.log('\n[Test 2] Anonymous Write...');
    const testId = 'rls_test_' + Date.now();
    const { error: writeError } = await supabase.from('patients').insert({
        id: testId,
        name: 'RLS Test User',
        age: 99
    });

    if (writeError) {
        console.log('✅ Anon Write Blocked as expected:', writeError.message);
    } else {
        console.log('❌ Anon Write SUCCEEDED! This is a security risk if RLS is enabled.');
        // Cleanup
        await supabase.from('patients').delete().eq('id', testId);
    }

    // 3. Test Auth Config
    console.log('\n[Settings] Checking Auth Configuration...');
    // We can't easily check internal Supabase settings via client, but we can infer from behavior.

    console.log('\n--- RECOMMENDATION ---');
    console.log('If the user is logged in but writes fail, check:');
    console.log('1. trigger on auth.users -> public.profiles (Is it failing?)');
    console.log('2. RLS Policy using "auth.uid()" vs just "authenticated" role.');
    console.log('   Current Policy: "for all to authenticated using (true) with check (true)"');
    console.log('   This policy essentially says "Any logged in user can do anything to any row".');
    console.log('   If writes fail, it means the user is NOT properly logged in or the token is invalid.');
}

diagnosePermissions();
