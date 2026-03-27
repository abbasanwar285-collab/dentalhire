const fs = require('fs');
const patients = JSON.parse(fs.readFileSync('src/data/patients.json', 'utf8'));

let totalCost = 0;
let totalPaid = 0;
let orthoCost = 0;
let orthoPaid = 0;
let consultationCount = 0;

let nonZeroTotalCost = 0;
let nonZeroOrthoCost = 0;

patients.forEach(p => {
    totalCost += p.total_cost || 0;
    totalPaid += p.paid_amount || 0;
    orthoCost += p.ortho_total_cost || 0;
    orthoPaid += p.ortho_paid_amount || 0;
    consultationCount += p.consultation_fee_count || 0;

    if ((p.total_cost || 0) > 0) nonZeroTotalCost++;
    if ((p.ortho_total_cost || 0) > 0) nonZeroOrthoCost++;
});

console.log('--- Financial Data Summary ---');
console.log('Total Patients:', patients.length);
console.log('Sum total_cost:', totalCost);
console.log('Sum paid_amount:', totalPaid);
console.log('Sum ortho_total_cost:', orthoCost);
console.log('Sum ortho_paid_amount:', orthoPaid);
console.log('Sum consultation_fee_count:', consultationCount);
console.log('Patients with > 0 total_cost:', nonZeroTotalCost);
console.log('Patients with > 0 ortho_total_cost:', nonZeroOrthoCost);
