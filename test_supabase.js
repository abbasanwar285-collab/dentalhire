import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if(!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log("Testing connection to Supabase...");
  
  const tables = ['patients_v2', 'appointments_v2', 'expenses_v2', 'app_users', 'app_supply_requests', 'app_tasks', 'app_settings', 'app_treatments'];
  
  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`Error accessing table ${table}:`, error.message);
    } else {
      console.log(`Success: Table ${table} exists (count: ${count})`);
    }
  }
}

testConnection();
