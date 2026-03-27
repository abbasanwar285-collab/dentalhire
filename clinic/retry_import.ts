
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://kmjqdtupptbakhpihqfc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BACKUP_DIR = path.join(process.cwd(), 'manual backup');
const SCANS_DIR = path.join(process.cwd(), 'database_export_2026-01-26T18-40-31-815Z');

function parseCSVLine(line: string): string[] {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
            let field = line.substring(start, i);
            if (field.startsWith('"') && field.endsWith('"')) {
                field = field.slice(1, -1).replace(/""/g, '"');
            }
            result.push(field);
            start = i + 1;
        }
    }
    let field = line.substring(start);
    if (field.startsWith('"') && field.endsWith('"')) {
        field = field.slice(1, -1).replace(/""/g, '"');
    }
    result.push(field);
    return result;
}

// Global cache of valid Patient IDs
let VALID_PATIENT_IDS = new Set<string>();

async function parseCSV(filePath: string): Promise<any[]> {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return [];

    const headers = parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;
        const row: any = {};
        for (let j = 0; j < headers.length; j++) {
            let val = values[j];
            if (val === '' || val === 'NULL') {
                row[headers[j]] = null;
            } else {
                if ((val.startsWith('[') && val.endsWith(']')) || (val.startsWith('{') && val.endsWith('}'))) {
                    try { row[headers[j]] = JSON.parse(val); } catch (e) { row[headers[j]] = val; }
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

async function start() {
    // 1. Fetch valid patient IDs first (from the CSV file we just parsed)
    console.log('Reading Patients CSV to build valid ID list...');
    const patients = await parseCSV(path.join(BACKUP_DIR, 'patients_rows.csv'));
    patients.forEach(p => VALID_PATIENT_IDS.add(p.id));
    console.log(`Found ${VALID_PATIENT_IDS.size} valid patients.`);

    // 2. Retry Appointments
    console.log('Retrying Appointments...');
    const appointments = await parseCSV(path.join(BACKUP_DIR, 'appointments_rows.csv'));
    const validAppointments = appointments.filter(a => {
        if (!a.patient_id) return true; // Keep if null? Schema says patient_id references patients(id). If it allows null, ok. Schema says 'patient_id text references...' usually implies not null unless specified? But FK constraints usually fail if not null.
        // Actually, let's look at schema. 'patient_id text references...'. Usually nullable by default.
        // But if it has a value, it MUST exist.
        return VALID_PATIENT_IDS.has(a.patient_id);
    });
    console.log(`Filtered appointments from ${appointments.length} to ${validAppointments.length}`);

    // Batch Insert Appointments
    for (let i = 0; i < validAppointments.length; i += 100) {
        const batch = validAppointments.slice(i, i + 100);
        const { error } = await supabase.from('appointments').upsert(batch);
        if (error) console.error('Appointments Error:', error.message);
    }

    // 3. Retry Scans
    console.log('Retrying Scans...');
    const scansPath = path.join(SCANS_DIR, 'patient_scans.json');
    if (fs.existsSync(scansPath)) {
        const scans = JSON.parse(fs.readFileSync(scansPath, 'utf8'));
        const validScans = scans.filter((s: any) => VALID_PATIENT_IDS.has(s.patient_id));
        console.log(`Filtered scans from ${scans.length} to ${validScans.length}`);

        for (let i = 0; i < validScans.length; i += 100) {
            const batch = validScans.slice(i, i + 100);
            const { error } = await supabase.from('patient_scans').upsert(batch);
            if (error) console.error('Scans Error:', error.message);
        }
    }

    console.log('Retry Complete.');
}

start();
