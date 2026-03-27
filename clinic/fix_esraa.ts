
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rwbovdtcnrkslrgdjzth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Ym92ZHRjbnJrc2xyZ2RqenRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYxMzE5NywiZXhwIjoyMDgwMTg5MTk3fQ.qGzMnKUcdljiPVychfFwPZQylHTAAhdUIDKmnCzKSD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const OLD_ID = 'a79481b8-994f-475c-89ea-88453a5a4bea';
const NEW_ID = 'e14339a2-622d-47fc-b7e6-5ae486e6855a';

async function fixEsraa() {
    console.log(`🚀 Moving scans from ${OLD_ID} to ${NEW_ID}...`);

    const { data: files } = await supabase.storage.from('scans').list(OLD_ID);
    if (!files || files.length === 0) {
        console.log('No files found to move.');
        return;
    }

    console.log(`Found ${files.length} files. Processing...`);

    for (const file of files) {
        const oldPath = `${OLD_ID}/${file.name}`;
        const newPath = `${NEW_ID}/${file.name}`;

        console.log(`Processing: ${file.name}`);

        try {
            // 1. Copy File
            const { error: copyError } = await supabase.storage.from('scans').move(oldPath, newPath);
            if (copyError) {
                console.error(`  ❌ Move failed:`, copyError.message);
                continue;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage.from('scans').getPublicUrl(newPath);

            // 3. Insert into DB
            const { error: dbError } = await supabase.from('patient_scans').insert({
                id: crypto.randomUUID(), // New scan ID
                patient_id: NEW_ID,
                file_name: file.name,
                file_url: publicUrl,
                file_path: newPath,
                scan_date: file.created_at || new Date().toISOString(),
                created_at: file.created_at || new Date().toISOString()
            });

            if (dbError) {
                console.error(`  ❌ DB Insert failed:`, dbError.message);
            } else {
                console.log(`  ✅ Success!`);
            }

        } catch (e) {
            console.error(`  ❌ Unexpected error:`, e);
        }
    }
    console.log('🎉 Migration Complete!');
}

fixEsraa();
