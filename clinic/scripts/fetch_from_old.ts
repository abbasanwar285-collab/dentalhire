
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OLD Database Credentials
const OLD_SUPABASE_URL = 'https://rwbovdtcnrkslrgdjzth.supabase.co';
const OLD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Ym92ZHRjbnJrc2xyZ2RqenRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTMxOTcsImV4cCI6MjA4MDE4OTE5N30.Vq-ZNZOtHn909rm6nzFYEoRdfiKJLoIi2xSQhAK3qJY';

// Setup Export Directory
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const EXPORT_DIR = path.join(__dirname, '..', `database_export_LATEST_${TIMESTAMP}`);

if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

const TABLES = [
    'patients',
    'appointments',
    'inventory_items',
    'expenses',
    'patient_scans',
    'audit_logs',
    'allowed_users',
    // 'profiles' // Might fail if it doesn't exist, we'll try carefully
];

async function fetchFromOldDB() {
    console.log('--- FETCHING FROM OLD DB ---');
    console.log(`Connecting to: ${OLD_SUPABASE_URL}`);

    const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);

    for (const table of TABLES) {
        console.log(`\n⬇️  Fetching [${table}]...`);

        try {
            // Fetch logic with pagination to handle large datasets
            let allRows: any[] = [];
            let page = 0;
            const pageSize = 1000;
            let fetchMore = true;

            while (fetchMore) {
                const { data, error } = await oldSupabase
                    .from(table)
                    .select('*')
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (error) {
                    // If 404 table restricted/missing, just skip
                    if (error.code === '42P01' || error.message.includes('not exist')) {
                        console.log(`   🔸 Table ${table} does not exist in old DB.`);
                    } else {
                        console.error(`   ❌ Error fetching ${table}:`, error.message);
                    }
                    fetchMore = false;
                    break;
                }

                if (data && data.length > 0) {
                    allRows = allRows.concat(data);
                    console.log(`   Received ${data.length} rows (Total: ${allRows.length})`);
                    if (data.length < pageSize) {
                        fetchMore = false;
                    } else {
                        page++;
                    }
                } else {
                    fetchMore = false;
                }
            }

            if (allRows.length > 0) {
                const filePath = path.join(EXPORT_DIR, `${table}.json`);
                fs.writeFileSync(filePath, JSON.stringify(allRows, null, 2));
                console.log(`   ✅ Saved ${allRows.length} records to ${filePath}`);
            } else {
                console.log(`   ⚠️ No records found for ${table}`);
            }

        } catch (e: any) {
            console.error(`   ❌ Unexpected error for ${table}:`, e.message);
        }
    }

    console.log('\n--- EXPORT COMPLETE ---');
    console.log(`Data saved to: ${EXPORT_DIR}`);
}

fetchFromOldDB();
