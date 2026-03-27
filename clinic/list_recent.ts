
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rwbovdtcnrkslrgdjzth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Ym92ZHRjbnJrc2xyZ2RqenRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYxMzE5NywiZXhwIjoyMDgwMTg5MTk3fQ.qGzMnKUcdljiPVychfFwPZQylHTAAhdUIDKmnCzKSD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function listRecent() {
    console.log('Listing recent patients...');

    const { data: patients, error } = await supabase
        .from('patients')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
console.error(error);
} else {
        patients.forEach(p => console.log(`${p.name} (${p.id})`));
    }
}

listRecent();
