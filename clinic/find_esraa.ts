
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rwbovdtcnrkslrgdjzth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Ym92ZHRjbnJrc2xyZ2RqenRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYxMzE5NywiZXhwIjoyMDgwMTg5MTk3fQ.qGzMnKUcdljiPVychfFwPZQylHTAAhdUIDKmnCzKSD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function findEsraa() {
    console.log('Searching for any Esraa...');

    // Search Arabic and English variations
    const { data, error } = await supabase
        .from('patients')
        .select('id, name')
        .or('name.ilike.%اسراء%,name.ilike.%إسراء%,name.ilike.%Esraa%,name.ilike.%Asraa%');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Found Patients:');
        data.forEach(p => console.log(`- ${p.name}: ${p.id}`));
    }
}

findEsraa();
