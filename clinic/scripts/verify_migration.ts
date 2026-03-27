
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPORT_DIR = path.join(__dirname, '..', 'database_export_2026-01-26T18-40-31-815Z');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const TABLES = [
    'patients',
    'appointments',
    'inventory_items',
    'expenses',
    'patient_scans',
    'audit_logs'
];

async function verify() {
    console.log('--- VERIFYING MIGRATION ---');

    if (!SUPABASE_URL) {
        console.error('❌ Supabase URL missing in .env');
        return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    for (const table of TABLES) {
        console.log(`\nChecking [${table}]...`);

        // 1. Local Count
        let localCount = 0;
        try {
            const filePath = path.join(EXPORT_DIR, `${table}.json`);
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                localCount = data.length;
            }
        } catch (e) {
            console.error(`   ❌ Error reading local file for ${table}`);
        }

        // 2. Remote Count
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error(`   ❌ Supabase Error:`, error.message);
            continue;
        }

        const remoteCount = count || 0;

        console.log(`   📂 Local Records:  ${localCount}`);
        console.log(`   ☁️  Remote Records: ${remoteCount}`);

        if (localCount !== remoteCount) {
            console.log(`   ⚠️  MISMATCH! Missing ${localCount - remoteCount} records.`);
        } else {
            console.log(`   ✅  MATCH`);
        }
    }
}

verify();
