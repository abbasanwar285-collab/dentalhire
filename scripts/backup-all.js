import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

async function backup() {
  const tables = [
    'patients', 'patients_v2',
    'appointments', 'appointments_v2',
    'expenses', 'expenses_v2',
    'app_users', 'allowed_users',
    'app_supply_requests', 'app_tasks',
    'inventory_items', 'patient_scans', 'audit_logs'
  ];

  const backup = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.log(`⚠️ ${table}: ${error.message}`);
        continue;
      }
      backup[table] = data || [];
      console.log(`✅ ${table}: ${(data || []).length} records`);
    } catch (e) {
      console.log(`❌ ${table}: failed`);
    }
  }
  
  const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
  console.log(`\n💾 Backup saved to: ${filename}`);
  console.log(`Total size: ${(fs.statSync(filename).size / 1024).toFixed(1)} KB`);
  process.exit(0);
}

backup();
