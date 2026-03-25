/**
 * Smart Clinic Management Algorithms
 * Advanced algorithms for intelligent patient and clinic management
 */

import { Appointment, Patient, Doctor, TreatmentPlan } from '../types';
import { format, addDays, addHours, differenceInHours, isAfter, isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

// ==========================
// 1. APPOINTMENT REMINDERS
// ==========================

export interface ReminderSettings {
  enable24h: boolean;
  enable1h: boolean;
  enableSMS: boolean;
  enableEmail: boolean;
  enablePush: boolean;
}

export interface AppointmentReminder {
  id: string;
  appointmentId: string;
  patientId: string;
  type: '24h' | '1h' | 'custom';
  scheduledTime: string;
  sent: boolean;
  sentAt?: string;
  channel: 'sms' | 'email' | 'push' | 'in-app';
  message: string;
}

/**
 * Generates intelligent appointment reminders based on appointment time and patient preferences
 */
export function generateAppointmentReminders(
  appointment: Appointment,
  patient: Patient,
  settings: ReminderSettings = {
    enable24h: true,
    enable1h: true,
    enableSMS: true,
    enableEmail: true,
    enablePush: true
  }
): AppointmentReminder[] {
  const reminders: AppointmentReminder[] = [];
  const appointmentDate = parseISO(appointment.date);
  const [hours, minutes] = appointment.time.split(':').map(Number);
  const appointmentDateTime = new Date(appointmentDate);
  appointmentDateTime.setHours(hours, minutes, 0, 0);

  // 24-hour reminder
  if (settings.enable24h && differenceInHours(appointmentDateTime, new Date()) > 24) {
    const reminder24hTime = addHours(appointmentDateTime, -24);
    reminders.push({
      id: `${appointment.id}-24h`,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      type: '24h',
      scheduledTime: reminder24hTime.toISOString(),
      sent: false,
      channel: settings.enableSMS ? 'sms' : settings.enableEmail ? 'email' : 'in-app',
      message: generateReminderMessage(appointment, patient, '24h')
    });
  }

  // 1-hour reminder
  if (settings.enable1h && differenceInHours(appointmentDateTime, new Date()) > 1) {
    const reminder1hTime = addHours(appointmentDateTime, -1);
    reminders.push({
      id: `${appointment.id}-1h`,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      type: '1h',
      scheduledTime: reminder1hTime.toISOString(),
      sent: false,
      channel: settings.enablePush ? 'push' : settings.enableSMS ? 'sms' : 'in-app',
      message: generateReminderMessage(appointment, patient, '1h')
    });
  }

  return reminders;
}

/**
 * Generates personalized reminder messages based on appointment type and patient history
 */
function generateReminderMessage(
  appointment: Appointment,
  patient: Patient,
  type: '24h' | '1h'
): string {
  const appointmentDate = parseISO(appointment.date);
  const dateStr = format(appointmentDate, 'EEEE dd MMMM', { locale: ar });
  const timeStr = appointment.time;
  
  const baseMessage = type === '24h' 
    ? `تذكير: لديك موعد غداً`
    : `تذكير: لديك موعد بعد ساعة`;
  
  const treatmentMessage = appointment.treatment !== 'فحص' 
    ? `لإجراء ${appointment.treatment}`
    : 'لفحص دوري';
  
  const personalizedMessage = patient.treatmentPlans && patient.treatmentPlans.length > 0
    ? `${baseMessage} في عيادة الدكتور ${appointment.doctorName} ${treatmentMessage}. نتطلع لرؤيتك!`
    : `${baseMessage} في عيادة الدكتور ${appointment.doctorName} ${treatmentMessage}.`;
  
  return personalizedMessage;
}

/**
 * Checks and sends pending reminders
 */
export function checkAndSendReminders(
  reminders: AppointmentReminder[],
  sendFunction: (reminder: AppointmentReminder) => Promise<boolean>
): Promise<AppointmentReminder[]> {
  const now = new Date();
  const pendingReminders = reminders.filter(r => !r.sent && isAfter(now, parseISO(r.scheduledTime)));
  
  return Promise.all(
    pendingReminders.map(async (reminder) => {
      try {
        const sent = await sendFunction(reminder);
        return {
          ...reminder,
          sent,
          sentAt: sent ? now.toISOString() : undefined
        };
      } catch (error) {
        console.error('Failed to send reminder:', error);
        return reminder;
      }
    })
  );
}

// ==========================
// 2. AUTO-SUGGEST APPOINTMENT SLOTS
// ==========================

export interface SuggestedSlot {
  date: string;
  time: string;
  doctorId: string;
  doctorName: string;
  score: number;
  reason: string;
  conflicts: number;
}

export interface SlotPreferences {
  preferredTimes: string[]; // ['09:00', '14:00']
  avoidDays: number[]; // [5, 6] Friday, Saturday
  maxGap: number; // maximum gap between appointments in days
  doctorPreference?: string;
}

/**
 * Analyzes doctor availability and patient preferences to suggest optimal appointment slots
 */
export function suggestAppointmentSlots(
  doctorId: string,
  existingAppointments: Appointment[],
  preferences: SlotPreferences = {
    preferredTimes: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    avoidDays: [5], // Friday only
    maxGap: 7
  },
  daysAhead: number = 14
): SuggestedSlot[] {
  const suggestions: SuggestedSlot[] = [];
  const today = new Date();
  const doctorAppointments = existingAppointments.filter(apt => apt.doctorId === doctorId);
  
  for (let dayOffset = 1; dayOffset <= daysAhead; dayOffset++) {
    const currentDate = addDays(today, dayOffset);
    const dayOfWeek = currentDate.getDay();
    
    // Skip avoided days
    if (preferences.avoidDays.includes(dayOfWeek)) continue;
    
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayAppointments = doctorAppointments.filter(apt => apt.date === dateStr);
    
    preferences.preferredTimes.forEach(time => {
      const score = calculateSlotScore(currentDate, time, dayAppointments, preferences);
      const conflicts = countConflicts(time, dayAppointments);
      
      if (score > 0.3) { // Minimum score threshold
        suggestions.push({
          date: dateStr,
          time,
          doctorId,
          doctorName: doctorAppointments[0]?.doctorName || 'دكتور',
          score,
          reason: getSlotReason(score, conflicts),
          conflicts
        });
      }
    });
  }
  
  return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
}

/**
 * Calculates a score for an appointment slot based on multiple factors
 */
function calculateSlotScore(
  date: Date,
  time: string,
  existingAppointments: Appointment[],
  preferences: SlotPreferences
): number {
  let score = 0.5; // Base score
  
  // Time preference bonus
  if (preferences.preferredTimes.includes(time)) {
    score += 0.3;
  }
  
  // Morning vs afternoon preference
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 9 && hour <= 11) {
    score += 0.2; // Morning preferred
  }
  
  // Conflict penalty
  const conflicts = countConflicts(time, existingAppointments);
  score -= conflicts * 0.4;
  
  // Gap optimization
  const gaps = calculateGaps(time, existingAppointments);
  score += Math.min(gaps * 0.1, 0.3);
  
  // Day of week bonus (Sunday-Wednesday preferred)
  const dayOfWeek = date.getDay();
  if (dayOfWeek >= 0 && dayOfWeek <= 3) {
    score += 0.1;
  }
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Counts conflicts with existing appointments (15-min buffer)
 */
function countConflicts(time: string, existingAppointments: Appointment[]): number {
  const [suggestedHour, suggestedMinute] = time.split(':').map(Number);
  const suggestedMinutes = suggestedHour * 60 + suggestedMinute;
  
  return existingAppointments.filter(apt => {
    const [aptHour, aptMinute] = apt.time.split(':').map(Number);
    const aptMinutes = aptHour * 60 + aptMinute;
    const timeDiff = Math.abs(suggestedMinutes - aptMinutes);
    return timeDiff < 30; // 15-min buffer each side
  }).length;
}

/**
 * Calculates gap optimization score
 */
function calculateGaps(time: string, existingAppointments: Appointment[]): number {
  const [suggestedHour, suggestedMinute] = time.split(':').map(Number);
  const suggestedMinutes = suggestedHour * 60 + suggestedMinute;
  
  const times = existingAppointments
    .map(apt => {
      const [hour, minute] = apt.time.split(':').map(Number);
      return hour * 60 + minute;
    })
    .concat([suggestedMinutes])
    .sort((a, b) => a - b);
  
  const index = times.indexOf(suggestedMinutes);
  let gapScore = 0;
  
  if (index > 0) {
    const prevGap = suggestedMinutes - times[index - 1];
    if (prevGap >= 60) gapScore += 0.5; // Good gap after
  }
  
  if (index < times.length - 1) {
    const nextGap = times[index + 1] - suggestedMinutes;
    if (nextGap >= 60) gapScore += 0.5; // Good gap before
  }
  
  return gapScore;
}

/**
 * Generates human-readable reason for slot suggestion
 */
function getSlotReason(score: number, conflicts: number): string {
  if (score >= 0.8) return 'وقت مثالي - لا توجد تعارضات';
  if (score >= 0.6) return 'وقت جيد - تعارضات قليلة';
  if (conflicts === 0) return 'وقت مناسب - متاح';
  return 'وقت مقبول - بعض التعارضات';
}

// ==========================
// 3. HEALTH RISK ANALYSIS
// ==========================

export interface HealthRisk {
  level: 'low' | 'medium' | 'high' | 'critical';
  type: 'allergy' | 'medication' | 'age' | 'condition';
  description: string;
  recommendation: string;
  confidence: number;
}

export interface RiskAnalysis {
  patientId: string;
  risks: HealthRisk[];
  overallScore: number;
  lastUpdated: string;
}

/**
 * Analyzes patient data to identify potential health risks
 */
export function analyzeHealthRisks(patient: Patient, treatmentPlans: TreatmentPlan[]): RiskAnalysis {
  const risks: HealthRisk[] = [];
  
  // Allergy risk analysis
  if (patient.allergies && patient.allergies !== 'لا يوجد') {
    const allergyRisk = analyzeAllergyRisk(patient.allergies, treatmentPlans);
    if (allergyRisk) risks.push(allergyRisk);
  }
  
  // Age-related risks
  if (patient.age) {
    const ageRisk = analyzeAgeRisk(patient.age);
    if (ageRisk) risks.push(ageRisk);
  }
  
  // Medical history analysis
  if (patient.medicalHistory && patient.medicalHistory !== 'لا يوجد') {
    const conditionRisk = analyzeMedicalConditions(patient.medicalHistory);
    if (conditionRisk) risks.push(conditionRisk);
  }
  
  // Blood type compatibility
  if (patient.bloodType) {
    const bloodRisk = analyzeBloodTypeRisk(patient.bloodType);
    if (bloodRisk) risks.push(bloodRisk);
  }
  
  // Calculate overall risk score
  const overallScore = calculateOverallRiskScore(risks);
  
  return {
    patientId: patient.id,
    risks,
    overallScore,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Analyzes allergy risks for treatments
 */
function analyzeAllergyRisk(allergies: string, treatmentPlans: TreatmentPlan[]): HealthRisk | null {
  const allergyList = allergies.split(',').map(a => a.trim().toLowerCase());
  const dangerousMedications = ['بنسلين', 'أموكسيسيلين', 'سيفالكسين'];
  
  const hasPenicillinAllergy = allergyList.some(allergy => 
    allergy.includes('بنسلين') || allergy.includes('penicillin')
  );
  
  if (hasPenicillinAllergy) {
    return {
      level: 'high',
      type: 'allergy',
      description: 'حساسية من البنسلين مكتشفة',
      recommendation: 'يجب تجنب جميع المضادات الحيوية من فئة البنسلين والسيفالوسبورين',
      confidence: 0.95
    };
  }
  
  return null;
}

/**
 * Analyzes age-related risks
 */
function analyzeAgeRisk(age: number): HealthRisk | null {
  if (age >= 65) {
    return {
      level: 'medium',
      type: 'age',
      description: 'مريض مسن (أكبر من 65 سنة)',
      recommendation: 'يجب أخذ الحذر مع التخدير ومراقبة ضغط الدم والسكر',
      confidence: 0.8
    };
  }
  
  if (age <= 12) {
    return {
      level: 'medium',
      type: 'age',
      description: 'طفل (أقل من 12 سنة)',
      recommendation: 'يجب استخدام جرعات معدلة ومراقبة التنفس',
      confidence: 0.85
    };
  }
  
  return null;
}

/**
 * Analyzes medical conditions
 */
function analyzeMedicalConditions(medicalHistory: string): HealthRisk | null {
  const conditions = medicalHistory.toLowerCase();
  
  if (conditions.includes('سكري') || conditions.includes('diabetes')) {
    return {
      level: 'high',
      type: 'condition',
      description: 'مريض سكري',
      recommendation: 'مراقبة السكر قبل وبعد العلاج، تجنب الكورتيزون',
      confidence: 0.9
    };
  }
  
  if (conditions.includes('ضغط') || conditions.includes('pressure')) {
    return {
      level: 'medium',
      type: 'condition',
      description: 'مريض بضغط الدم',
      recommendation: 'مراقبة ضغط الدم، تجنب الإيبينيفرين في التخدير',
      confidence: 0.85
    };
  }
  
  if (conditions.includes('قلب') || conditions.includes('heart')) {
    return {
      level: 'high',
      type: 'condition',
      description: 'مريض بأمراض القلب',
      recommendation: 'تقييم القلب قبل أي علاج، مضادات حيوية وقائية',
      confidence: 0.9
    };
  }
  
  return null;
}

/**
 * Analyzes blood type risks
 */
function analyzeBloodTypeRisk(bloodType: string): HealthRisk | null {
  const rhNegativeTypes = ['A-', 'B-', 'AB-', 'O-'];
  
  if (rhNegativeTypes.includes(bloodType.toUpperCase())) {
    return {
      level: 'medium',
      type: 'condition',
      description: `فصيلة دم ${bloodType} (RH سالب)`,
      recommendation: 'تجنب نقل الدم إلا في الضرورة القصوى',
      confidence: 0.7
    };
  }
  
  return null;
}

/**
 * Calculates overall risk score
 */
function calculateOverallRiskScore(risks: HealthRisk[]): number {
  if (risks.length === 0) return 0;
  
  const levelScores = { low: 1, medium: 3, high: 7, critical: 10 };
  const weightedSum = risks.reduce((sum, risk) => sum + levelScores[risk.level] * risk.confidence, 0);
  const maxPossibleScore = risks.length * 10;
  
  return Math.min(10, (weightedSum / maxPossibleScore) * 10);
}

// ==========================
// 4. SCHEDULE OPTIMIZATION
// ==========================

export interface OptimizedSchedule {
  appointments: Appointment[];
  efficiencyScore: number;
  totalIdleTime: number;
  doctorUtilization: Record<string, number>;
  recommendations: string[];
}

/**
 * Optimizes appointment schedule to minimize idle time and maximize efficiency
 */
export function optimizeSchedule(
  appointments: Appointment[],
  doctors: Doctor[],
  workingHours: { start: string; end: string } = { start: '09:00', end: '17:00' }
): OptimizedSchedule {
  const optimized: Appointment[] = [];
  const doctorSchedule: Record<string, Appointment[]> = {};
  
  // Group appointments by doctor
  appointments.forEach(apt => {
    if (!doctorSchedule[apt.doctorId]) {
      doctorSchedule[apt.doctorId] = [];
    }
    doctorSchedule[apt.doctorId].push(apt);
  });
  
  // Sort each doctor's appointments by time
  Object.keys(doctorSchedule).forEach(doctorId => {
    doctorSchedule[doctorId].sort((a, b) => a.time.localeCompare(b.time));
  });
  
  // Calculate metrics
  const totalIdleTime = calculateTotalIdleTime(doctorSchedule, workingHours);
  const doctorUtilization = calculateDoctorUtilization(doctorSchedule, workingHours);
  const efficiencyScore = calculateEfficiencyScore(totalIdleTime, appointments.length);
  
  // Generate recommendations
  const recommendations = generateOptimizationRecommendations(
    doctorSchedule,
    totalIdleTime,
    doctorUtilization,
    workingHours
  );
  
  return {
    appointments: Object.values(doctorSchedule).flat(),
    efficiencyScore,
    totalIdleTime,
    doctorUtilization,
    recommendations
  };
}

/**
 * Calculates total idle time across all doctors
 */
function calculateTotalIdleTime(
  doctorSchedule: Record<string, Appointment[]>,
  workingHours: { start: string; end: string }
): number {
  let totalIdleMinutes = 0;
  
  Object.values(doctorSchedule).forEach(appointments => {
    if (appointments.length < 2) return;
    
    for (let i = 1; i < appointments.length; i++) {
      const prevEnd = getAppointmentEndTime(appointments[i - 1]);
      const currentStart = appointments[i].time;
      
      const idleMinutes = timeDifferenceInMinutes(currentStart, prevEnd);
      if (idleMinutes > 15) { // Only count significant gaps
        totalIdleMinutes += idleMinutes;
      }
    }
  });
  
  return totalIdleMinutes;
}

/**
 * Calculates doctor utilization rates
 */
function calculateDoctorUtilization(
  doctorSchedule: Record<string, Appointment[]>,
  workingHours: { start: string; end: string }
): Record<string, number> {
  const utilization: Record<string, number> = {};
  const workingMinutes = timeDifferenceInMinutes(workingHours.end, workingHours.start);
  
  Object.entries(doctorSchedule).forEach(([doctorId, appointments]) => {
    if (appointments.length === 0) {
      utilization[doctorId] = 0;
      return;
    }
    
    const totalAppointmentMinutes = appointments.reduce((total, apt) => {
      return total + getEstimatedDuration(apt.treatment);
    }, 0);
    
    utilization[doctorId] = Math.min(100, (totalAppointmentMinutes / workingMinutes) * 100);
  });
  
  return utilization;
}

/**
 * Calculates overall efficiency score
 */
function calculateEfficiencyScore(totalIdleTime: number, totalAppointments: number): number {
  const avgIdleTimePerAppointment = totalIdleTime / Math.max(1, totalAppointments);
  const score = Math.max(0, 100 - (avgIdleTimePerAppointment / 60) * 10);
  return Math.round(score);
}

/**
 * Generates optimization recommendations
 */
function generateOptimizationRecommendations(
  doctorSchedule: Record<string, Appointment[]>,
  totalIdleTime: number,
  doctorUtilization: Record<string, number>,
  workingHours: { start: string; end: string }
): string[] {
  const recommendations: string[] = [];
  
  // Idle time recommendations
  if (totalIdleTime > 120) { // More than 2 hours total
    recommendations.push('يوجد وقت فراغ كبير - اعادة جدولة بعض المواعيد لتقليل الفجوات');
  }
  
  // Doctor utilization recommendations
  Object.entries(doctorUtilization).forEach(([doctorId, utilization]) => {
    if (utilization < 60) {
      recommendations.push(`الدكتور ${doctorId} لديه استخدام منخفض (${utilization.toFixed(1)}%) - زيادة المواعيد أو تقليل ساعات العمل`);
    }
    if (utilization > 90) {
      recommendations.push(`الدكتور ${doctorId} لديه استخدام عالي (${utilization.toFixed(1)}%) - النظر في تقليل المواعيد أو زيادة ساعات العمل`);
    }
  });
  
  // Peak time recommendations
  const peakTimes = identifyPeakTimes(doctorSchedule);
  if (peakTimes.length > 0) {
    recommendations.push(`أوقات الذروة: ${peakTimes.join(', ')} - النظر في تمديد ساعات العمل`);
  }
  
  return recommendations;
}

/**
 * Identifies peak appointment times
 */
function identifyPeakTimes(doctorSchedule: Record<string, Appointment[]>): string[] {
  const timeCounts: Record<string, number> = {};
  
  Object.values(doctorSchedule).flat().forEach(apt => {
    const hour = apt.time.split(':')[0];
    timeCounts[hour] = (timeCounts[hour] || 0) + 1;
  });
  
  const avgCount = Object.values(timeCounts).reduce((a, b) => a + b, 0) / Object.keys(timeCounts).length;
  
  return Object.entries(timeCounts)
    .filter(([_, count]) => count > avgCount * 1.5)
    .map(([hour, _]) => `${hour}:00`)
    .slice(0, 3);
}

/**
 * Gets estimated treatment duration
 */
function getEstimatedDuration(treatment: string): number {
  const durationMap: Record<string, number> = {
    'فحص': 15,
    'حشوة ضوئية': 30,
    'حشوة جذر': 45,
    'تنظيف اسنان': 30,
    'زراعة اسنان': 60,
    'قلع': 30,
    'تحضير اسنان': 30,
    'الصاق كراون او جسر': 30,
    'متابعة للحالة': 15,
    'تجميل وتبيض اسنان': 45,
    'طبعة الكترونية': 15,
    'تقويم اسنان': 30,
    'ترقيع لثة او العظم': 45,
    'غيرها': 30
  };
  
  return durationMap[treatment] || 30;
}

/**
 * Gets appointment end time
 */
function getAppointmentEndTime(appointment: Appointment): string {
  const duration = getEstimatedDuration(appointment.treatment);
  const [hour, minute] = appointment.time.split(':').map(Number);
  const endMinutes = hour * 60 + minute + duration;
  const endHour = Math.floor(endMinutes / 60);
  const endMinute = endMinutes % 60;
  
  return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
}

/**
 * Calculates time difference in minutes
 */
function timeDifferenceInMinutes(time1: string, time2: string): number {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  
  return Math.abs((h1 * 60 + m1) - (h2 * 60 + m2));
}

// ==========================
// 5. NO-SHOW PREDICTION
// ==========================

export interface NoShowPrediction {
  patientId: string;
  riskScore: number; // 0-1 probability
  riskLevel: 'low' | 'medium' | 'high';
  factors: {
    name: string;
    weight: number;
    description: string;
  }[];
  recommendations: string[];
}

/**
 * Predicts the likelihood of a patient not showing up for an appointment
 */
export function predictNoShow(
  patient: Patient,
  appointmentHistory: Appointment[],
  currentAppointment: Appointment
): NoShowPrediction {
  const factors: NoShowPrediction['factors'] = [];
  
  // Historical no-show rate
  const noShowRate = calculateNoShowRate(appointmentHistory);
  factors.push({
    name: 'تاريخ التغيب',
    weight: noShowRate,
    description: `نسبة التغيب السابقة: ${(noShowRate * 100).toFixed(1)}%`
  });
  
  // Appointment timing factor
  const timingScore = analyzeAppointmentTiming(currentAppointment);
  factors.push({
    name: 'توقيت الموعد',
    weight: timingScore,
    description: getTimingDescription(timingScore)
  });
  
  // Patient age factor
  const ageScore = analyzePatientAge(patient.age);
  if (ageScore > 0) {
    factors.push({
      name: 'العمر',
      weight: ageScore,
      description: getAgeDescription(patient.age, ageScore)
    });
  }
  
  // Last visit recency
  const recencyScore = analyzeLastVisitRecency(patient.lastVisit);
  if (recencyScore > 0) {
    factors.push({
      name: 'بعد آخر زيارة',
      weight: recencyScore,
      description: getRecencyDescription(patient.lastVisit, recencyScore)
    });
  }
  
  // Calculate overall risk score
  const riskScore = Math.min(1, factors.reduce((sum, f) => sum + f.weight, 0) / factors.length);
  
  // Determine risk level
  let riskLevel: NoShowPrediction['riskLevel'] = 'low';
  if (riskScore >= 0.7) riskLevel = 'high';
  else if (riskScore >= 0.4) riskLevel = 'medium';
  
  // Generate recommendations
  const recommendations = generateNoShowRecommendations(riskLevel, factors);
  
  return {
    patientId: patient.id,
    riskScore,
    riskLevel,
    factors,
    recommendations
  };
}

/**
 * Calculates historical no-show rate
 */
function calculateNoShowRate(appointmentHistory: Appointment[]): number {
  if (appointmentHistory.length === 0) return 0;
  
  const completedAppointments = appointmentHistory.filter(apt => apt.status === 'completed').length;
  const totalAppointments = appointmentHistory.length;
  
  return Math.max(0, 1 - (completedAppointments / totalAppointments));
}

/**
 * Analyzes appointment timing for no-show risk
 */
function analyzeAppointmentTiming(appointment: Appointment): number {
  const appointmentDate = parseISO(appointment.date);
  const dayOfWeek = appointmentDate.getDay();
  const [hour] = appointment.time.split(':').map(Number);
  
  let score = 0;
  
  // Early morning appointments (before 9 AM)
  if (hour < 9) score += 0.3;
  
  // Late afternoon appointments (after 4 PM)
  if (hour > 16) score += 0.2;
  
  // Weekend appointments (Friday in some countries)
  if (dayOfWeek === 5) score += 0.2;
  
  // Monday morning appointments
  if (dayOfWeek === 1 && hour < 10) score += 0.15;
  
  return Math.min(1, score);
}

/**
 * Analyzes patient age for no-show risk
 */
function analyzePatientAge(age?: number): number {
  if (!age) return 0;
  
  if (age < 25) return 0.3; // Young adults more likely to no-show
  if (age > 70) return 0.2; // Elderly might have transportation issues
  
  return 0;
}

/**
 * Analyzes last visit recency
 */
function analyzeLastVisitRecency(lastVisit?: string): number {
  if (!lastVisit) return 0.4; // No history = higher risk
  
  const lastVisitDate = parseISO(lastVisit);
  const daysSinceLastVisit = differenceInHours(new Date(), lastVisitDate) / 24;
  
  if (daysSinceLastVisit > 365) return 0.5; // More than a year
  if (daysSinceLastVisit > 180) return 0.3; // More than 6 months
  if (daysSinceLastVisit > 90) return 0.2; // More than 3 months
  
  return 0;
}

/**
 * Generates recommendations based on no-show risk
 */
function generateNoShowRecommendations(
  riskLevel: NoShowPrediction['riskLevel'],
  factors: NoShowPrediction['factors']
): string[] {
  const recommendations: string[] = [];
  
  if (riskLevel === 'high') {
    recommendations.push('إرسال تذكيرات متعددة (24h، 1h، يوم قبل)');
    recommendations.push('الاتصال الهاتفي المباشر للتأكيد');
    recommendations.push('طلب تأكيد الحضور 24h قبل الموعد');
    recommendations.push('توفير خدمة النقل إن أمكن');
  } else if (riskLevel === 'medium') {
    recommendations.push('إرسال تذكير عبر الرسائل');
    recommendations.push('تأكيد الموعد 24h قبله');
    recommendations.push('تقديم حوافز للحضور في الموعد');
  } else {
    recommendations.push('إرسال تذكير عادي 24h قبل الموعد');
  }
  
  // Specific recommendations based on factors
  factors.forEach(factor => {
    if (factor.name === 'توقيت الموعد' && factor.weight > 0.3) {
      recommendations.push('النظر في تغيير توقيت الموعد إلى وقت أكثر ملاءمة');
    }
    if (factor.name === 'تاريخ التغيب' && factor.weight > 0.5) {
      recommendations.push('مراجعة أسباب التغيب السابقة ومعالجتها');
    }
  });
  
  return recommendations;
}

/**
 * Helper functions for descriptions
 */
function getTimingDescription(score: number): string {
  if (score >= 0.3) return 'توقيت غير مناسب (صباح مبكر/مساء متأخر)';
  if (score >= 0.2) return 'توقيت مقبول مع بعض المخاطر';
  return 'توقيت مناسب';
}

function getAgeDescription(age: number | undefined, score: number): string {
  if (!age) return 'عمر غير معروف';
  if (score > 0.2) return `عمر ${age} سنة (فئة عمرية عالية الخطورة)`;
  return `عمر ${age} سنة (فئة عمرية منخفضة الخطورة)`;
}

function getRecencyDescription(lastVisit: string | undefined, score: number): string {
  if (!lastVisit) return 'لا يوجد سجل زيارات سابق';
  const days = Math.floor(differenceInHours(new Date(), parseISO(lastVisit)) / 24);
  if (days > 365) return `آخر زيارة قبل ${Math.floor(days/365)} سنة`;
  if (days > 180) return `آخر زيارة قبل ${Math.floor(days/30)} شهر`;
  if (days > 30) return `آخر زيارة قبل ${Math.floor(days/7)} أسبوع`;
  return `آخر زيارة قبل ${days} يوم`;
}

// ==========================
// 6. UTILITY FUNCTIONS
// ==========================

/**
 * Batch processing for multiple patients
 */
export function batchProcessPatients(
  patients: Patient[],
  appointments: Appointment[],
  processFn: (patient: Patient, patientAppointments: Appointment[]) => any
): any[] {
  return patients.map(patient => {
    const patientAppointments = appointments.filter(apt => apt.patientId === patient.id);
    return processFn(patient, patientAppointments);
  });
}

/**
 * Generates comprehensive clinic insights
 */
export function generateClinicInsights(
  patients: Patient[],
  appointments: Appointment[],
  treatmentPlans: TreatmentPlan[]
): {
  patientInsights: any[];
  appointmentInsights: any;
  efficiencyMetrics: any;
  recommendations: string[];
} {
  const patientInsights = batchProcessPatients(patients, appointments, (patient, patientAppointments) => {
    const riskAnalysis = analyzeHealthRisks(patient, patient.treatmentPlans || []);
    const noShowPrediction = predictNoShow(patient, patientAppointments, patientAppointments[0]);
    
    return {
      patientId: patient.id,
      name: patient.name,
      riskLevel: riskAnalysis.overallScore,
      noShowRisk: noShowPrediction.riskLevel,
      lastVisit: patient.lastVisit,
      totalAppointments: patientAppointments.length
    };
  });
  
  const appointmentInsights = {
    totalAppointments: appointments.length,
    upcomingAppointments: appointments.filter(apt => isAfter(parseISO(apt.date), new Date())).length,
    completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
    noShowRate: calculateOverallNoShowRate(appointments)
  };
  
  const efficiencyMetrics = {
    averageAppointmentDuration: calculateAverageAppointmentDuration(appointments),
    peakHours: identifyPeakHours(appointments),
    busiestDays: identifyBusiestDays(appointments)
  };
  
  const recommendations = generateClinicRecommendations(patientInsights, appointmentInsights, efficiencyMetrics);
  
  return {
    patientInsights,
    appointmentInsights,
    efficiencyMetrics,
    recommendations
  };
}

/**
 * Calculates overall no-show rate
 */
function calculateOverallNoShowRate(appointments: Appointment[]): number {
  const completed = appointments.filter(apt => apt.status === 'completed').length;
  return appointments.length > 0 ? (1 - completed / appointments.length) : 0;
}

/**
 * Calculates average appointment duration
 */
function calculateAverageAppointmentDuration(appointments: Appointment[]): number {
  // This would need actual duration data from completed appointments
  // For now, return estimated based on treatment types
  const durationMap: Record<string, number> = {
    'فحص': 15,
    'حشوة ضوئية': 30,
    'حشوة جذر': 45,
    'تنظيف اسنان': 30,
    'زراعة اسنان': 60,
    'قلع': 30
  };
  
  const totalMinutes = appointments.reduce((total, apt) => {
    return total + (durationMap[apt.treatment] || 30);
  }, 0);
  
  return appointments.length > 0 ? Math.round(totalMinutes / appointments.length) : 30;
}

/**
 * Identifies peak hours from appointment data
 */
function identifyPeakHours(appointments: Appointment[]): string[] {
  const hourCounts: Record<string, number> = {};
  
  appointments.forEach(apt => {
    const hour = apt.time.split(':')[0];
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  return Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);
}

/**
 * Identifies busiest days from appointment data
 */
function identifyBusiestDays(appointments: Appointment[]): string[] {
  const dayCounts: Record<string, number> = {};
  
  appointments.forEach(apt => {
    const day = format(parseISO(apt.date), 'EEEE', { locale: ar });
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  
  return Object.entries(dayCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([day]) => day);
}

/**
 * Generates clinic-wide recommendations
 */
function generateClinicRecommendations(
  patientInsights: any[],
  appointmentInsights: any,
  efficiencyMetrics: any
): string[] {
  const recommendations: string[] = [];
  
  // High-risk patients
  const highRiskPatients = patientInsights.filter(p => p.riskLevel > 7);
  if (highRiskPatients.length > 0) {
    recommendations.push(`يوجد ${highRiskPatients.length} مريض بمخاطر عالية - مراجعة ملفاتهم الطبية`);
  }
  
  // No-show prevention
  if (appointmentInsights.noShowRate > 0.2) {
    recommendations.push('نسبة التغيب مرتفعة - تنفيذ نظام تذكير متقدم');
  }
  
  // Efficiency improvements
  if (efficiencyMetrics.averageAppointmentDuration > 45) {
    recommendations.push('متوسط وقت الموعد طويل - مراجعة إجراءات العلاج');
  }
  
  // Peak hour management
  if (efficiencyMetrics.peakHours.length > 0) {
    recommendations.push(`أوقات الذروة: ${efficiencyMetrics.peakHours.join(', ')} - النظر في تمديد ساعات العمل`);
  }
  
  return recommendations;
}