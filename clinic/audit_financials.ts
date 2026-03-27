
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rwbovdtcnrkslrgdjzth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Ym92ZHRjbnJrc2xyZ2RqenRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYxMzE5NywiZXhwIjoyMDgwMTg5MTk3fQ.qGzMnKUcdljiPVychfFwPZQylHTAAhdUIDKmnCzKSD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function auditFinancials() {
    console.log('--- Financial Audit ---');
    const { data: patients, error } = await supabase.from('patients').select('*');
    if (error) {
        console.error('Error:', error);
        return;
    }

    let totalManualCost = 0;
    let totalManualPaid = 0;
    let totalOrthoCost = 0;
    let totalOrthoPaid = 0;
    let totalProcPrice = 0;
    let totalProcPaid = 0;
    let totalGeneralPaid = 0;

    patients.forEach(p => {
        totalManualCost += (p.total_cost || 0);
        totalManualPaid += (p.paid_amount || 0);
        totalOrthoCost += (p.ortho_total_cost || 0);
        totalOrthoPaid += (p.ortho_paid_amount || 0);

        (p.procedures || []).forEach((proc: any) => {
            totalProcPrice += (proc.price || 0);
            (proc.payments || []).forEach((pay: any) => {
                totalProcPaid += (pay.amount || 0);
            });
        });

        (p.payments || []).forEach((pay: any) => {
            totalGeneralPaid += (pay.amount || 0);
        });
    });

    console.log(`Patients count: ${patients.length}`);
    console.log(`Total Manual Cost: ${totalManualCost}`);
    console.log(`Total Manual Paid: ${totalManualPaid}`);
    console.log(`Total Ortho Cost: ${totalOrthoCost}`);
    console.log(`Total Ortho Paid: ${totalOrthoPaid}`);
    console.log(`Total Procedure Prices: ${totalProcPrice}`);
    console.log(`Total Payments in Procedures: ${totalProcPaid}`);
    console.log(`Total General Payments: ${totalGeneralPaid}`);

    const { data: expenses } = await supabase.from('expenses').select('amount');
    const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    console.log(`Total Expenses: ${totalExpenses}`);
}

auditFinancials();
