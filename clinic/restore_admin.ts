
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

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

async function restoreAdmin() {
    console.log('--- Restoring Admin ---');

    const adminUser = {
        email: '07810988380@clinic.com',
        name: 'د. عباس',
        role: 'admin',
        created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('allowed_users').upsert(adminUser);

    if (error) {
        console.error('Error restoring admin:', error);
    } else {
        console.log('Admin restored successfully:', adminUser);
    }
}

restoreAdmin().catch(console.error);
