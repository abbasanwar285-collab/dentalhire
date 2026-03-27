
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    console.log('Checking access to patients table...');
    const { data, error } = await supabase.from('patients').select('*').limit(1);
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Success! Data:', data);
    }
}

check();
