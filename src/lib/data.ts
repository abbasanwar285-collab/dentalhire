import { Patient, Appointment, Treatment, Doctor } from '../types';

export const patients: Patient[] = [];

export const treatments: Treatment[] = [];

export const toothTreatmentsList = [
  { id: 't1', name: 'حشوة ضوئية (Composite Filling)', color: '#0071E3', defaultPrice: 400 },
  { id: 't2', name: 'حشوة جذر', color: '#FF9F0A', defaultPrice: 800 },
  { id: 't3', name: 'قلع سن (Extraction)', color: '#FF3B30', defaultPrice: 300 },
  { id: 't4', name: 'تنظيف الأسنان (Scaling)', color: '#5AC8FA', defaultPrice: 250 },
  { id: 't5', name: 'إزالة التكلسات (Deep Cleaning)', color: '#32ADE6', defaultPrice: 350 },
  { id: 't6', name: 'تبييض الأسنان (Teeth Whitening)', color: '#FFFFFF', defaultPrice: 1000 },
  { id: 't7', name: 'زراعة الأسنان (Dental Implant)', color: '#AF52DE', defaultPrice: 3500 },
  { id: 't8', name: 'زراعة لثة (Gum Graft)', color: '#FF2D55', defaultPrice: 1500 },
  { id: 't9', name: 'تاج / تلبيسة (Crown)', color: '#FFCC00', defaultPrice: 1200 },
  { id: 't10', name: 'جسر أسنان (Dental Bridge)', color: '#FF9500', defaultPrice: 2500 },
  { id: 't11', name: 'تقويم أسنان (Orthodontics)', color: '#5856D6', defaultPrice: 5000 },
  { id: 't12', name: 'فينير (Veneer)', color: '#E5E5EA', defaultPrice: 1500 },
  { id: 't13', name: 'Inlay / Onlay', color: '#8E8E93', defaultPrice: 800 },
  { id: 't14', name: 'Full Mouth Rehabilitation', color: "var(--color-apple-text)", defaultPrice: 20000 },
];

export const appointments: Appointment[] = [];

export const doctors: Doctor[] = [];
