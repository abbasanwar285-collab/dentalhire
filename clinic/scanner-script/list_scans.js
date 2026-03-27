const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env');
    console.log('URL:', SUPABASE_URL ? 'Set' : 'Missing');
    console.log('KEY:', SUPABASE_KEY ? 'Set' : 'Missing');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listScans() {
    console.log('🔄 Listing scans...');

    try {
        const { data: scans, error } = await supabase
            .from('patient_scans')
            .select('patient_id, file_name, created_at')
            .limit(10)
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log(`✅ Found ${scans.length} scans:\n`);
        scans.forEach((scan, i) => {
            console.log(`- Patient: ${scan.patient_id}`);
            console.log(`  File: ${scan.file_name}`);
            console.log(`  Date: ${scan.created_at}`);
            console.log('---');
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

listScans();
