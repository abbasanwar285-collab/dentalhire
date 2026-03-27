
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPatients() {
    console.log('Checking patients...');
    // Search for Esraa
    const { data, error } = await supabase
        .from('patients')
        .select('id, name')
        .ilike('name', '%اسراء%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Patients found:', data);

    // Also check scans for these patients
    for (const p of data) {
        const { count } = await supabase
            .from('patient_scans')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', p.id);
        console.log(`Patient ${p.name} (${p.id}) has ${count} scans.`);
    }
}

checkPatients();
