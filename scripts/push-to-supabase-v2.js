import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Config
const supabaseUrl = 'https://kmjqdtupptbakhpihqfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8';
const supabase = createClient(supabaseUrl, supabaseKey);

// SQLite Connection
const dbPath = path.join(__dirname, '..', 'clinic.db');
const db = new Database(dbPath);

async function pushData() {
    console.log('🚀 Starting data push to Supabase V2...');

    // 1. Users
    const users = db.prepare('SELECT * FROM users').all();
    console.log(`👥 Migrating ${users.length} users...`);
    for (const user of users) {
        const { error } = await supabase.from('users_v2').upsert({
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            phone: user.phone,
            role: user.role,
            is_active: user.is_active === 1,
            permissions: JSON.parse(user.permissions || '{}'),
            created_at: user.created_at
        });
        if (error) console.error(`Error migrating user ${user.username}:`, error.message);
    }

    // 2. Patients
    const patients = db.prepare('SELECT * FROM patients').all();
    console.log(`🏥 Migrating ${patients.length} patients...`);
    for (const p of patients) {
        const { error } = await supabase.from('patients_v2').upsert({
            id: p.id,
            name: p.name,
            phone: p.phone,
            email: p.email,
            date_of_birth: p.date_of_birth,
            age: p.age,
            blood_type: p.blood_type,
            allergies: p.allergies,
            medical_history: p.medical_history,
            general_notes: p.general_notes,
            last_visit: p.last_visit,
            treatment_plans: JSON.parse(p.treatment_plans || '[]')
        });
        if (error) console.error(`Error migrating patient ${p.name}:`, error.message);
    }

    // 3. Appointments
    const appointments = db.prepare('SELECT * FROM appointments').all();
    console.log(`📅 Migrating ${appointments.length} appointments...`);
    for (const a of appointments) {
        const { error } = await supabase.from('appointments_v2').upsert({
            id: a.id,
            patient_id: a.patient_id,
            patient_name: a.patient_name,
            doctor_id: a.doctor_id,
            doctor_name: a.doctor_name,
            date: a.date,
            time: a.time,
            treatment: a.treatment,
            status: a.status,
            notes: a.notes
        });
        if (error) console.error(`Error migrating appointment ${a.id}:`, error.message);
    }

    // 4. Expenses
    const expenses = db.prepare('SELECT * FROM expenses').all();
    console.log(`💰 Migrating ${expenses.length} expenses...`);
    for (const e of expenses) {
        const { error } = await supabase.from('expenses_v2').upsert({
            id: e.id,
            amount: e.amount,
            category: e.category,
            description: e.description,
            date: e.date,
            created_by_user_id: e.created_by_user_id
        });
        if (error) console.error(`Error migrating expense ${e.id}:`, error.message);
    }

    console.log('✅ Data migration to Supabase V2 completed!');
}

pushData().catch(err => {
    console.error('💥 Migration failed:', err);
    process.exit(1);
});
