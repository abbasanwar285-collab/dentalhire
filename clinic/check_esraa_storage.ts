
import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('Supabase credentials missing in environment variables.');
    // process.exit(1); // Optional: exit if critical
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ID_CORRECT = 'e14339a2-622d-47fc-b7e6-5ae486e6855a';
const ID_OLD = 'a79481b8-994f-475c-89ea-88453a5a4bea';

async function checkStorage() {
    console.log(`Checking storage for Correct ID: ${ID_CORRECT}`);
    const { data: correctFiles } = await supabase.storage.from('scans').list(ID_CORRECT);
    console.log(`Found ${correctFiles?.length} files in Correct ID folder.`);
    correctFiles?.forEach(f => console.log(` - ${f.name}`));

    console.log(`\nChecking storage for Old/Possible ID: ${ID_OLD}`);
    const { data: oldFiles } = await supabase.storage.from('scans').list(ID_OLD);
    console.log(`Found ${oldFiles?.length} files in Old ID folder.`);
    oldFiles?.forEach(f => console.log(` - ${f.name}`));

    // Also check for a folder named "1112026-asraa mohamed" if it exists as a root folder
    console.log(`\nChecking for orphaned folder-like names...`);
    const { data: root } = await supabase.storage.from('scans').list();
    const match = root?.find(f => f.name.includes('asraa') || f.name.includes('1112026'));
    if (match) {
        console.log(`FOUND Orphaned Folder: ${match.name}`);
        const { data: orphans } = await supabase.storage.from('scans').list(match.name);
        orphans?.forEach(f => console.log(` - ${match.name}/${f.name}`));
    }
}

checkStorage();
