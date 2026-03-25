import Database from 'better-sqlite3';

const db = new Database('clinic.db');

try {
  // Fix appointment statuses
  const stmt1 = db.prepare(`UPDATE appointments SET status = 'completed' WHERE status IN ('confirmed', 'Done', 'done', 'completed')`);
  const info1 = stmt1.run();
  console.log(`Updated ${info1.changes} appointments to 'completed'`);

  const stmt2 = db.prepare(`UPDATE appointments SET status = 'scheduled' WHERE status IN ('pending', 'scheduled')`);
  const info2 = stmt2.run();
  console.log(`Updated ${info2.changes} appointments to 'scheduled'`);

  // Fix plan parsing if needed by ensuring plans have a valid date
  // For now, fixing appointments should fix the Indicators fallback.
  console.log('Database statuses fixed successfully.');
} catch (err) {
  console.error('Error fixing db:', err);
}
