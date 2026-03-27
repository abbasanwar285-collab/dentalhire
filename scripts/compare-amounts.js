import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

const { data } = await supabase.from('patients')
  .select('id, name, total_cost, paid_amount, ortho_total_cost, ortho_paid_amount, procedures, payments, ortho_visits')
  .or('total_cost.gt.0,ortho_total_cost.gt.0')
  .order('total_cost', { ascending: false })
  .limit(5);

console.log('Found', data.length, 'patients with costs');
for (const p of data) {
  const procs = p.procedures || [];
  const pays = p.payments || [];
  const orthoV = p.ortho_visits || [];
  
  console.log(`\n=== ${p.name} (${p.id.substring(0,8)}) ===`);
  console.log(`  total_cost=${p.total_cost}  paid=${p.paid_amount}`);
  console.log(`  ortho_cost=${p.ortho_total_cost}  ortho_paid=${p.ortho_paid_amount}`);
  console.log(`  procedures=${procs.length}  payments=${pays.length}  ortho_visits=${orthoV.length}`);
  
  if (procs.length > 0) {
    procs.slice(0, 3).forEach((pr, i) => {
      console.log(`    proc[${i}]: "${pr.name||pr.type||'?'}"  price=${pr.price||pr.amount||pr.cost||0}`);
    });
  }
  if (pays.length > 0) {
    pays.slice(0, 3).forEach((py, i) => {
      console.log(`    pay[${i}]: amount=${py.amount}  date=${py.date}`);
    });
  }
}

// Also check patient currently being viewed
const { data: current } = await supabase.from('patients')
  .select('id, name, total_cost, paid_amount, ortho_total_cost, ortho_paid_amount, procedures, payments')
  .like('id', '8924a885%');

if (current && current[0]) {
  const p = current[0];
  console.log(`\n=== CURRENTLY VIEWED: ${p.name} ===`);
  console.log(`  total_cost=${p.total_cost}  paid=${p.paid_amount}`);
  console.log(`  procs=${(p.procedures||[]).length}  pays=${(p.payments||[]).length}`);
}

process.exit(0);
