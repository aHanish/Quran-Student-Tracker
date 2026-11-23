import React, { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  EmptyState,
  PrimaryButton,
  ScreenHeading,
  SectionTitle,
  StatusBadge,
  Surface,
} from '@/components/StudentUI';
import { useStudents } from '@/context/StudentsContext';
import { useColors } from '@/hooks/useColors';
import {
  ARABIC_WEEKDAYS,
  AttendanceStatus,
  escapeHtml,
  formatArabicNumber,
  formatDayLabel,
  formatReportDayLabel,
  formatReportMonthLabel,
  getDailyRecord,
  getDateKey,
  getMonthDayCount,
  getReportDays,
  getMonthTitle,
  getMonthlyPlan,
  getStudentAttendanceSummary,
} from '@/lib/student-utils';

function attendanceLabel(status: AttendanceStatus | null | undefined) {
  if (status === 'present') return 'حاضر';
  if (status === 'absent') return 'غائب';
  return 'لم يسجل';
}

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { students, removeStudent, isReady } = useStudents();
  const student = students.find((item) => item.id === id);
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [exporting, setExporting] = useState(false);
  const daysCount = getMonthDayCount(month);
  const summary = useMemo(
    () =>
      student
        ? getStudentAttendanceSummary(student, month)
        : { present: 0, absent: 0 },
    [month, student],
  );
  const monthlyPlan = student ? getMonthlyPlan(student, month) : null;
  const leadingBlanks = new Date(month.getFullYear(), month.getMonth(), 1).getDay();

  const confirmDelete = () => {
    if (!student) return;
    Alert.alert(
      'حذف الطالب',
      `هل تريد حذف سجل ${student.name} وكل بيانات حضوره؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            removeStudent(student.id);
            router.replace('/students');
          },
        },
      ],
    );
  };

  const exportPdf = async () => {
    if (!student) return;
    setExporting(true);
    try {
      const rows = getReportDays(month)
        .map((day) => {
          const dayKey = getDateKey(month.getFullYear(), month.getMonth(), day);
          const record = getDailyRecord(student, dayKey);
          const hasDailyEntry = Boolean(student.dailyRecords[dayKey]);
          return `<tr>
            <td>${escapeHtml(formatReportDayLabel(day, month))}</td>
            <td>${escapeHtml(attendanceLabel(record.attendance))}</td>
            <td>${escapeHtml(hasDailyEntry ? record.surahName || 'غير محددة' : 'لم يسجل')}</td>
            <td>${record.hasMemorizedSurah === null ? 'لم يسجل' : record.hasMemorizedSurah ? 'نعم' : 'لا'}</td>
            <td>${escapeHtml(hasDailyEntry ? record.reviewName || 'غير محددة' : 'لم يسجل')}</td>
            <td>${record.hasCompletedReview === null ? 'لم يسجل' : record.hasCompletedReview ? 'نعم' : 'لا'}</td>
          </tr>`;
        })
        .join('');
      const reportPlan = getMonthlyPlan(student, month);
      const html = `
        <!doctype html>
        <html lang="ar" dir="rtl">
          <head>
            <meta charset="utf-8" />
            <style>
              @page { size: A4 landscape; margin: 20px; }
              body { font-family: Arial, sans-serif; direction: rtl; color: #173b32; padding: 12px; }
              h1 { font-size: 24px; margin-bottom: 4px; }
              h2 { font-size: 16px; margin-top: 26px; }
              .muted { color: #718078; margin-top: 0; }
              .box { background: #f4f5ed; border-radius: 12px; padding: 14px 18px; margin: 12px 0; }
              .row { display: flex; justify-content: space-between; gap: 20px; padding: 7px 0; border-bottom: 1px solid #e2e4d9; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
              th, td { border-bottom: 1px solid #e2e4d9; padding: 7px; text-align: right; }
              th { background: #e9eee6; }
            </style>
          </head>
          <body>
            <h1>تقرير متابعة الطالب</h1>
            <p class="muted">${escapeHtml(formatReportMonthLabel(month))}</p>
            <section class="box">
              <div class="row"><strong>اسم الطالب</strong><span>${escapeHtml(student.name)}</span></div>
              <div class="row"><strong>السورة الحالية</strong><span>${escapeHtml(student.surahName || 'غير محددة')}</span></div>
              <div class="row"><strong>حفظ السورة</strong><span>${student.hasMemorizedSurah ? 'نعم' : 'لا'}</span></div>
              <div class="row"><strong>المراجعة</strong><span>${escapeHtml(student.reviewName || 'غير محددة')}</span></div>
              <div class="row"><strong>أتم المراجعة</strong><span>${student.hasCompletedReview ? 'نعم' : 'لا'}</span></div>
            </section>
            <h2>خطة بداية الشهر</h2>
            <section class="box">
              <div class="row"><strong>السورة</strong><span>${escapeHtml(reportPlan.surahName || 'غير محددة')}</span></div>
              <div class="row"><strong>حالة الحفظ</strong><span>${reportPlan.hasMemorizedSurah ? 'نعم' : 'لا'}</span></div>
              <div class="row"><strong>المراجعة</strong><span>${escapeHtml(reportPlan.reviewName || 'غير محددة')}</span></div>
              <div class="row"><strong>حالة المراجعة</strong><span>${reportPlan.hasCompletedReview ? 'تمت' : 'لم تتم'}</span></div>
            </section>
            <h2>الحضور والغياب</h2>
            <p>الحضور: ${formatArabicNumber(summary.present)} &nbsp; | &nbsp; الغياب: ${formatArabicNumber(summary.absent)}</p>
            <table>
              <thead><tr><th>اليوم</th><th>الحضور</th><th>سورة اليوم</th><th>حفظها؟</th><th>مراجعة اليوم</th><th>أتم المراجعة؟</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>`;

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        return;
      }

      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `تقرير ${student.name}`,
        });
      } else {
        Alert.alert('تم إنشاء التقرير', 'تعذرت مشاركة الملف من هذا الجهاز.');
      }
    } catch {
      Alert.alert('تعذر إنشاء التقرير', 'حاول مرة أخرى بعد قليل.');
    } finally {
      setExporting(false);
    }
  };

  const moveMonth = (delta: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  if (!isReady) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>جارٍ تحميل بيانات الطالب...</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: Platform.OS === 'web' ? 67 : insets.top + 18 }}
      >
        <EmptyState
          title="لم يتم العثور على الطالب"
          message="ربما حُذف السجل أو لم يعد متاحًا."
          action={
            <PrimaryButton label="العودة إلى الطلاب" onPress={() => router.replace('/students')} />
          }
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12,
          paddingBottom: Platform.OS === 'web' ? 52 : insets.bottom + 28,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
          testID="student-detail-back"
        >
          <Feather name="arrow-right" size={19} color={colors.foreground} />
        </Pressable>
        <View style={styles.topActionGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="تعديل بيانات الطالب"
            onPress={() =>
              router.push({ pathname: '/student/form', params: { id: student.id } })
            }
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
            testID="student-edit"
          >
            <Feather name="edit-2" size={17} color={colors.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="حذف الطالب"
            onPress={confirmDelete}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
            testID="student-delete"
          >
            <Feather name="trash-2" size={17} color={colors.destructive} />
          </Pressable>
        </View>
      </View>

      <View style={styles.profile}>
        <View style={[styles.largeAvatar, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.largeAvatarText, { color: colors.primary }]}>
            {student.name.trim().slice(0, 1)}
          </Text>
        </View>
        <ScreenHeading
          eyebrow="ملف الطالب"
          title={student.name}
          subtitle="تفاصيل الحفظ والمراجعة والحضور"
        />
      </View>

      <Surface style={styles.learningCard}>
        <View style={styles.learningRow}>
          <View style={[styles.detailIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="book-open" size={17} color={colors.primary} />
          </View>
          <View style={styles.detailText}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              السورة الحالية
            </Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {student.surahName || 'لم تُحدد'}
            </Text>
          </View>
          <StatusBadge
            label={student.hasMemorizedSurah ? 'تم الحفظ' : 'لم يتم'}
            tone={student.hasMemorizedSurah ? 'good' : 'warm'}
          />
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.learningRow}>
          <View style={[styles.detailIcon, { backgroundColor: colors.accent }]}>
            <Feather name="refresh-cw" size={17} color={colors.accentForeground} />
          </View>
          <View style={styles.detailText}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              المراجعة
            </Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {student.reviewName || 'لم تُحدد'}
            </Text>
          </View>
          <StatusBadge
            label={student.hasCompletedReview ? 'تمت' : 'لم تتم'}
            tone={student.hasCompletedReview ? 'good' : 'muted'}
          />
        </View>
      </Surface>

      <View style={styles.monthHeader}>
        <SectionTitle title="خطة الشهر والحضور" />
        <View style={styles.monthControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="الشهر التالي"
            onPress={() => moveMonth(1)}
            testID="student-next-month"
          >
            <Feather name="chevron-right" size={19} color={colors.primary} />
          </Pressable>
          <Text style={[styles.monthTitle, { color: colors.foreground }]}>
            {getMonthTitle(month)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="الشهر السابق"
            onPress={() => moveMonth(-1)}
            testID="student-previous-month"
          >
            <Feather name="chevron-left" size={19} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {monthlyPlan ? (
        <Surface style={styles.monthlyPlanCard}>
          <View style={styles.monthlyPlanTitleRow}>
            <Text style={[styles.monthlyPlanTitle, { color: colors.foreground }]}>
              خطة بداية الشهر
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/attendance',
                  params: { mode: 'monthly', month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}` },
                })
              }
              testID="student-edit-monthly-plan"
              style={({ pressed }) => [
                styles.planEditButton,
                { backgroundColor: colors.secondary },
                pressed && styles.pressed,
              ]}
            >
              <Feather name="edit-2" size={13} color={colors.primary} />
              <Text style={[styles.planEditText, { color: colors.primary }]}>تعديل</Text>
            </Pressable>
          </View>
          <Text style={[styles.monthlyPlanLine, { color: colors.mutedForeground }]}>
            السورة: {monthlyPlan.surahName || 'غير محددة'} ·{' '}
            {monthlyPlan.hasMemorizedSurah ? 'تم حفظها' : 'لم تحفظ بعد'}
          </Text>
          <Text style={[styles.monthlyPlanLine, { color: colors.mutedForeground }]}>
            المراجعة: {monthlyPlan.reviewName || 'غير محددة'} ·{' '}
            {monthlyPlan.hasCompletedReview ? 'تمت' : 'لم تتم'}
          </Text>
        </Surface>
      ) : null}

      <Surface style={styles.calendarCard}>
        <View style={styles.calendarSummary}>
          <StatusBadge label={`${formatArabicNumber(summary.present)} حضور`} tone="good" />
          <StatusBadge label={`${formatArabicNumber(summary.absent)} غياب`} tone="bad" />
        </View>
        <Text style={[styles.calendarHint, { color: colors.mutedForeground }]}>
          اضغط على أي يوم لتسجيل الحضور والحفظ والسورة والمراجعة لذلك اليوم.
        </Text>
        <View style={styles.weekdayRow}>
          {ARABIC_WEEKDAYS.map((day, index) => (
            <Text
              key={`${day}-${index}`}
              style={[styles.weekday, { color: colors.mutedForeground }]}
            >
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {Array.from({ length: leadingBlanks }, (_, index) => (
            <View key={`blank-${index}`} style={styles.dayCell} />
          ))}
          {Array.from({ length: daysCount }, (_, index) => {
            const day = index + 1;
            const dayKey = getDateKey(month.getFullYear(), month.getMonth(), day);
            const record = getDailyRecord(student, dayKey);
            const status = record.attendance;
            const activeColor =
              status === 'present'
                ? colors.primary
                : status === 'absent'
                  ? colors.destructive
                  : colors.card;
            return (
              <Pressable
                key={dayKey}
                accessibilityRole="button"
                accessibilityLabel={`${formatDayLabel(day, month)}، ${attendanceLabel(status)}. اضغط للتغيير`}
                accessibilityHint="يتغير بين حاضر وغائب ولم يسجل"
                onPress={() =>
                  router.push({
                    pathname: '/student/daily',
                    params: { id: student.id, dayKey },
                  })
                }
                testID={`attendance-day-${dayKey}`}
                style={({ pressed }) => [
                  styles.dayCell,
                  styles.calendarDay,
                  {
                    backgroundColor: activeColor,
                    borderColor: status ? activeColor : colors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    { color: status ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {formatArabicNumber(day)}
                </Text>
                {status ? (
                  <Feather
                    name={status === 'present' ? 'check' : 'x'}
                    size={11}
                    color={colors.primaryForeground}
                  />
                ) : null}
                {record.hasMemorizedSurah !== null ? (
                  <View
                    style={[
                      styles.memorizationDot,
                      {
                        backgroundColor: record.hasMemorizedSurah
                          ? colors.accentForeground
                          : colors.mutedForeground,
                      },
                    ]}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>حاضر</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.destructive }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>غائب</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>لم يسجل</Text>
          </View>
        </View>
      </Surface>

      <PrimaryButton
        label={exporting ? 'جارٍ تجهيز التقرير...' : 'تصدير تقرير الطالب PDF'}
        icon="share"
        onPress={exportPdf}
        disabled={exporting}
        testID="student-export-pdf"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 16, paddingHorizontal: 20 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  topActions: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  topActionGroup: { flexDirection: 'row-reverse', gap: 8 },
  iconButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  profile: { alignItems: 'center', gap: 9, paddingTop: 4 },
  largeAvatar: {
    alignItems: 'center',
    borderRadius: 26,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  largeAvatarText: { fontSize: 29, fontWeight: '800' },
  learningCard: { gap: 14, padding: 15 },
  learningRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: 10 },
  detailIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  detailText: { flex: 1, gap: 4 },
  detailLabel: { fontSize: 11, textAlign: 'right' },
  detailValue: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  divider: { height: 1 },
  monthHeader: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  monthControls: { alignItems: 'center', flexDirection: 'row-reverse', gap: 10 },
  monthTitle: { fontSize: 13, fontWeight: '700' },
  calendarCard: { gap: 12, padding: 14 },
  monthlyPlanCard: { gap: 7, padding: 14 },
  monthlyPlanTitleRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  monthlyPlanTitle: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  planEditButton: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row-reverse',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  planEditText: { fontSize: 11, fontWeight: '700' },
  monthlyPlanLine: { fontSize: 11, lineHeight: 18, textAlign: 'right' },
  calendarSummary: { flexDirection: 'row-reverse', gap: 8 },
  calendarHint: { fontSize: 11, lineHeight: 18, textAlign: 'right' },
  weekdayRow: { flexDirection: 'row-reverse' },
  weekday: { flex: 1, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  calendarGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  dayCell: { alignItems: 'center', height: 42, justifyContent: 'center', width: '14.2857%' },
  calendarDay: { borderRadius: 12, borderWidth: 1, marginBottom: 4 },
  dayNumber: { fontSize: 12, fontWeight: '700' },
  memorizationDot: {
    borderRadius: 999,
    height: 4,
    marginTop: 1,
    width: 4,
  },
  legend: { flexDirection: 'row-reverse', gap: 14, justifyContent: 'center', paddingTop: 4 },
  legendItem: { alignItems: 'center', flexDirection: 'row-reverse', gap: 5 },
  legendDot: { borderRadius: 999, height: 8, width: 8 },
  legendText: { fontSize: 10 },
  pressed: { opacity: 0.74 },
});
