
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rwbovdtcnrkslrgdjzth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Ym92ZHRjbnJrc2xyZ2RqenRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYxMzE5NywiZXhwIjoyMDgwMTg5MTk3fQ.qGzMnKUcdljiPVychfFwPZQylHTAAhdUIDKmnCzKSD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const VOID_ID = '1706070824184v3p8s'; // The typo ID
const ZAINAB_ID = '1766070590632ztiea'; // The correct owner

async function restoreFiles() {
    console.log(`Restoring files from ${VOID_ID} to ${ZAINAB_ID}...`);

    const { data: files } = await supabase.storage.from('scans').list(VOID_ID);

    if (!files || files.length === 0) {
        console.log('No files found in void folder (maybe already restored?).');
        return;
    }

    console.log(`Found ${files.length} files.`);

    for (const file of files) {
        if (file.name.startsWith('.')) {
continue;
}

        const src = `${VOID_ID}/${file.name}`;
        const dest = `${ZAINAB_ID}/${file.name}`;

        console.log(`Moving ${file.name}...`);

        const { error: moveError } = await supabase.storage.from('scans').move(src, dest);

        if (moveError) {
            console.error(`Failed to move ${file.name}:`, moveError.message);
        } else {
            console.log(`Restored ${file.name}`);
        }
    }
    console.log('Restoration complete.');
}

restoreFiles();
