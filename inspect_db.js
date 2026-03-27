import Database from 'better-sqlite3';
const db = new Database('clinic.db');
const cols = db.prepare('PRAGMA table_info(patients);').all();
console.log(cols.map(c => c.name));
