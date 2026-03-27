import Database from 'better-sqlite3';

const db = new Database('clinic.db');

async function checkData() {
  const sqlitePatients = db.prepare('SELECT id, treatment_plans FROM patients').all();
  let totalPayments = 0;
  for (const p of sqlitePatients) {
    if (p.treatment_plans && p.treatment_plans !== '[]' && p.treatment_plans !== '') {
        const plans = JSON.parse(p.treatment_plans);
        for (const plan of plans) {
            if (plan.payments && plan.payments.length > 0) {
            totalPayments += plan.payments.length;
            }
        }
    }
  }
  console.log(`Total payments found across all patients in SQLite: ${totalPayments}`);
}

checkData();
