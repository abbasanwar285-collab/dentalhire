
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase credentials missing');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    console.log('Checking database...');

    // 1. Get Total Count
    const { count, error: countError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Error getting count:', countError);
    } else {
        console.log(`Total patients in DB: ${count}`);
    }

    // 2. Search for "Dunia Noor" (trying potential spelling variations/partial match)
    // Note: User said "دنيا نور" (Arabic) or "Dunia Noor" (English)? 
    // The user wrote "دنيا نور" in the prompt.
    const searchName = "دنيا";
    const { data, error: searchError } = await supabase
        .from('patients')
        .select('id, name, created_at')
        .ilike('name', `%${searchName}%`);

    if (searchError) {
        console.error('Error searching:', searchError);
    } else {
        console.log(`Found ${data?.length} matches for "${searchName}":`);
        data?.forEach(p => console.log(` - ${p.name} (ID: ${p.id}, Created: ${p.created_at})`));
    }
}

check();
