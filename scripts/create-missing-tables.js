import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kmjqdtupptbakhpihqfc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createMissingTables() {
  console.log('Creating missing tables...');

  // Create app_settings table
  const { error: settingsErr } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.app_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        clinic_name TEXT DEFAULT 'Iris Clinic',
        clinic_phone TEXT DEFAULT '',
        clinic_address TEXT DEFAULT '',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
      );
      ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;
      INSERT INTO public.app_settings (id, clinic_name) VALUES ('default', 'Iris Clinic') ON CONFLICT (id) DO NOTHING;
    `
  });
  
  if (settingsErr) {
    console.log('Note: rpc exec_sql not available, trying direct insert for app_settings...');
    // Try inserting into settings directly (table might exist already)
    const { error: insertErr } = await supabase.from('app_settings').upsert({
      id: 'default',
      clinic_name: 'Iris Clinic',
      clinic_phone: '',
      clinic_address: ''
    });
    if (insertErr) {
      console.log('app_settings table does NOT exist and cannot be created via SDK. Need to create via Supabase Dashboard SQL editor.');
      console.log('Error:', insertErr.message);
    } else {
      console.log('✅ app_settings default row inserted!');
    }
  } else {
    console.log('✅ app_settings table created!');
  }

  // Create app_treatments table
  const { error: treatmentsErr } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.app_treatments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL DEFAULT 0,
        duration INTEGER DEFAULT 30,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
      );
      ALTER TABLE public.app_treatments DISABLE ROW LEVEL SECURITY;
    `
  });

  if (treatmentsErr) {
    console.log('Note: rpc exec_sql not available for app_treatments either.');
    // Test if it exists already
    const { error: testErr } = await supabase.from('app_treatments').select('id').limit(1);
    if (testErr) {
      console.log('app_treatments table does NOT exist. Need to create via Supabase Dashboard SQL editor.');
      console.log('Error:', testErr.message);
    } else {
      console.log('✅ app_treatments table already exists!');
    }
  } else {
    console.log('✅ app_treatments table created!');
  }

  process.exit(0);
}

createMissingTables();
