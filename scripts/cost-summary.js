import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

// Summary: count patients by cost status
const { data } = await supabase.from('patients').select('name, total_cost, paid_amount, ortho_total_cost, ortho_paid_amount');

let withGenCost = 0, withOrthoCost = 0, noCost = 0;
let totalGenCost = 0, totalOrthoCost = 0;
let topPatients = [];

for (const p of data) {
  const gc = Number(p.total_cost) || 0;
  const oc = Number(p.ortho_total_cost) || 0;
  if (gc > 0) { withGenCost++; totalGenCost += gc; }
  if (oc > 0) { withOrthoCost++; totalOrthoCost += oc; }
  if (gc === 0 && oc === 0) noCost++;
  if (gc > 0 || oc > 0) topPatients.push({ name: p.name, gc, gp: Number(p.paid_amount)||0, oc, op: Number(p.ortho_paid_amount)||0 });
}

console.log('=== SUMMARY ===');
console.log(`Total patients: ${data.length}`);
console.log(`With general cost >0: ${withGenCost}  (sum: ${totalGenCost})`);
console.log(`With ortho cost >0: ${withOrthoCost}  (sum: ${totalOrthoCost})`);
console.log(`With zero cost: ${noCost}`);

// Show top 5 patients with costs
topPatients.sort((a, b) => (b.gc + b.oc) - (a.gc + a.oc));
console.log('\n=== TOP PATIENTS WITH COSTS ===');
topPatients.slice(0, 8).forEach(p => {
  console.log(`  ${p.name}: gen=${p.gc}/${p.gp}paid  ortho=${p.oc}/${p.op}paid`);
});

process.exit(0);
