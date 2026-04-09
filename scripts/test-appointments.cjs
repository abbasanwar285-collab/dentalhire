const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('appointments').select('*').limit(20);
  console.log('Sample appointments:');
  console.log(data.map(a => ({ date: a.date, time: a.time, status: a.status })));
  
  const todayStr = new Date().toISOString().split('T')[0];
  console.log('todayStr (yyyy-MM-dd):', todayStr);
}
run();
