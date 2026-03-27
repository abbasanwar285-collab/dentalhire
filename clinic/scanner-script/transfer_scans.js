const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function transferScans() {
    console.log('🔄 Starting scan transfer...\n');

    const sourcePatientId = 'a79481b8-994f-475c-89ea-88453a5a4bea'; // اسراء محمد
    const targetPatientId = 'e14339a2-622d-47fc-b7e6-5ae486e6855a'; // اسراء محمد علي

    try {
        // 1. Get current scans for source patient
        console.log('📋 Fetching scans from source patient...');
        const { data: sourceScans, error: fetchError } = await supabase
            .from('patient_scans')
            .select('*')
            .eq('patient_id', sourcePatientId)
            .ilike('file_name', '%asraa mohamed%');

        if (fetchError) throw fetchError;

        console.log(`✅ Found ${sourceScans.length} scans to transfer:\n`);
        sourceScans.forEach((scan, i) => {
            console.log(`   ${i + 1}. ${scan.file_name}`);
        });

        if (sourceScans.length === 0) {
            console.log('\n⚠️  No scans found to transfer.');
            return;
        }

        // 2. Update patient_id for these scans
        console.log('\n🔄 Transferring scans to target patient...');
        const { data: updateData, error: updateError } = await supabase
            .from('patient_scans')
            .update({ patient_id: targetPatientId })
            .eq('patient_id', sourcePatientId)
            .ilike('file_name', '%asraa mohamed%')
            .select();

        if (updateError) throw updateError;

        console.log(`✅ Successfully transferred ${updateData.length} scans!\n`);

        // 3. Verify the transfer
        console.log('🔍 Verifying transfer...');
        const { data: verifyScans, error: verifyError } = await supabase
            .from('patient_scans')
            .select('id, file_name, created_at')
            .eq('patient_id', targetPatientId)
            .order('created_at', { ascending: false });

        if (verifyError) throw verifyError;

        console.log(`✅ Target patient now has ${verifyScans.length} total scans:\n`);
        verifyScans.forEach((scan, i) => {
            const date = new Date(scan.created_at).toLocaleString('ar-IQ');
            console.log(`   ${i + 1}. ${scan.file_name} (${date})`);
        });

        console.log('\n🎉 Transfer completed successfully!');

    } catch (error) {
        console.error('❌ Error during transfer:', error.message);
        process.exit(1);
    }
}

transferScans();
