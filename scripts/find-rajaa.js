import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://kmjqdtupptbakhpihqfc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8');

async function getRajaa() {
  const { data } = await supabase.from('patients_v2').select('id, name, treatment_plans');
  const raj = data.find(p => p.name.includes('رجاء') || p.name.includes('طاهر'));
  console.log(JSON.stringify(raj, null, 2));
}

getRajaa();
