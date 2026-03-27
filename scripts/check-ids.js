import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const data = JSON.parse(fs.readFileSync('clinic/clinic_all_database_data.json', 'utf8'));
const supabase = createClient('https://kmjqdtupptbakhpihqfc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8');

async function checkIds() {
  const { data: supaPatients } = await supabase.from('patients_v2').select('id, name');
  
  let matchCount = 0;
  for (const oldP of data.patients) {
    if (supaPatients.find(s => s.id === oldP.id)) {
      matchCount++;
    }
  }
  console.log(`Matched ${matchCount} out of ${data.patients.length} old patients by ID.`);
}

checkIds();
