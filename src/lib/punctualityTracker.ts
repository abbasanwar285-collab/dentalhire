/**
 * Patient Punctuality Tracker
 * Analyzes waiting room arrival records to predict patient punctuality patterns.
 * Uses real data from the waiting room "arrival" button to build behavioral profiles.
 */

import { parseISO, differenceInMinutes } from 'date-fns';

// ── Types ──

export interface ArrivalRecord {
  id: string;
  patientId: string;
  appointmentId: string;
  scheduledTime: string;   // HH:mm
  scheduledDate: string;   // YYYY-MM-DD
  actualArrivalTime: string; // ISO string
  differenceMinutes: number; // negative = early, positive = late
  createdAt: string;         // ISO string
  sessionStartTime?: string; // ISO string - when patient entered the clinic
  sessionEndTime?: string;   // ISO string - when patient left the clinic
}

export type PunctualityCategory = 'excellent' | 'good' | 'fair' | 'poor';
export type PunctualityTrend = 'improving' | 'stable' | 'declining';

export interface PunctualityProfile {
  patientId: string;
  totalRecords: number;
  onTimeCount: number;       // within ±10 min
  earlyCount: number;        // more than 10 min early
  lateCount: number;         // more than 10 min late
  averageDelay: number;      // average minutes (negative = early, positive = late)
  punctualityScore: number;  // 0-100
  category: PunctualityCategory;
  trend: PunctualityTrend;
  lastArrivalDiff: number;   // last recorded difference in minutes
}

export interface PunctualityBadge {
  icon: string;       // emoji
  label: string;      // Arabic
  color: string;      // tailwind text color
  bgColor: string;    // tailwind bg color
  borderColor: string;
  description: string;
}

// ── Constants ──

const ON_TIME_THRESHOLD = 10;  // ±10 minutes = on time
const MIN_RECORDS_FOR_PROFILE = 3;
const RECENT_WINDOW = 5;      // last 5 visits for trend analysis

// ── Core Functions ──

/**
 * Create an arrival record by comparing scheduled appointment time with actual arrival.
 */
