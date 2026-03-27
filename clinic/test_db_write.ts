
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testWrite() {
    console.log('--- Testing Supabase Write (Upsert Patient: Full Payload) ---');

    const testId = 'test_sync_full_' + Date.now();

    // Simulate what AddPatient.tsx constructs
    // Note: parseInt("") is NaN. NaN in JSON stringify becomes null.
    // We simulate a typical new patient entry
    const newPatient = {
        id: testId,
        name: 'Test Patient Full ' + new Date().toISOString(),
        age: parseInt("30"), // Normal case
        mobile: "07712345678",
        notes: "Test notes",
        diagnosis: "Test diagnosis",
        consultationFeePaid: true,
        consultationFeeCount: 1,
        // createdAt: Date.now(), // db.ts assumes DB default if not sent, wait db.ts DOES NOT send createdAt in savePatient
        procedures: [],
        orthoVisits: [],
        payments: [],
        scans: [],
        totalCost: 0,
        paidAmount: 0,
        isDebtOnly: false,

        // These are undefined in AddPatient for new patient
        orthoDoctorId: undefined,
        orthoTotalCost: undefined,
        orthoPaidAmount: undefined,
        orthoDiagnosis: undefined
    };

    // Construct exactly what db.ts sends
    const dbData = {
        id: newPatient.id,
        name: newPatient.name,
        mobile: newPatient.mobile,
        age: newPatient.age,
        gender: undefined, // AddPatient doesn't seem to set gender in the code I saw?
        total_cost: newPatient.totalCost,
        paid_amount: newPatient.paidAmount,
        diagnosis: newPatient.diagnosis,
        procedures: newPatient.procedures,
        // scans: newPatient.scans,
        notes: newPatient.notes,
        // is_debt_only: newPatient.isDebtOnly,
        ortho_doctor_id: newPatient.orthoDoctorId,
        ortho_total_cost: newPatient.orthoTotalCost,
        ortho_paid_amount: newPatient.orthoPaidAmount,
        ortho_diagnosis: newPatient.orthoDiagnosis,
        ortho_visits: newPatient.orthoVisits,
        consultation_fee_paid: newPatient.consultationFeePaid,
        consultation_fee_count: newPatient.consultationFeeCount,
        payments: newPatient.payments
    };

    console.log('Sending payload:', JSON.stringify(dbData, null, 2));

    try {
        const { data, error } = await supabase.from('patients').upsert(dbData).select();

        if (error) {
            console.log('❌ Write Failed:', error.message);
            console.log('Error details:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Write Success! Patient ID:', testId);
            console.log('Data:', data);

            // Clean up
            console.log('Cleaning up test record...');
            await supabase.from('patients').delete().eq('id', testId);
            console.log('Cleanup done.');
        }
    } catch (err) {
        console.error('❌ Unexpected Error during write:', err);
    }
}

testWrite();
