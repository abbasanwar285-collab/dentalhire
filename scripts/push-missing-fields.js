import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';

const db = new Database('clinic.db');
const supabase = createClient('https://kmjqdtupptbakhpihqfc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8');

async function pushMissingFields() {
  const sqlitePatients = db.prepare('SELECT id, email, date_of_birth, blood_type, allergies, last_visit FROM patients').all();
  console.log(`Migrating missing fields for ${sqlitePatients.length} patients...`);
  
  for (const p of sqlitePatients) {
    const { error } = await supabase
      .from('patients_v2')
      .update({
        email: p.email || null,
        date_of_birth: p.date_of_birth || null,
        blood_type: p.blood_type || null,
        allergies: p.allergies || null,
        last_visit: p.last_visit || null
      })
      .eq('id', p.id);
      
    if (error) console.error(`Error migrating patient ${p.id}:`, error.message);
  }
  
  console.log('✅ Missing fields migration completed!');
}

pushMissingFields().catch(err => {
  console.error('💥 Migration failed:', err);
  process.exit(1);
});
