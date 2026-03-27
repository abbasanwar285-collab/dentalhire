import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

async function checkPatient() {
  const id = '8da13877-649f-4218-95c6-356b21797024'; // ابراهيم علي ابراهيم
  
  const { data: oldData } = await supabase.from('patients').select('*').eq('id', id).single();
  const { data: v2Data } = await supabase.from('patients_v2').select('*').eq('id', id).single();
  
  const result = {
    old: oldData,
    v2: v2Data
  };
  
  fs.writeFileSync('patient-debug.json', JSON.stringify(result, null, 2));
  console.log('Saved to patient-debug.json');
}

checkPatient().then(() => process.exit(0));
