import Database from 'better-sqlite3';
const db = new Database('clinic.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables in clinic.db:', tables);
db.close();

