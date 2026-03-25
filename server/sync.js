import { createClient } from '@supabase/supabase-js';
import db from './db/index.js';
import { buildTreatmentPlans, mapAppointmentStatus, DOCTORS_MAP } from './utils/mapping.js';

const supabaseUrl = 'https://kmjqdtupptbakhpihqfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8';
const supabase = createClient(supabaseUrl, supabaseKey);

export function startSync() {
  console.log('🔄 Starting Supabase Realtime Sync Service...');

  const channel = supabase.channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
      handleRealtimeChange(payload).catch(err => console.error(`[Sync] Error processing patients:`, err));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
      handleRealtimeChange(payload).catch(err => console.error(`[Sync] Error processing appointments:`, err));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
      handleRealtimeChange(payload).catch(err => console.error(`[Sync] Error processing expenses:`, err));
    })
    .subscribe((status) => {
      console.log(`[Sync] Subscription status: ${status}`);
    });

  return channel;
}

async function handleRealtimeChange(payload) {
  const { table, eventType, new: newRecord, old: oldRecord } = payload;
  console.log(`[Sync] Triggered: ${eventType} on ${table}`);

  if (table === 'patients') {
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      const treatmentPlans = buildTreatmentPlans(newRecord);

      let notes = newRecord.notes || '';
      if (newRecord.gender) {
        notes = `[${newRecord.gender === 'male' ? 'ذكر' : newRecord.gender === 'female' ? 'أنثى' : newRecord.gender}] ${notes}`;
      }

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO patients (
          id, name, phone, age, medical_history, general_notes, treatment_plans
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        newRecord.id,
        newRecord.name,
        newRecord.mobile || '',
        newRecord.age || null,
        newRecord.diagnosis || '',
        notes,
        JSON.stringify(treatmentPlans)
      );
      console.log(`[Sync] Upserted patient: ${newRecord.name}`);
    } else if (eventType === 'DELETE') {
      db.prepare(`DELETE FROM patients WHERE id = ?`).run(oldRecord.id);
      console.log(`[Sync] Deleted patient: ${oldRecord.id}`);
    }
  }

  if (table === 'appointments') {
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      const doctorName = DOCTORS_MAP[newRecord.doctor_id] || newRecord.doctor_id || '';
      const status = mapAppointmentStatus(newRecord.status);

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO appointments (
          id, patient_id, patient_name, doctor_id, doctor_name, date, time, treatment, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        newRecord.id,
        newRecord.patient_id || '',
        newRecord.patient_name || '',
        newRecord.doctor_id || '',
        doctorName,
        newRecord.date || '',
        newRecord.time || '',
        newRecord.type || 'غيرها',
        status,
        newRecord.notes || ''
      );
      console.log(`[Sync] Upserted appointment for: ${newRecord.patient_name}`);
    } else if (eventType === 'DELETE') {
      db.prepare(`DELETE FROM appointments WHERE id = ?`).run(oldRecord.id);
      console.log(`[Sync] Deleted appointment: ${oldRecord.id}`);
    }
  }

  if (table === 'expenses') {
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      let category = newRecord.category || 'other';
      const validCategories = ['supply', 'salary', 'rent', 'maintenance', 'other'];
      if (!validCategories.includes(category)) category = 'other';

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO expenses (
          id, amount, category, description, date, created_by_user_id
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        newRecord.id,
        newRecord.amount || 0,
        category,
        newRecord.description || '',
        newRecord.date || new Date().toISOString().split('T')[0],
        newRecord.created_by || ''
      );
      console.log(`[Sync] Upserted expense: ${newRecord.id} - ${newRecord.amount}`);
    } else if (eventType === 'DELETE') {
      db.prepare(`DELETE FROM expenses WHERE id = ?`).run(oldRecord.id);
      console.log(`[Sync] Deleted expense: ${oldRecord.id}`);
    }
  }
}
