
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
// Old DB is restricted, so we use the local export
const EXPORT_DIR = path.join(__dirname, '..', 'database_export_2026-01-26T18-40-31-815Z');

const NEW_SUPABASE_URL = 'https://oxftskotrrlqnmfkxwux.supabase.co';
const NEW_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZnRza290cnJscW5tZmt4d3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTMxMzMsImV4cCI6MjA4NTM2OTEzM30.i9_9p87ZNzuDxVkx4jFk1ILf7kc-EzhzrJdKOaip7CU';

// Tables to migrate (in order of dependency)
const TABLES = [
    'allowed_users',
    'patients',
    'inventory_items',
    'expenses',
    'appointments', // Depends on patients
    'patient_scans', // Depends on patients
    'audit_logs' // Depends on patients/doctors
];

const BATCH_SIZE = 1000;

async function migrate() {
    console.log('--- STARTING MIGRATION FROM LOCAL EXPORT ---');
    console.log(`📁 Source Directory: ${EXPORT_DIR}`);

    if (!fs.existsSync(EXPORT_DIR)) {
        console.error(`❌ Export directory not found: ${EXPORT_DIR}`);
        process.exit(1);
    }

    const newClient = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);
    console.log(`📡 Connected to NEW DB: ${NEW_SUPABASE_URL}`);

    for (const table of TABLES) {
        console.log(`\nProcessing table: [${table}]`);

        // 1. READ from Local File
        const filePath = path.join(EXPORT_DIR, `${table}.json`);

        if (!fs.existsSync(filePath)) {
            console.warn(`   ⚠️ File not found: ${filePath}. Skipping.`);
            continue;
        }

        let allData: any[] = [];
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            allData = JSON.parse(fileContent);
            console.log(`   📖 Read ${allData.length} records from file.`);
        } catch (e) {
            console.error(`   ❌ Failed to read/parse file ${filePath}:`, e);
            continue;
        }

        if (allData.length === 0) {
            console.log(`   No data found for ${table}.`);
            continue;
        }

        // 2. INSERT to New DB
        console.log(`   🚀 Uploading to new DB...`);

        // Upload in batches
        for (let i = 0; i < allData.length; i += BATCH_SIZE) {
            const batch = allData.slice(i, i + BATCH_SIZE);

            const onConflict = table === 'allowed_users' ? 'email' : 'id';

            // Map 'treatment_type' to 'type' for appointments
            if (table === 'appointments') {
                batch.forEach(item => {
                    if (item.treatment_type && !item.type) {
                        item.type = item.treatment_type;
                        delete item.treatment_type;
                    }
                });
            }

            const { error: insertError } = await newClient
                .from(table)
                .upsert(batch, { onConflict: onConflict });

            if (insertError) {
                console.error(`   ❌ Failed to insert batch ${i / BATCH_SIZE + 1} into ${table}:`, insertError);
                // If RLS error, user might need to run schema
                if (insertError.code === '42501') {
                    console.error('   👉 HINT: Did you run the supabase_schema.sql script in the new project?');
                }
            } else {
                console.log(`      ✅ Uploaded batch ${i / BATCH_SIZE + 1}`);
            }
        }
    }

    console.log('\n--- MIGRATION COMPLETE ---');
    console.log('👉 Now update your .env file with the new credentials.');
}

migrate().catch(e => console.error('Migration failed:', e));
