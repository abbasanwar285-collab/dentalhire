import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

async function fixDuplicates() {
  const { data } = await supabase.from('patients_v2').select('*');
  
  // Group by name
  const byName = {};
  data.forEach(p => {
    const name = p.name.trim();
    if (!byName[name]) byName[name] = [];
    byName[name].push(p);
  });
  
  // Find duplicates
  const dupes = Object.entries(byName).filter(([_, arr]) => arr.length > 1);
  console.log(`Found ${dupes.length} duplicated patient names:`);
  
  for (const [name, records] of dupes) {
    console.log(`\n--- "${name}" (${records.length} records):`);
    records.forEach(r => {
      const plans = (r.treatment_plans || []);
      console.log(`  ID: ${r.id}`);
      console.log(`    Plans: ${plans.length}, Age: ${r.age}, Phone: ${r.phone}`);
      console.log(`    Created: ${r.created_at}`);
    });
    
    // Merge strategy: keep the record with the most data, merge plans
    // Sort by amount of data (plans length, then created_at)
    const allPlans = [];
    const planIds = new Set();
    records.forEach(r => {
      (r.treatment_plans || []).forEach(p => {
        if (!planIds.has(p.id)) {
          planIds.add(p.id);
          allPlans.push(p);
        }
      });
    });
    
    // Keep the record that has the most complete data (phone, age, etc.)
    // Prefer the one the user is currently viewing (most recent or has phone/age)
    const keeper = records.sort((a, b) => {
      // Prefer one with phone
      if (a.phone && !b.phone) return -1;
      if (!a.phone && b.phone) return 1;
      // Prefer one with age
      if (a.age && !b.age) return -1;
      if (!a.age && b.age) return 1;
      // Prefer newer
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })[0];
    
    const toDelete = records.filter(r => r.id !== keeper.id);
    
    console.log(`  KEEPING: ${keeper.id} (phone: ${keeper.phone}, age: ${keeper.age})`);
    console.log(`  DELETING: ${toDelete.map(r => r.id).join(', ')}`);
    console.log(`  MERGED plans count: ${allPlans.length}`);
    
    // Update keeper with all merged plans
    const { error: updateErr } = await supabase
      .from('patients_v2')
      .update({ treatment_plans: allPlans })
      .eq('id', keeper.id);
    
    if (updateErr) {
      console.error(`  FAILED to update keeper:`, updateErr);
      continue;
    }
    
    // Delete duplicates
    for (const dup of toDelete) {
      const { error: delErr } = await supabase
        .from('patients_v2')
        .delete()
        .eq('id', dup.id);
      if (delErr) console.error(`  FAILED to delete ${dup.id}:`, delErr);
      else console.log(`  DELETED duplicate: ${dup.id}`);
    }
  }
  
  console.log('\nDuplicate fix complete!');
  process.exit(0);
}

fixDuplicates();
