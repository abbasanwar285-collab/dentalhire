
/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Supabase credentials missing.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function searchPatients() {
    console.log('Searching for Reza/Ahmed/Hashem/Zainab...');

    const { data, error } = await supabase
        .from('patients')
        .select('id, name')
        .or('name.ilike.%Reza%,name.ilike.%Ahmed%,name.ilike.%Hashem%,name.ilike.%Zainab%,name.ilike.%زينب%,name.ilike.%أحمد%,name.ilike.%رضا%');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Found Patients:');
        data.forEach(p => console.log(`- ${p.name}: ${p.id}`));
    }
}

searchPatients();
