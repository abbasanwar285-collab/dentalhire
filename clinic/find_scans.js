const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findPatientsWithScans() {
    console.log('🔍 Searching for patients with scans...');

    // Get unique patient_ids from patient_scans
    const { data: scans, error } = await supabase
        .from('patient_scans')
        .select('patient_id, file_name')
        .limit(5);

    if (error) {
        console.error('Error fetching scans:', error);
        return;
    }

    if (!scans || scans.length === 0) {
        console.log('❌ No scans found in the database.');
        return;
    }

    console.log(`✅ Found ${scans.length} scans. Listing patients...`);

    for (const scan of scans) {
        const { data: patient } = await supabase
            .from('patients')
            .select('name')
            .eq('id', scan.patient_id)
            .single();

        console.log(`- Patient: ${patient ? patient.name : 'Unknown'} (ID: ${scan.patient_id}) - File: ${scan.file_name}`);
    }
}

findPatientsWithScans();
