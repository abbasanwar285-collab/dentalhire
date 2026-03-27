import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('URL:', SUPABASE_URL ? 'Set' : 'Missing');
console.log('Key:', SUPABASE_KEY ? 'Set' : 'Missing');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkData() {
    // Simple query - just get all patients
    const { data, error } = await supabase
        .from('patients')
        .select('id, name');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`\n✅ Total patients in Supabase: ${data?.length || 0}`);
}

checkData().catch(console.error);
