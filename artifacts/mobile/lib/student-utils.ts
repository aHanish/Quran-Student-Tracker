export type AttendanceStatus = 'present' | 'absent';

export interface StudyPlan {
  surahName: string;
  hasMemorizedSurah: boolean;
  reviewName: string;
  hasCompletedReview: boolean;
}

export interface DailyRecord {
  attendance: AttendanceStatus | null;
  surahName: string;
  hasMemorizedSurah: boolean | null;
  reviewName: string;
  hasCompletedReview: boolean | null;
}

export interface Student {
  id: string;
  name: string;
  surahName: string;
  hasMemorizedSurah: boolean;
  reviewName: string;
  hasCompletedReview: boolean;
  createdAt: string;
  attendance: Record<string, AttendanceStatus>;
  monthlyPlans: Record<string, StudyPlan>;
  dailyRecords: Record<string, DailyRecord>;
}

export type StudentDraft = Omit<
  Student,
  'id' | 'createdAt' | 'attendance' | 'monthlyPlans' | 'dailyRecords'
>;

export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export const ARABIC_WEEKDAYS = ['أح', 'اث', 'ثل', 'أر', 'خم', 'جم', 'سب'];
const ARABIC_WEEKDAYS_FULL = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export function getMonthTitle(date: Date): string {
  return `${ARABIC_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getMonthDayCount(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getAttendanceSummary(
  attendance: Record<string, AttendanceStatus>,
  date: Date,
) {
  const monthKey = getMonthKey(date);
  let present = 0;
  let absent = 0;

  Object.entries(attendance).forEach(([day, status]) => {
    if (!day.startsWith(`${monthKey}-`)) return;
    if (status === 'present') present += 1;
    if (status === 'absent') absent += 1;
  });

  return { present, absent };
}

export function getMonthlyPlan(student: Student, month: Date | string): StudyPlan {
  const monthKey = typeof month === 'string' ? month : getMonthKey(month);
  return (
    student.monthlyPlans?.[monthKey] ?? {
      surahName: student.surahName,
      hasMemorizedSurah: student.hasMemorizedSurah,
      reviewName: student.reviewName,
      hasCompletedReview: student.hasCompletedReview,
    }
  );
}

export function getDailyRecord(student: Student, dayKey: string): DailyRecord {
  const saved = student.dailyRecords?.[dayKey];
  if (saved) return saved;
  const plan = getMonthlyPlan(student, dayKey.slice(0, 7));
  return {
    attendance: student.attendance?.[dayKey] ?? null,
    surahName: plan.surahName,
    hasMemorizedSurah: null,
    reviewName: plan.reviewName,
    hasCompletedReview: null,
  };
}

export function getStudentAttendanceSummary(student: Student, month: Date) {
  const summary = { present: 0, absent: 0 };
  const days = getMonthDayCount(month);
  for (let day = 1; day <= days; day += 1) {
    const dayKey = getDateKey(month.getFullYear(), month.getMonth(), day);
    const status = getDailyRecord(student, dayKey).attendance;
    if (status === 'present') summary.present += 1;
    if (status === 'absent') summary.absent += 1;
  }
  return summary;
}

export function formatArabicNumber(value: number): string {
  return new Intl.NumberFormat('ar-LY').format(value);
}

export function formatDayLabel(day: number, date: Date): string {
  return `${formatArabicNumber(day)} ${ARABIC_MONTHS[date.getMonth()]}`;
}

export function getReportDays(date: Date): number[] {
  return Array.from({ length: getMonthDayCount(date) }, (_, index) => index + 1).filter(
    (day) => {
      const weekday = new Date(date.getFullYear(), date.getMonth(), day).getDay();
      return weekday !== 4 && weekday !== 5;
    },
  );
}

export function formatReportDayLabel(day: number, date: Date): string {
  const weekday = new Date(date.getFullYear(), date.getMonth(), day).getDay();
  return `يوم ${ARABIC_WEEKDAYS_FULL[weekday]} ${day}`;
}

export function formatReportMonthLabel(date: Date): string {
  return `شهر ${date.getMonth() + 1} / ${date.getFullYear()}`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
