import { Patient, Appointment, Treatment, Doctor } from '../types';

export const patients: Patient[] = [
  {
    id: '1',
    name: 'أحمد محمد',
    phone: '0501234567',
    email: 'ahmed@example.com',
    dateOfBirth: '1990-05-15',
    age: 34,
    bloodType: 'O+',
    allergies: 'لا يوجد',
    medicalHistory: 'لا يوجد أمراض مزمنة',
    generalNotes: 'تم الاتفاق على خطة علاجية لزراعة سنيين في الفك السفلي.',
    lastVisit: '2023-10-01',
  },
  {
    id: '2',
    name: 'سارة خالد',
    phone: '0559876543',
    email: 'sara@example.com',
    dateOfBirth: '1985-11-20',
    age: 39,
    bloodType: 'A+',
    allergies: 'البنسلين',
    medicalHistory: 'حساسية من البنسلين',
    lastVisit: '2023-09-15',
  },
  {
    id: '3',
    name: 'عمر عبدالله',
    phone: '0541122334',
    dateOfBirth: '2000-02-10',
    age: 24,
    bloodType: 'B-',
    medicalHistory: 'ربو',
    generalNotes: 'يحتاج إلى متابعة دورية لحالة الربو قبل تخدير الأسنان.',
  },
];

export const treatments: Treatment[] = [
  { id: '1', name: 'فحص', price: 0, duration: 15 },
  { id: '2', name: 'حشوة جذر (اندو)', price: 0, duration: 30 },
  { id: '3', name: 'حشوة ضوئية', price: 0, duration: 30 },
  { id: '4', name: 'تنظيف اسنان', price: 0, duration: 30 },
  { id: '5', name: 'زراعة اسنان', price: 0, duration: 45 },
  { id: '6', name: 'قلع', price: 0, duration: 30 },
  { id: '7', name: 'تحضير اسنان', price: 0, duration: 30 },
  { id: '8', name: 'الصاق كراون او جسر', price: 0, duration: 30 },
  { id: '9', name: 'متابعة للحالة', price: 0, duration: 15 },
  { id: '10', name: 'تجميل وتبيض اسنان', price: 0, duration: 45 },
  { id: '11', name: 'طبعة الكترونية', price: 0, duration: 15 },
  { id: '12', name: 'تقويم اسنان', price: 0, duration: 30 },
  { id: '13', name: 'ترقيع لثة او العظم', price: 0, duration: 45 },
  { id: '14', name: 'غيرها', price: 0, duration: 30 },
];

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

export const appointments: Appointment[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'أحمد محمد',
    doctorId: '1',
    doctorName: 'د. أحمد',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    treatment: 'تنظيف أسنان',
    status: 'scheduled',
  },
  {
    id: '2',
    patientId: '2',
    patientName: 'سارة خالد',
    doctorId: '2',
    doctorName: 'د. سارة',
    date: new Date().toISOString().split('T')[0],
    time: '11:30',
    treatment: 'حشوة تجميلية',
    status: 'completed',
  },
  {
    id: '3',
    patientId: '3',
    patientName: 'عمر عبدالله',
    doctorId: '1',
    doctorName: 'د. أحمد',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '14:00',
    treatment: 'كشف عام',
    status: 'scheduled',
  },
];

export const doctors: Doctor[] = [
  { id: '1', name: 'د. أحمد', specialization: 'طبيب أسنان عام', color: '#0071E3' }, // Blue
  { id: '2', name: 'د. سارة', specialization: 'أخصائية تقويم', color: '#FF2D55' }, // Pink
  { id: '3', name: 'د. محمد', specialization: 'جراح فم وأسنان', color: '#FF9500' }, // Orange
];