export function createArrivalRecord(
  patientId: string,
  appointmentId: string,
  scheduledDate: string,   // YYYY-MM-DD
  scheduledTime: string,   // HH:mm
  actualArrivalTime: Date,
  recordId: string
): ArrivalRecord {
  // Build the scheduled datetime
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const scheduledDateObj = parseISO(scheduledDate);
  scheduledDateObj.setHours(hours, minutes, 0, 0);

  // Calculate difference: positive = arrived LATE, negative = arrived EARLY
  const diffMinutes = differenceInMinutes(actualArrivalTime, scheduledDateObj);

  return {
    id: recordId,
    patientId,
    appointmentId,
    scheduledTime,
    scheduledDate,
    actualArrivalTime: actualArrivalTime.toISOString(),
    differenceMinutes: diffMinutes,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Calculate the full punctuality profile for a patient from their arrival records.
 * Uses weighted scoring: recent records matter more.
 */
export function calculatePunctualityProfile(
  patientId: string,
  records: ArrivalRecord[]
): PunctualityProfile | null {
  const patientRecords = records
    .filter(r => r.patientId === patientId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (patientRecords.length === 0) return null;

  const total = patientRecords.length;
  let onTimeCount = 0;
  let earlyCount = 0;
  let lateCount = 0;
  let totalDelay = 0;

  patientRecords.forEach(r => {
    totalDelay += r.differenceMinutes;
    if (Math.abs(r.differenceMinutes) <= ON_TIME_THRESHOLD) {
      onTimeCount++;
    } else if (r.differenceMinutes < -ON_TIME_THRESHOLD) {
      earlyCount++;
    } else {
      lateCount++;
    }
  });

  const averageDelay = Math.round(totalDelay / total);

  // ── Calculate weighted punctuality score ──
  // Recent records (last RECENT_WINDOW) get 60% weight, older records get 40%
  const recentRecords = patientRecords.slice(-RECENT_WINDOW);
  const olderRecords = patientRecords.slice(0, Math.max(0, patientRecords.length - RECENT_WINDOW));

  const recentScore = calculateRawScore(recentRecords);
  const olderScore = olderRecords.length > 0 ? calculateRawScore(olderRecords) : recentScore;

  const punctualityScore = Math.round(
    olderRecords.length > 0
      ? recentScore * 0.6 + olderScore * 0.4
      : recentScore
  );

  // ── Category ──
  const category = getCategory(punctualityScore);

  // ── Trend: compare last RECENT_WINDOW vs overall ──
  const trend = calculateTrend(recentScore, olderScore, olderRecords.length);

  const lastRecord = patientRecords[patientRecords.length - 1];

  return {
    patientId,
    totalRecords: total,
    onTimeCount,
    earlyCount,
    lateCount,
    averageDelay,
    punctualityScore,
    category,
    trend,
    lastArrivalDiff: lastRecord.differenceMinutes,
  };
}

/**
 * Calculate a raw score (0-100) from a set of records.
 * Perfect on-time = 100, every minute of lateness reduces the score.
 */
function calculateRawScore(records: ArrivalRecord[]): number {
  if (records.length === 0) return 50;

  let totalScore = 0;

  records.forEach(r => {
    const absDiff = Math.abs(r.differenceMinutes);

    if (absDiff <= 5) {
      // Spot on — 100 points
      totalScore += 100;
    } else if (absDiff <= ON_TIME_THRESHOLD) {
      // Within threshold — 80-95 points
      totalScore += 95 - (absDiff - 5);
    } else if (r.differenceMinutes > ON_TIME_THRESHOLD) {
      // Late — penalty increases with lateness
      const latePenalty = Math.min(80, (r.differenceMinutes - ON_TIME_THRESHOLD) * 3);
      totalScore += Math.max(5, 80 - latePenalty);
    } else {
      // Very early (more than 10 min early) — small bonus for showing up
      totalScore += 70;
    }
  });

  return Math.round(totalScore / records.length);
}

function getCategory(score: number): PunctualityCategory {
  if (score >= 85) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function calculateTrend(
  recentScore: number,
  olderScore: number,
  olderCount: number
): PunctualityTrend {
  if (olderCount < 2) return 'stable';

  const diff = recentScore - olderScore;
  if (diff > 8) return 'improving';
  if (diff < -8) return 'declining';
  return 'stable';
}

// ── Badge / UI Helpers ──

/**
 * Get a display badge for the patient's punctuality profile.
 */
export function getPunctualityBadge(profile: PunctualityProfile | null): PunctualityBadge | null {
  if (!profile || profile.totalRecords < MIN_RECORDS_FOR_PROFILE) return null;

  const absAvg = Math.abs(profile.averageDelay);

  switch (profile.category) {
    case 'excellent':
      return {
        icon: '✅',
        label: 'ملتزم بمواعيده',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        description: absAvg <= 3
          ? 'مريض مثالي — يحضر في الموعد تماماً'
          : `مريض ملتزم — معدل ${absAvg} دقائق ${profile.averageDelay <= 0 ? 'مبكراً' : 'تأخير'}`,
      };
    case 'good':
      return {
        icon: '👍',
        label: 'التزام جيد',
        color: 'text-sky-700',
        bgColor: 'bg-sky-50',
        borderColor: 'border-sky-200',
        description: `التزام جيد — معدل ${absAvg} دقائق ${profile.averageDelay <= 0 ? 'مبكراً' : 'تأخير'}`,
      };
    case 'fair':
      return {
        icon: '⚠️',
        label: 'التزام متوسط',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        description: `تنبيه: يتأخر بمعدل ${absAvg} دقيقة`,
      };
    case 'poor':
      return {
        icon: '🔴',
        label: 'غير ملتزم بمواعيده',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        description: `تنبيه: هذا المريض يتأخر بمعدل ${absAvg} دقيقة — يرجى الانتباه`,
      };
  }
}

/**
 * Get a compact inline badge for use in waiting room / lists.
 */
export function getPunctualityInlineBadge(profile: PunctualityProfile | null): {
  icon: string;
  color: string;
  bgColor: string;
  tooltip: string;
} | null {
  if (!profile || profile.totalRecords < MIN_RECORDS_FOR_PROFILE) return null;

  switch (profile.category) {
    case 'excellent':
      return { icon: '✅', color: 'text-emerald-600', bgColor: 'bg-emerald-50', tooltip: 'مريض ملتزم بمواعيده' };
    case 'good':
      return { icon: '👍', color: 'text-sky-600', bgColor: 'bg-sky-50', tooltip: 'التزام جيد بالمواعيد' };
    case 'fair':
      return { icon: '⚠️', color: 'text-amber-600', bgColor: 'bg-amber-50', tooltip: 'التزام متوسط — يتأخر أحياناً' };
    case 'poor':
      return { icon: '🔴', color: 'text-red-600', bgColor: 'bg-red-50', tooltip: 'غير ملتزم بمواعيده' };
  }
}

/**
 * Quick check: does this patient have enough data for a profile?
 */
export function hasEnoughData(patientId: string, records: ArrivalRecord[]): boolean {
  return records.filter(r => r.patientId === patientId).length >= MIN_RECORDS_FOR_PROFILE;
}
