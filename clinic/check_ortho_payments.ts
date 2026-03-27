
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rwbovdtcnrkslrgdjzth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Ym92ZHRjbnJrc2xyZ2RqenRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYxMzE5NywiZXhwIjoyMDgwMTg5MTk3fQ.qGzMnKUcdljiPVychfFwPZQylHTAAhdUIDKmnCzKSD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkOrthoPayments() {
    const { data: patients, error } = await supabase.from('patients').select('name, ortho_visits');
    if (error) {
        console.error(error);
        return;
    }

    let found = false;
    patients.forEach(p => {
        if (p.ortho_visits && Array.isArray(p.ortho_visits) && p.ortho_visits.length > 0) {
            console.log(`Patient: ${p.name}, Visits:`, JSON.stringify(p.ortho_visits, null, 2));
            found = true;
        }
    });

    if (!found) {
        console.log('No patients found with ortho_visits data.');
    }
}

checkOrthoPayments();
