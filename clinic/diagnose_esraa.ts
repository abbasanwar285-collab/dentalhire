
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rwbovdtcnrkslrgdjzth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Ym92ZHRjbnJrc2xyZ2RqenRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYxMzE5NywiZXhwIjoyMDgwMTg5MTk3fQ.qGzMnKUcdljiPVychfFwPZQylHTAAhdUIDKmnCzKSD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnose() {
    console.log('🔍 Diagnosing Esraa...');

    // 1. Find Patient
    const { data: patients } = await supabase
        .from('patients')
        .select('id, name')
        .ilike('name', '%asraa%') // Try different spellings if needed
        .or('name.ilike.%اسراء%,name.ilike.%Esraa%');

    if (!patients || patients.length === 0) {
        console.log('❌ Patient not found in DB');
        return;
    }

    console.log('✅ Found Patients:', patients);
    const _patient = patients[0]; // Assuming first is target, but will log all

    // 2. Check DB Records for this patient
    for (const p of patients) {
        const { count } = await supabase
            .from('patient_scans')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', p.id);
        console.log(`   - Patient ${p.name} (${p.id}): ${count} scans in DB`);

        // 3. Check Storage Folder for this patient
        const { data: files } = await supabase.storage.from('scans').list(p.id);
        console.log(`   - Storage Folder (${p.id}): ${files?.length || 0} files`);
        if (files) {
files.forEach(f => console.log(`     - ${f.name}`));
}
    }

    // 4. Global Search for "1112026-asraa" (from screenshot)
    console.log('\n🌍 Deep Search for "asraa" or "1112026" in ALL folders...');
    const { data: topFolders } = await supabase.storage.from('scans').list('', { limit: 100 });

    if (topFolders) {
        for (const folder of topFolders) {
            if (folder.name === '.emptyFolderPlaceholder') {
continue;
}

            const { data: contents } = await supabase.storage.from('scans').list(folder.name);
            if (!contents) {
continue;
}

            const matches = contents.filter(f =>
                f.name.toLowerCase().includes('asraa') ||
                f.name.includes('1112026')
            );

            if (matches.length > 0) {
                console.log(`   🚨 FOUND in folder ${folder.name}:`);
                matches.forEach(m => console.log(`      - ${m.name}`));
            }
        }
    }
}

diagnose();
