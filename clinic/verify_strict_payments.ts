
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

// Simple env parser
const envConfig = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, 'utf-8').split('\n').reduce((acc, line) => {
        const [key, value] = line.split('=');
        if (key && value) {
acc[key.trim()] = value.trim();
}
        return acc;
    }, {} as Record<string, string>)
    : {};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envConfig.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const defaultDoc = 'dr_abbas';

async function verifyStrict() {
    console.log('--- START STRICT CHECK ---');
    const { data: patients, error } = await supabase.from('patients').select('*');
    if (error) {
throw error;
}

    const stats = {
        treatments: {} as Record<string, number>,
        doctors: {} as Record<string, number>
    };

    patients?.forEach(p => {
        // 1. Consultation
        const conFeeValue = (p.consultationFeeCount || 0) * 5;
        if (conFeeValue > 0) {
            stats.treatments['Consultation'] = (stats.treatments['Consultation'] || 0) + conFeeValue;
            stats.doctors[defaultDoc] = (stats.doctors[defaultDoc] || 0) + conFeeValue;
        }

        // 2. Ortho
        const orthoVisitsPaid = (p.orthoVisits || []).reduce((sum: number, v: any) => sum + (v.paymentReceived || 0), 0);
        const orthoPaidTotal = Math.max(p.ortho_paid_amount || 0, orthoVisitsPaid);
        if (orthoPaidTotal > 0) {
            const orthoDoc = p.ortho_doctor_id || defaultDoc;
            stats.treatments['Ortho'] = (stats.treatments['Ortho'] || 0) + orthoPaidTotal;
            stats.doctors[orthoDoc] = (stats.doctors[orthoDoc] || 0) + orthoPaidTotal;
        }

        // 3. STRICT Procedures
        (p.procedures || []).forEach((proc: any) => {
            const list = proc.payments || [];
            if (list.length > 0) {
                const paid = list.reduce((sum: number, pay: any) => sum + (pay.amount || 0), 0);

                const type = proc.type || 'Other';
                // No cleaning at all
                // type = type.replace(/[\d:,]/g, '').trim();
                // if (type.length > 0) {
                //    const words = type.split(/\s+/);
                //    type = [...new Set(words)].join(' ');
                // }

                // Minimal cleaning to match typical tooth removal ONLY if evident
                // E.g. "15: " prefix removal only?
                // if (type.includes(':')) {
                //     type = type.split(':')[1].trim();
                // }

                const dId = proc.doctorId || defaultDoc;

                if (paid > 0) {
                    stats.treatments[type] = (stats.treatments[type] || 0) + paid;
                    stats.doctors[dId] = (stats.doctors[dId] || 0) + paid;
                }
            }
        });

        // General payments (not attached to procedures) are ignored or put in General
        // If we want to verify the "Old" app, maybe it ignored them? 
        // Or maybe it put them in "Other"?
        // Let's print what "General" would be
        const generalPayments = (p.payments || []).reduce((sum: number, pay: any) => sum + (pay.amount || 0), 0);
        if (generalPayments > 0) {
            stats.treatments['General (Unattached)'] = (stats.treatments['General (Unattached)'] || 0) + generalPayments;
            stats.doctors[defaultDoc] = (stats.doctors[defaultDoc] || 0) + generalPayments;
        }
    });

    console.log('Strict Treatments:', JSON.stringify(stats.treatments, null, 2));
    console.log('Strict Doctors:', JSON.stringify(stats.doctors, null, 2));
}

verifyStrict().catch(console.error);
