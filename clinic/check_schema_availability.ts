
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log('--- Checking Supabase Schema ---');

    // 1. Check 'patient_scans' table
    try {
        const { error } = await supabase.from('patient_scans').select('*').limit(0);
        if (error) {
            console.log('❌ Table "patient_scans": FAILED');
            console.log('   Error:', error.message);
        } else {
            console.log('✅ Table "patient_scans": FOUND');

            // Check for 'file_path' column
            const { error: colError } = await supabase.from('patient_scans').select('file_path').limit(1);
            if (colError) {
                console.log('❌ Column "file_path" in "patient_scans": FAILED (Error: ' + colError.message + ')');
            } else {
                console.log('✅ Column "file_path" in "patient_scans": FOUND');
            }
        }
    } catch (err) {
        console.error('❌ Table "patient_scans": UNEXPECTED ERROR', err);
    }

    // 2. Check 'ortho_paid_amount' column in 'patients'
    try {
        const { error } = await supabase.from('patients').select('ortho_paid_amount').limit(1);
        if (error) {
            console.log('❌ Column "ortho_paid_amount" in "patients": FAILED');
            console.log('   Error:', error.message);
        } else {
            console.log('✅ Column "ortho_paid_amount" in "patients": FOUND');
        }
    } catch (err) {
        console.error('❌ Column "ortho_paid_amount" in "patients": UNEXPECTED ERROR', err);
    }
}

checkSchema();
