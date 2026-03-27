import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://kmjqdtupptbakhpihqfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8'
);

async function listAllTables() {
  // Query pg_tables to see all public tables
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
  });
  
  if (error) {
    // Fallback: try to probe known tables
    console.log('Cannot use RPC, probing known tables...');
    const tables = [
      'patients', 'patients_v2',
      'appointments', 'appointments_v2',
      'expenses', 'expenses_v2',
      'users', 'users_v2', 'app_users',
      'treatments', 'app_treatments',
      'settings', 'app_settings',
      'tasks', 'app_tasks',
      'supply_requests', 'app_supply_requests',
      'ortho_visits', 'payments', 'procedures',
      'scans', 'invitations',
      'doctors', 'waiting_room', 'arrival_records'
    ];
    
    for (const t of tables) {
      const { data: d, error: e } = await supabase.from(t).select('*', { count: 'exact', head: true });
      if (!e) {
        console.log(`✅ ${t}: exists (${d ? 'accessible' : 'empty'})`);
      } else if (e.message?.includes('Could not find') || e.code === 'PGRST205') {
        // Table doesn't exist
      } else {
        console.log(`⚠️ ${t}: error - ${e.message}`);
      }
    }
  } else {
    console.log('Tables:', data);
  }
  
  process.exit(0);
}

listAllTables();
