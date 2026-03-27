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
    console.log(`Starting export of all data into a single file...`);
    const allData: Record<string, any[]> = {};

    for (const table of TABLES) {
        console.log(`Fetching ${table}...`);
        
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
                if (error.code === '42P01') { 
                    console.warn(`Table ${table} does not exist. Skipping.`);
                } else {
                    console.error(`Error fetching ${table}:`, error.message);
                }
                hasMore = false;
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

        allData[table] = allRows;
        console.log(`Loaded ${allRows.length} rows from ${table}`);
    }

    const filePath = path.join(process.cwd(), `clinic_all_database_data.json`);
    fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
    console.log(`\nExport complete! ALL data saved to: ${filePath}`);
}

exportData();
