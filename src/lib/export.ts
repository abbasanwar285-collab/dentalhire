import { Patient, Appointment, Treatment, Doctor, TreatmentPlan, ClinicExpense } from '../types';

export interface ExportData {
  version: string;
  exportedAt: string;
  patients: Patient[];
  appointments: Appointment[];
  treatments: Treatment[];
  doctors: Doctor[];
  clinicExpenses?: ClinicExpense[];
}

export function exportClinicData(
  patients: Patient[],
  appointments: Appointment[],
  treatments: Treatment[],
  doctors: Doctor[],
  clinicExpenses: ClinicExpense[]
): void {
  const data: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    patients,
    appointments,
    treatments,
    doctors,
    clinicExpenses,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `clinic-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importClinicData(
  file: File
): Promise<{
  patients: Patient[];
  appointments: Appointment[];
  treatments: Treatment[];
  doctors: Doctor[];
  clinicExpenses: ClinicExpense[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ExportData;
        
        if (!data.version || !data.patients || !data.appointments) {
          reject(new Error('ملف النسخ الاحتياطي غير صالح'));
          return;
        }

        resolve({
          patients: data.patients,
          appointments: data.appointments,
          treatments: data.treatments || [],
          doctors: data.doctors || [],
          clinicExpenses: data.clinicExpenses || [],
        });
      } catch {
        reject(new Error('فشل قراءة ملف النسخ الاحتياطي'));
      }
    };
    
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsText(file);
  });
}

export function exportToCSV(patients: Patient[]): void {
  const headers = ['الاسم', 'الهاتف', 'البريد الإلكتروني', 'تاريخ الميلاد', 'فصيلة الدم', 'الحساسية', 'آخر زيارة'];
  const rows = patients.map(p => [
    p.name,
    p.phone,
    p.email || '',
    p.dateOfBirth || '',
    p.bloodType || '',
    p.allergies || '',
    p.lastVisit || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `patients-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
