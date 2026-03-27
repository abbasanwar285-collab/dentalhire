
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rwbovdtcnrkslrgdjzth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Ym92ZHRjbnJrc2xyZ2RqenRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYxMzE5NywiZXhwIjoyMDgwMTg5MTk3fQ.qGzMnKUcdljiPVychfFwPZQylHTAAhdUIDKmnCzKSD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkIds() {
    const ids = [
        '1766070824184v3p8s', // UI ID
        '1706070824184v3p8s', // My Target Typo?
        '1766070590632ztiea', // Source Folder
        'a79481b8-994f-475c-89ea-88453a5a4bea', // Esraa (from old script)
    ];

    console.log('Checking IDs...');

    for (const id of ids) {
        const { data, error } = await supabase
            .from('patients')
            .select('id, name')
            .eq('id', id);

        if (data && data.length > 0) {
            console.log(`[FOUND] ${id} -> ${data[0].name}`);
        } else {
            console.log(`[NOT FOUND] ${id} (Error: ${error?.message || 'None'})`);
        }
    }
}

checkIds();
