/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase credentials missing.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PATIENT_ID = '1706070824184v3p8s'; // From screenshot

async function check() {
    console.log('--- Checking Buckets ---');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
        console.error('Bucket Error:', bucketError);
    } else {
        console.log('Buckets:', buckets?.map(b => `${b.name} (public: ${b.public})`));
    }

    console.log('\n--- Checking Scans Root ---');
    const { data: rootFiles, error: rootError } = await supabase.storage.from('scans').list();
    if (rootError) {
        console.error('Root List Error:', rootError);
    } else {
        console.log(`Files/Folders in root of 'scans':`, rootFiles?.map(f => f.name));
    }

    console.log(`\n--- Checking Folder: ${PATIENT_ID} ---`);
    // 1. Check DB Table
    const { data: tableData, error: tableError } = await supabase
        .from('patient_scans')
        .select('*')
        .eq('patient_id', PATIENT_ID);

    if (tableError) {
        console.error('DB Error:', tableError);
    } else {
        console.log(`Found ${tableData?.length} records in DB table.`);
    }
    if (tableData?.length === 0) {
        console.log('WARNING: No records in DB table, this is likely why UI is empty.');
    }

    // 2. Check Storage Bucket
    const { data: storageData, error: storageError } = await supabase
        .storage
        .from('scans')
        .list(PATIENT_ID); // List files in patient's folder

    if (storageError) {
        console.error('Storage Error:', storageError);
    } else {
        console.log(`Found ${storageData?.length} files in Storage bucket folder '${PATIENT_ID}':`);
        storageData?.forEach(f => console.log(` - ${f.name} (${(f.metadata?.size / 1024 / 1024).toFixed(2)} MB)`));
    }
}

check();
