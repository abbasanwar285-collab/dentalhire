
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kmjqdtupptbakhpihqfc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkCounts() {
    const tables = ['allowed_users', 'patients', 'appointments', 'expenses', 'inventory_items', 'patient_scans', 'audit_logs'];

    console.log('--- Verification Report ---');
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`${table}: ERROR - ${error.message}`);
        } else {
            console.log(`${table}: ${count} records`);
        }
    }
}

checkCounts();
