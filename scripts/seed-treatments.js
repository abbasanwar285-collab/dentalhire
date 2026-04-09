import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const treatments = [
  { id: '1', name: 'فحص', price: 0, duration: 15 },
  { id: '2', name: 'حشوة جذر (اندو)', price: 0, duration: 30 },
  { id: '3', name: 'حشوة ضوئية', price: 0, duration: 30 },
  { id: '4', name: 'تنظيف اسنان', price: 0, duration: 30 },
  { id: '5', name: 'زراعة اسنان', price: 0, duration: 45 },
  { id: '6', name: 'قلع', price: 0, duration: 30 },
  { id: '7', name: 'تحضير اسنان', price: 0, duration: 30 },
  { id: '8', name: 'الصاق كراون او جسر', price: 0, duration: 30 },
  { id: '9', name: 'متابعة للحالة', price: 0, duration: 15 },
  { id: '10', name: 'تجميل وتبيض اسنان', price: 0, duration: 45 },
  { id: '11', name: 'طبعة الكترونية', price: 0, duration: 15 },
  { id: '12', name: 'تقويم اسنان', price: 0, duration: 30 },
  { id: '13', name: 'ترقيع لثة او العظم', price: 0, duration: 45 },
  { id: '14', name: 'غيرها', price: 0, duration: 30 },
];

async function seedTreatments() {
  console.log('Checking existing treatments...');
  const { data: existing, error: checkError } = await supabase.from('app_treatments').select('id');
  
  if (checkError) {
    if (checkError.code === 'PGRST205' || checkError.code === 'PGRST116' || checkError.message?.includes('does not exist')) {
       console.log('Table app_treatments does not exist or cannot be accessed right now');
       return;
    }
    console.error('Error checking treatments:', checkError);
    return;
  }

  if (existing && existing.length > 0) {
    console.log(`There are already ${existing.length} treatments in the DB. Skip seeding.`);
    return;
  }

  console.log('No treatments found. Seeding default treatments...');
  
  for (const t of treatments) {
    const { error } = await supabase.from('app_treatments').upsert({
      id: t.id,
      name: t.name,
      price: t.price,
      duration: t.duration
    });
    
    if (error) {
       console.error(`Failed to insert ${t.name}:`, error);
    } else {
       console.log(`Inserted: ${t.name}`);
    }
  }
  
  console.log('Seeding complete.');
}

seedTreatments();
