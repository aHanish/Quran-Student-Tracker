export type AttendanceStatus = 'present' | 'absent';

export interface Student {
  id: string;
  name: string;
  surahName: string;
  hasMemorizedSurah: boolean;
  reviewName: string;
  hasCompletedReview: boolean;
  createdAt: string;
  attendance: Record<string, AttendanceStatus>;
}

export type StudentDraft = Omit<Student, 'id' | 'createdAt' | 'attendance'>;

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

export function formatArabicNumber(value: number): string {
  return new Intl.NumberFormat('ar-LY').format(value);
}

export function formatDayLabel(day: number, date: Date): string {
  return `${formatArabicNumber(day)} ${ARABIC_MONTHS[date.getMonth()]}`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
