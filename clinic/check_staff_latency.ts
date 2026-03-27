
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

// Simple env parser
const envConfig = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, 'utf-8').split('\n').reduce((acc, line) => {
        const [key, value] = line.split('=');
        if (key && value) {
acc[key.trim()] = value.trim();
}
        return acc;
    }, {} as Record<string, string>)
    : {};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envConfig.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkLatency() {
    console.log('--- Checking Staff Query Latency ---');
    const start = Date.now();
    const { data, error } = await supabase.from('allowed_users').select('*').order('name', { ascending: true });
    const duration = Date.now() - start;

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Fetched ${data?.length} users in ${duration}ms`);
        console.log('Data:', data);
    }
}

checkLatency().catch(console.error);
