import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';

const db = new Database('clinic.db');
const supabase = createClient('https://kmjqdtupptbakhpihqfc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8');

async function check() {
  const sqlitePatients = db.prepare('SELECT id, treatment_plans FROM patients').all();
  let sqlitePlansCount = 0;
  for (const p of sqlitePatients) {
    if (p.treatment_plans && p.treatment_plans !== '[]' && p.treatment_plans !== '') {
      sqlitePlansCount++;
    }
  }

  const { data: supabasePatients, error } = await supabase.from('patients_v2').select('id, treatment_plans');
  let supabasePlansCount = 0;
  for (const p of (supabasePatients || [])) {
    if (p.treatment_plans && p.treatment_plans.length > 0) {
      supabasePlansCount++;
    }
  }

  console.log(`SQLite patients with plans: ${sqlitePlansCount}`);
  console.log(`Supabase patients with plans: ${supabasePlansCount}`);
}

check();
