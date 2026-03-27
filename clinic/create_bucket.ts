
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kmjqdtupptbakhpihqfc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createBucket() {
    console.log("Attempting to create 'scans' bucket...");

    // Check if bucket exists first
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.error("Error listing buckets:", listError.message);
        return;
    }

    const exists = buckets.find(b => b.name === 'scans');
    if (exists) {
        console.log("'scans' bucket already exists.");
        return;
    }

    // Create bucket
    const { data, error } = await supabase.storage.createBucket('scans', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/*', 'application/pdf']
    });

    if (error) {
        console.error("Error creating bucket:", error.message);
    } else {
        console.log("'scans' bucket created successfully!");
    }
}

createBucket();
