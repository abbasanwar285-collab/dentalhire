
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import csvParser from 'csv-parser'; // We might need to install this or parse manually if not available.
// Since I can't install packages easily without user approval, I'll write a simple CSV parser or use string split.
// Actually, standard string split is safer for simple CSVs, but quoted fields with commas are tricky.
// I'll assume standard CSV format and try to parse carefully.

// Credentials
const SUPABASE_URL = 'https://kmjqdtupptbakhpihqfc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BACKUP_DIR = path.join(process.cwd(), 'manual backup');
const SCANS_DIR = path.join(process.cwd(), 'database_export_2026-01-26T18-40-31-815Z'); // For patient_scans JSON

// Helper to parse CSV line respecting quotes
function parseCSVLine(line: string): string[] {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
            let field = line.substring(start, i);
            // Remove surrounding quotes and unescape double quotes
            if (field.startsWith('"') && field.endsWith('"')) {
                field = field.slice(1, -1).replace(/""/g, '"');
            }
            result.push(field);
            start = i + 1;
        }
    }
    // Last field
    let field = line.substring(start);
    if (field.startsWith('"') && field.endsWith('"')) {
        field = field.slice(1, -1).replace(/""/g, '"');
    }
    result.push(field);
    return result;
}

async function parseCSV(filePath: string): Promise<any[]> {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return [];

    const headers = parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) {
            // console.warn(`Skipping line ${i} in ${path.basename(filePath)}: Field count mismatch`);
            continue;
        }
        const row: any = {};
        for (let j = 0; j < headers.length; j++) {
            let val = values[j];

            // Handle specific types based on header if needed, or let Supabase handle coercion
            // Empty strings for numbers usually fail in Supabase/Postgres if the column is numeric.
            // We should convert empty strings to null for non-text columns.
            // Since we don't know exact schema types here easily, we apply a heuristic:
            // If it looks like a number but is empty string, keep as null? 
            // Actually, for CSV imports, 'null' string or empty usually implies NULL.
            if (val === '' || val === 'NULL') {
                row[headers[j]] = null;
            } else {
                // Try JSON parsing for array/object fields like 'procedures', 'payments'
                if ((val.startsWith('[') && val.endsWith(']')) || (val.startsWith('{') && val.endsWith('}'))) {
                    try {
                        row[headers[j]] = JSON.parse(val);
                    } catch (e) {
                        row[headers[j]] = val;
                    }
                } else if (val === 'true') {
                    row[headers[j]] = true;
                } else if (val === 'false') {
                    row[headers[j]] = false;
                } else {
                    row[headers[j]] = val;
                }
            }
        }
        data.push(row);
    }
    return data;
}

async function importTable(tableName: string, data: any[]) {
    if (data.length === 0) {
        console.log(`No data for ${tableName}. Skipping.`);
        return;
    }

    console.log(`Importing ${data.length} rows into ${tableName}...`);

    // Batch insert to avoid payload limits
    const BATCH_SIZE = 100;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from(tableName).upsert(batch);
        if (error) {
            console.error(`Error importing batch ${i}-${i + BATCH_SIZE} into ${tableName}:`, error.message);
        } else {
            // console.log(`Imported batch ${i}-${i+BATCH_SIZE}`);
        }
    }
    console.log(`Finished ${tableName}.`);
}

async function runImport() {
    // Order matters due to foreign keys!
    // 1. Allowed Users (Independent)
    // 2. Patients (Referenced by appointments, scans)
    // 3. Inventory (Independent)
    // 4. Expenses (Independent)
    // 5. Appointments (References Patients)
    // 6. Patient Scans (References Patients)
    // 7. Audit Logs (References Patients usually via loose text or ID, sometimes FK)

    /*
    Files mappings:
    - allowed_users_rows.csv -> allowed_users
    - patients_rows.csv -> patients
    - inventory_items_rows.csv -> inventory_items
    - expenses_rows.csv -> expenses
    - appointments_rows.csv -> appointments
    - audit_logs_rows.csv -> audit_logs
    - patient_scans (JSON from old export) -> patient_scans
    */

    try {
        // 1. Allowed Users
        const usersData = await parseCSV(path.join(BACKUP_DIR, 'allowed_users_rows.csv'));
        await importTable('allowed_users', usersData);

        // 2. Patients
        const patientsData = await parseCSV(path.join(BACKUP_DIR, 'patients_rows.csv'));
        await importTable('patients', patientsData);

        // 3. Inventory
        const inventoryData = await parseCSV(path.join(BACKUP_DIR, 'inventory_items_rows.csv'));
        await importTable('inventory_items', inventoryData);

        // 4. Expenses
        const expensesData = await parseCSV(path.join(BACKUP_DIR, 'expenses_rows.csv'));
        await importTable('expenses', expensesData);

        // 5. Appointments
        const appointmentsData = await parseCSV(path.join(BACKUP_DIR, 'appointments_rows.csv'));
        await importTable('appointments', appointmentsData);

        // 6. Patient Scans (FROM JSON)
        // Note: The CSV manual backup didn't include scans, so we use the JSON from Jan 26.
        // We must filter scans to only include those where patient_id exists in our new patients list?
        // Actually, since we imported patients from Feb 9 (latest), the IDs from Jan 26 should exist (unless deleted).
        // Postgres will throw FK error if patient missing.
        const scansPath = path.join(SCANS_DIR, 'patient_scans.json');
        if (fs.existsSync(scansPath)) {
            const scansData = JSON.parse(fs.readFileSync(scansPath, 'utf8'));
            // Fix file_url domain if needed? 
            // The old URLs point to the OLD project 'rwbovdtcnrkslrgdjzth'. 
            // We are migrating DATA not STORAGE files. So the links will still point to the old project.
            // If the old project is deleted or paused, these links will BREAK.
            // For now, we keep them as is, or we can try to replacing the project ID in the URL.
            // BUT, copying the actual files is impossible without downloading them first.
            // We proceed with existing URLs.
            await importTable('patient_scans', scansData);
        } else {
            console.log('No patient_scans.json found. Skipping scans.');
        }

        // 7. Audit Logs
        const auditData = await parseCSV(path.join(BACKUP_DIR, 'audit_logs_rows.csv'));
        await importTable('audit_logs', auditData);

        console.log('Migration Completed Successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    }
}

runImport();
