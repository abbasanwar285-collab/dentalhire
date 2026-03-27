
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase credentials missing in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLES = [
    'patients',
    'appointments',
    'expenses',
    'inventory_items',
    'audit_logs',
    'allowed_users',
    'notification_tokens',
    'telegram_subscribers',
    'patient_scans'
];

async function exportData() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir = path.join(process.cwd(), `database_export_${timestamp}`);

    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir);
    }

    console.log(`Starting export to ${exportDir}...`);

    for (const table of TABLES) {
        console.log(`Fetching ${table}...`);

        // Fetch all rows (pagination might be needed if > 1000 rows, but start with simple select)
        // Supabase limits 1000 rows by default. We should paginate.
        let allRows: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) {
                // Some tables might not exist or verify permissions
                if (error.code === '42P01') { // undefined_table
                    console.warn(`Table ${table} does not exist. Skipping.`);
                } else {
                    console.error(`Error fetching ${table}:`, error.message);
                }
                hasMore = false;
                // Dont abort entire process, just this table
            } else {
                if (data && data.length > 0) {
                    allRows = allRows.concat(data);
                    if (data.length < pageSize) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                } else {
                    hasMore = false;
                }
            }
        }

        if (allRows.length > 0) {
            const filePath = path.join(exportDir, `${table}.json`);
            fs.writeFileSync(filePath, JSON.stringify(allRows, null, 2));
            console.log(`Saved ${allRows.length} rows to ${table}.json`);
        } else {
            console.log(`No data found for ${table} or error occurred.`);
        }
    }

    console.log('Export complete.');
}

exportData();
