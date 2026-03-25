import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB
const dbPath = path.join(__dirname, '..', '..', 'clinic.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Run schema
const schemaStr = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schemaStr);

export default db;
