import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

async function cleanup() {
  // Delete any diagnostic test patients created by browser subagent
  const { data } = await supabase.from('patients_v2').select('id, name').like('id', 'diag-test%');
  if (data && data.length > 0) {
    for (const p of data) {
      await supabase.from('patients_v2').delete().eq('id', p.id);
      console.log('Deleted test patient:', p.id, p.name);
    }
  } else {
    console.log('No test patients found.');
  }
  process.exit(0);
}
cleanup();
