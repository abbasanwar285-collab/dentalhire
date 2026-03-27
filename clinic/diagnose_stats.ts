import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');
const envConfig = fs.readFileSync(envPath, 'utf-8').split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        acc[key.trim()] = value.trim();
    }
    return acc;
}, {} as Record<string, string>);

const SUPABASE_URL = envConfig.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = envConfig.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const _getLocalDateStr = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

async function diagnoseStats() {
    console.log('--- START DIAGNOSTIC ---');
    const { data: patients } = await supabase.from('patients').select('*');
    // Unused variables removed: appointments, expenses

    if (!patients) {
        return;
    }

    const stats = {
        totalRevenueExpected: 0,
        totalPaid: 0,
        doctorStats: {} as Record<string, number>,
        treatmentStats: {} as Record<string, number>,
        debug: [] as string[]
    };

    const defaultDoc = 'dr_abbas';

    patients.forEach(p => {
        // 1. REVENUE CALCULATION (Potential)
        const procTotal = (p.procedures || []).reduce((sum, proc) => sum + (proc.price || 0), 0);
        const standardRevenue = Math.max(p.total_cost || 0, procTotal);
        const orthoRevenue = p.ortho_total_cost || 0;
        const conFeeValue = (p.consultationFeeCount || 0) * 5;

        const pTotalExpected = standardRevenue + orthoRevenue + conFeeValue;
        stats.totalRevenueExpected += pTotalExpected;

        // 2. PAID CALCULATION (Collections)
        const procPayments = (p.procedures || []).reduce((sum, proc) => {
            return sum + (proc.payments || []).reduce((pSum, pay) => pSum + (pay.amount || 0), 0);
        }, 0);
        const generalPayments = (p.payments || []).reduce((sum, pay) => sum + (pay.amount || 0), 0);
        const standardPaid = Math.max(p.paid_amount || 0, procPayments + generalPayments);

        const orthoVisitsPaid = (p.orthoVisits || []).reduce((sum, v) => sum + (v.paymentReceived || 0), 0);
        const orthoPaidTotal = Math.max(p.ortho_paid_amount || 0, orthoVisitsPaid);

        const pTotalPaid = standardPaid + orthoPaidTotal + conFeeValue;
        stats.totalPaid += pTotalPaid;

        // 3. ATTRIBUTION (Cash Basis)

        // a. Consultation
        if (conFeeValue > 0) {
            stats.treatmentStats['Consultation'] = (stats.treatmentStats['Consultation'] || 0) + conFeeValue;
            stats.doctorStats[defaultDoc] = (stats.doctorStats[defaultDoc] || 0) + conFeeValue;
        }

        // b. Ortho (Cash Basis)
        if (orthoPaidTotal > 0) {
            const orthoDoc = p.ortho_doctor_id || defaultDoc;
            stats.treatmentStats['Ortho'] = (stats.treatmentStats['Ortho'] || 0) + orthoPaidTotal;
            stats.doctorStats[orthoDoc] = (stats.doctorStats[orthoDoc] || 0) + orthoPaidTotal;
        }

        // c. Standard (Cash Basis)
        if (standardRevenue > 0 && standardPaid > 0) {
            const paidFactor = standardPaid / standardRevenue;

            if (procTotal > 0) {
                const ratio = standardRevenue / procTotal;
                (p.procedures || []).forEach(proc => {
                    const expectedVal = (proc.price || 0) * ratio;
                    const paidVal = expectedVal * paidFactor;

                    let type = proc.type || 'Other';
                    type = type.replace(/[\d:,]/g, '').trim();
                    if (type.length > 0) {
                        const words = type.split(/\s+/);
                        type = [...new Set(words)].join(' ');
                    }
                    const dId = proc.doctorId || defaultDoc;

                    stats.treatmentStats[type] = (stats.treatmentStats[type] || 0) + paidVal;
                    stats.doctorStats[dId] = (stats.doctorStats[dId] || 0) + paidVal;
                });
            } else {
                const paidVal = standardRevenue * paidFactor; // = standardPaid
                stats.treatmentStats['General Treatment'] = (stats.treatmentStats['General Treatment'] || 0) + paidVal;
                stats.doctorStats[defaultDoc] = (stats.doctorStats[defaultDoc] || 0) + paidVal;
            }
        }
    });

    console.log('Total Revenue:', stats.totalRevenueExpected);
    console.log('Treatment Distribution:', JSON.stringify(stats.treatmentStats, null, 2));
    console.log('Doctor Performance:', JSON.stringify(stats.doctorStats, null, 2));

    // Sort Treatments by value to see top list
    const sortedTreatments = Object.entries(stats.treatmentStats).sort(([, a], [, b]) => b - a);
    console.log('Sorted Treatments:', sortedTreatments.slice(0, 10));

    console.log('--- DEBUG LOGS (Sample) ---');
    console.log(stats.debug.slice(0, 20).join('\n'));
}

diagnoseStats().catch(console.error);
