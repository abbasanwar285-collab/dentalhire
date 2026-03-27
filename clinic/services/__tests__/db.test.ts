import { db, generateUUID } from '../db';
import { Patient } from '../../types';

describe('Database Service - Patients', () => {
    beforeEach(() => {
        // Clear any cached data
        localStorage.clear();
    });

    describe('savePatient', () => {
        it('should successfully save a new patient', async () => {
            const newPatient: Patient = {
                id: generateUUID(),
                name: 'أحمد محمد',
                age: 30,
                mobile: '07901234567',
                consultationFeePaid: false,
                consultationFeeCount: 0,
                procedures: [],
                scans: [],
                totalCost: 0,
                paidAmount: 0,
                createdAt: Date.now()
            };

            await db.savePatient(newPatient);

            const patients = await db.getPatients();
            const savedPatient = patients.find(p => p.id === newPatient.id);

            expect(savedPatient).toBeDefined();
            expect(savedPatient?.name).toBe(newPatient.name);
            expect(savedPatient?.age).toBe(newPatient.age);
        });

        it('should update an existing patient', async () => {
            const patient: Patient = {
                id: generateUUID(),
                name: 'مريض اختبار',
                age: 28,
                mobile: '07901111111',
                consultationFeePaid: false,
                consultationFeeCount: 0,
                procedures: [],
                scans: [],
                totalCost: 0,
                paidAmount: 0,
                createdAt: Date.now()
            };

            // Save initially
            await db.savePatient(patient);

            // Update
            const updatedPatient = {
                ...patient,
                age: 29,
                mobile: '07902222222'
            };
            await db.savePatient(updatedPatient);

            const patients = await db.getPatients();
            const result = patients.find(p => p.id === patient.id);

            expect(result?.age).toBe(29);
            expect(result?.mobile).toBe('07902222222');
            expect(result?.name).toBe(patient.name); // Unchanged
        });
    });

    describe('getPatients', () => {
        it('should return an array', async () => {
            const patients = await db.getPatients();
            expect(Array.isArray(patients)).toBe(true);
        });

        it('should return saved patients', async () => {
            const patient1: Patient = {
                id: generateUUID(),
                name: 'مريض 1',
                age: 25,
                consultationFeePaid: false,
                consultationFeeCount: 0,
                procedures: [],
                scans: [],
                totalCost: 0,
                paidAmount: 0,
                createdAt: Date.now()
            };

            const patient2: Patient = {
                id: generateUUID(),
                name: 'مريض 2',
                age: 35,
                consultationFeePaid: false,
                consultationFeeCount: 0,
                procedures: [],
                scans: [],
                totalCost: 0,
                paidAmount: 0,
                createdAt: Date.now()
            };

            await db.savePatient(patient1);
            await db.savePatient(patient2);

            const patients = await db.getPatients();
            expect(patients.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('deletePatient', () => {
        it('should successfully delete a patient', async () => {
            const patient: Patient = {
                id: generateUUID(),
                name: 'مريض للحذف',
                age: 30,
                consultationFeePaid: false,
                consultationFeeCount: 0,
                procedures: [],
                scans: [],
                totalCost: 0,
                paidAmount: 0,
                createdAt: Date.now()
            };

            await db.savePatient(patient);
            await db.deletePatient(patient.id);

            const allPatients = await db.getPatients();
            const deletedPatient = allPatients.find(p => p.id === patient.id);
            expect(deletedPatient).toBeUndefined();
        });
    });
});
