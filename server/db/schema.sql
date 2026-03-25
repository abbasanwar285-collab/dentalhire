-- schema.sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  phone TEXT,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions TEXT, -- JSON mapped string
  is_active INTEGER DEFAULT 1,
  created_at TEXT,
  color TEXT,
  specialization TEXT,
  salary_type TEXT,
  fixed_salary REAL,
  percentage REAL,
  salary_start_date INTEGER,
  bonuses TEXT, -- JSON string
  deductions TEXT, -- JSON string
  salary_notes TEXT
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  date_of_birth TEXT,
  age INTEGER,
  blood_type TEXT,
  allergies TEXT,
  medical_history TEXT,
  general_notes TEXT,
  last_visit TEXT,
  treatment_plans TEXT -- JSON array of plans to keep parity with frontend context
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT,
  patient_name TEXT,
  doctor_id TEXT,
  doctor_name TEXT,
  date TEXT,
  time TEXT,
  treatment TEXT,
  status TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS treatments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL,
  duration INTEGER
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT,
  assigned_to_user_id TEXT,
  created_by_user_id TEXT,
  status TEXT,
  related_patient_id TEXT,
  due_date TEXT,
  created_at TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS supply_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER,
  unit TEXT,
  urgency TEXT,
  notes TEXT,
  requested_by_user_id TEXT,
  status TEXT,
  created_at TEXT,
  purchased_at TEXT,
  purchase_price REAL
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  category TEXT,
  description TEXT,
  date TEXT,
  created_by_user_id TEXT,
  supply_request_id TEXT
);

CREATE TABLE IF NOT EXISTS waiting_room (
  id TEXT PRIMARY KEY,
  patient_id TEXT,
  patient_name TEXT,
  doctor_id TEXT,
  doctor_name TEXT,
  appointment_id TEXT,
  arrival_time TEXT,
  status TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS arrival_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT,
  appointment_id TEXT,
  scheduled_time TEXT,
  scheduled_date TEXT,
  actual_arrival_time TEXT,
  difference_minutes INTEGER,
  created_at TEXT,
  session_start_time TEXT,
  session_end_time TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  clinic_name TEXT,
  clinic_phone TEXT,
  clinic_address TEXT
);
