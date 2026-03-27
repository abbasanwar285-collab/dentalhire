import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

// Get patients with procedures that have prices
const { data } = await supabase.from('patients')
  .select('id, name, total_cost, paid_amount, procedures, payments')
  .not('procedures', 'eq', '[]')
  .limit(10);

let count = 0;
for (const p of data) {
  const procs = p.procedures || [];
  if (procs.length === 0) continue;
  count++;
  console.log(`\n--- ${p.name} ---`);
  console.log(`  DB total_cost: ${p.total_cost}`);
  console.log(`  DB paid_amount: ${p.paid_amount}`);
  procs.forEach((pr, i) => {
    console.log(`  proc[${i}] keys: ${Object.keys(pr).join(', ')}`);
    console.log(`    name="${pr.name}" type="${pr.type}" price=${pr.price} amount=${pr.amount} cost=${pr.cost}`);
  });
  if (count >= 5) break;
}

// Also get patients with payments
const { data: payData } = await supabase.from('patients')
  .select('name, payments, total_cost, paid_amount')
  .not('payments', 'eq', '[]')
  .limit(3);

for (const p of payData) {
  const pays = p.payments || [];
  if (pays.length === 0) continue;
  console.log(`\n--- PAYMENTS for ${p.name} ---`);
  console.log(`  DB total_cost=${p.total_cost}  DB paid_amount=${p.paid_amount}`);
  pays.slice(0,3).forEach((py, i) => {
    console.log(`  pay[${i}] keys: ${Object.keys(py).join(', ')}`);
    console.log(`    amount=${py.amount} date=${py.date}`);
  });
  let paySum = pays.reduce((s, py) => s + (Number(py.amount) || 0), 0);
  console.log(`  Sum of payments: ${paySum}`);
}

process.exit(0);
