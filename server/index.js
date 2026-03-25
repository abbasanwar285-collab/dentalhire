import express from 'express';
import cors from 'cors';
import db from './db/index.js';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large JSON payloads for treatment plans

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Patients API
app.get('/api/patients', (req, res) => {
  try {
    const patients = db.prepare('SELECT * FROM patients').all();
    // parse JSON for treatment plans
    const mapped = patients.map(p => ({
      ...p,
      dateOfBirth: p.date_of_birth,
      bloodType: p.blood_type,
      medicalHistory: p.medical_history,
      generalNotes: p.general_notes,
      lastVisit: p.last_visit,
      treatmentPlans: p.treatment_plans ? JSON.parse(p.treatment_plans) : []
    }));
    res.json(mapped);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/patients', (req, res) => {
  try {
    const p = req.body;
    const stmt = db.prepare(`
      INSERT INTO patients (
        id, name, phone, email, date_of_birth, age, blood_type, 
        allergies, medical_history, general_notes, last_visit, treatment_plans
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      p.id, p.name, p.phone, p.email, p.dateOfBirth, p.age, p.bloodType,
      p.allergies, p.medicalHistory, p.generalNotes, p.lastVisit, 
      JSON.stringify(p.treatmentPlans || [])
    );
    res.status(201).json(p);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// For updating patient or treatment plans
app.put('/api/patients/:id', (req, res) => {
  try {
    const p = req.body;
    const stmt = db.prepare(`
      UPDATE patients SET
        name = ?, phone = ?, email = ?, date_of_birth = ?, age = ?, 
        blood_type = ?, allergies = ?, medical_history = ?, 
        general_notes = ?, last_visit = ?, treatment_plans = ?
      WHERE id = ?
    `);
    stmt.run(
      p.name, p.phone, p.email, p.dateOfBirth, p.age, 
      p.bloodType, p.allergies, p.medicalHistory, 
      p.generalNotes, p.lastVisit, JSON.stringify(p.treatmentPlans || []), 
      req.params.id
    );
    res.json(p);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Appointments API
app.get('/api/appointments', (req, res) => {
  try {
    const acts = db.prepare('SELECT * FROM appointments').all();
    const mapped = acts.map(a => ({
      ...a,
      patientId: a.patient_id,
      patientName: a.patient_name,
      doctorId: a.doctor_id,
      doctorName: a.doctor_name
    }));
    res.json(mapped);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/appointments', (req, res) => {
  try {
    const a = req.body;
    const stmt = db.prepare(`
      INSERT INTO appointments (
        id, patient_id, patient_name, doctor_id, doctor_name, 
        date, time, treatment, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      a.id, a.patientId, a.patientName, a.doctorId, a.doctorName,
      a.date, a.time, a.treatment, a.status, a.notes
    );
    res.status(201).json(a);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/appointments/:id', (req, res) => {
  try {
    const a = req.body;
    const stmt = db.prepare(`
      UPDATE appointments SET status = ?, notes = ? WHERE id = ?
    `);
    stmt.run(a.status, a.notes, req.params.id);
    res.json(a);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Expenses API
app.get('/api/expenses', (req, res) => {
  try {
    const expenses = db.prepare('SELECT * FROM expenses').all();
    const mapped = expenses.map(e => ({
      ...e,
      createdByUserId: e.created_by_user_id,
      supplyRequestId: e.supply_request_id
    }));
    res.json(mapped);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/expenses', (req, res) => {
  try {
    const e = req.body;
    const stmt = db.prepare(`
      INSERT INTO expenses (id, amount, category, description, date, created_by_user_id, supply_request_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(e.id, e.amount, e.category, e.description, e.date, e.createdByUserId, e.supplyRequestId);
    res.status(201).json(e);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Supply Requests API
app.get('/api/supply_requests', (req, res) => {
  try {
    const reqs = db.prepare('SELECT * FROM supply_requests').all();
    const mapped = reqs.map(r => ({
      ...r,
      requestedByUserId: r.requested_by_user_id,
      purchasedAt: r.purchased_at,
      purchasePrice: r.purchase_price
    }));
    res.json(mapped);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/supply_requests', (req, res) => {
  try {
    const r = req.body;
    const stmt = db.prepare(`
      INSERT INTO supply_requests (id, name, quantity, unit, urgency, notes, requested_by_user_id, status, created_at, purchased_at, purchase_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(r.id, r.name, r.quantity, r.unit, r.urgency, r.notes, r.requestedByUserId, r.status, r.createdAt, r.purchasedAt, r.purchasePrice);
    res.status(201).json(r);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/supply_requests/:id', (req, res) => {
  try {
    const r = req.body;
    const stmt = db.prepare(`UPDATE supply_requests SET status = ?, purchased_at = ?, purchase_price = ? WHERE id = ?`);
    stmt.run(r.status, r.purchasedAt, r.purchasePrice, req.params.id);
    res.json(r);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/patients/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Users API
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users').all();
    const mapped = users.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      phone: u.phone,
      role: u.role,
      permissions: u.permissions ? JSON.parse(u.permissions) : {},
      isActive: Boolean(u.is_active),
      createdAt: u.created_at
    }));
    res.json(mapped);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const u = req.body;
    const stmt = db.prepare(`
      INSERT INTO users (id, username, display_name, phone, role, is_active, permissions, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(u.id, u.username, u.displayName, u.phone || '', u.role, u.isActive ? 1 : 0, JSON.stringify(u.permissions || {}), u.createdAt);
    res.status(201).json(u);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const u = req.body;
    const stmt = db.prepare(`UPDATE users SET username=?, display_name=?, phone=?, role=?, is_active=?, permissions=? WHERE id=?`);
    stmt.run(u.username, u.displayName, u.phone || '', u.role, u.isActive ? 1 : 0, JSON.stringify(u.permissions || {}), req.params.id);
    res.json(u);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

import { startSync } from './sync.js';

app.listen(port, () => {
  console.log(`Backend API listening on port ${port}`);
  startSync();
});
