import React, { useEffect, useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ScreenHeading, Surface } from '@/components/StudentUI';
import { useStudents } from '@/context/StudentsContext';
import { useColors } from '@/hooks/useColors';
import {
  AttendanceStatus,
  DailyRecord,
  StudyPlan,
  formatArabicNumber,
  getDailyRecord,
  getDateKey,
  getMonthKey,
  getMonthTitle,
  getMonthlyPlan,
  getStudentAttendanceSummary,
} from '@/lib/student-utils';

type RegisterMode = 'daily' | 'monthly';

function cycleAttendance(status: AttendanceStatus | null): AttendanceStatus | null {
  if (status === null) return 'present';
  if (status === 'present') return 'absent';
  return null;
}

function cycleBoolean(status: boolean | null): boolean | null {
  if (status === null) return true;
  if (status) return false;
  return null;
}

function QuickStatus({
  title,
  value,
  onPress,
  testID,
}: {
  title: string;
  value: 'present' | 'absent' | 'yes' | 'no' | 'empty';
  onPress: () => void;
  testID: string;
}) {
  const colors = useColors();
  const display = {
    present: { label: 'حضر', background: colors.secondary, foreground: colors.primary },
    absent: { label: 'غاب', background: colors.muted, foreground: colors.destructive },
    yes: { label: 'حفظ', background: colors.secondary, foreground: colors.primary },
    no: { label: 'لم يحفظ', background: colors.muted, foreground: colors.destructive },
    empty: { label: 'سجّل', background: colors.card, foreground: colors.mutedForeground },
  }[value];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${display.label}. اضغط للتغيير`}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.quickStatus,
        { backgroundColor: display.background, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.quickTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <Text style={[styles.quickValue, { color: display.foreground }]}>{display.label}</Text>
    </Pressable>
  );
}

function MonthlyPlanRow({
  student,
  monthKey,
}: {
  student: ReturnType<typeof useStudents>['students'][number];
  monthKey: string;
}) {
  const colors = useColors();
  const { setMonthlyPlan } = useStudents();
  const plan = getMonthlyPlan(student, monthKey);
  const [surahName, setSurahName] = useState(plan.surahName);
  const [reviewName, setReviewName] = useState(plan.reviewName);
  const [hasMemorizedSurah, setHasMemorizedSurah] = useState(plan.hasMemorizedSurah);
  const [hasCompletedReview, setHasCompletedReview] = useState(plan.hasCompletedReview);
  const savePlan = (patch: Partial<StudyPlan> = {}) => {
    setMonthlyPlan(student.id, monthKey, {
      surahName,
      reviewName,
      hasMemorizedSurah,
      hasCompletedReview,
      ...patch,
    });
  };

  return (
    <Surface style={styles.planCard}>
      <View style={styles.studentHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {student.name.trim().slice(0, 1)}
          </Text>
        </View>
        <Text style={[styles.studentName, { color: colors.foreground }]}>{student.name}</Text>
      </View>

      <View style={styles.planFields}>
        <View style={styles.planField}>
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
            سورة بداية الشهر
          </Text>
          <TextInput
            accessibilityLabel={`سورة بداية الشهر للطالب ${student.name}`}
            onChangeText={setSurahName}
            onBlur={() => savePlan()}
            placeholder="اكتب اسم السورة"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.input,
                color: colors.foreground,
              },
            ]}
            testID={`monthly-surah-${student.id}`}
            value={surahName}
          />
        </View>
        <View style={styles.planField}>
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
            مراجعة بداية الشهر
          </Text>
          <TextInput
            accessibilityLabel={`مراجعة بداية الشهر للطالب ${student.name}`}
            onChangeText={setReviewName}
            onBlur={() => savePlan()}
            placeholder="اكتب المراجعة"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.input,
                color: colors.foreground,
              },
            ]}
            testID={`monthly-review-${student.id}`}
            value={reviewName}
          />
        </View>
      </View>

      <View style={styles.planStatusRow}>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: hasMemorizedSurah }}
          accessibilityLabel={`حالة حفظ السورة في بداية الشهر للطالب ${student.name}`}
          onPress={() => {
            const nextValue = !hasMemorizedSurah;
            setHasMemorizedSurah(nextValue);
            savePlan({ hasMemorizedSurah: nextValue });
          }}
          testID={`monthly-memorized-${student.id}`}
          style={[
            styles.planStatus,
            {
              backgroundColor: hasMemorizedSurah ? colors.secondary : colors.muted,
            },
          ]}
        >
          <Text
            style={{
              color: hasMemorizedSurah ? colors.primary : colors.mutedForeground,
              fontSize: 11,
              fontWeight: '700',
            }}
          >
            {hasMemorizedSurah ? 'الحفظ: نعم' : 'الحفظ: لا'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: hasCompletedReview }}
          accessibilityLabel={`حالة المراجعة في بداية الشهر للطالب ${student.name}`}
          onPress={() => {
            const nextValue = !hasCompletedReview;
            setHasCompletedReview(nextValue);
            savePlan({ hasCompletedReview: nextValue });
          }}
          testID={`monthly-review-status-${student.id}`}
          style={[
            styles.planStatus,
            {
              backgroundColor: hasCompletedReview ? colors.secondary : colors.muted,
            },
          ]}
        >
          <Text
            style={{
              color: hasCompletedReview ? colors.primary : colors.mutedForeground,
              fontSize: 11,
              fontWeight: '700',
            }}
          >
            {hasCompletedReview ? 'المراجعة: تمت' : 'المراجعة: لم تتم'}
          </Text>
        </Pressable>
      </View>
      <Text style={[styles.autoSave, { color: colors.mutedForeground }]}>
        تحفظ التغييرات تلقائيًا
      </Text>
    </Surface>
  );
}

function DailyRegisterRow({
  student,
  dayKey,
}: {
  student: ReturnType<typeof useStudents>['students'][number];
  dayKey: string;
}) {
  const colors = useColors();
  const router = useRouter();
  const { updateDailyRecord } = useStudents();
  const record: DailyRecord = getDailyRecord(student, dayKey);
  const attendanceValue =
    record.attendance === 'present'
      ? 'present'
      : record.attendance === 'absent'
        ? 'absent'
        : 'empty';
  const memorizationValue =
    record.hasMemorizedSurah === true
      ? 'yes'
      : record.hasMemorizedSurah === false
        ? 'no'
        : 'empty';

  return (
    <Surface style={styles.dailyCard}>
      <View style={styles.studentHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {student.name.trim().slice(0, 1)}
          </Text>
        </View>
        <Text style={[styles.studentName, { color: colors.foreground }]}>{student.name}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`تعديل سورة ومراجعة اليوم للطالب ${student.name}`}
          onPress={() =>
            router.push({ pathname: '/student/daily', params: { id: student.id, dayKey } })
          }
          testID={`daily-edit-${student.id}`}
          style={({ pressed }) => [
            styles.editToday,
            { backgroundColor: colors.secondary },
            pressed && styles.pressed,
          ]}
        >
          <Feather name="edit-2" size={14} color={colors.primary} />
          <Text style={[styles.editTodayText, { color: colors.primary }]}>تفاصيل اليوم</Text>
        </Pressable>
      </View>

      <View style={styles.quickRow}>
        <QuickStatus
          title="الحضور"
          value={attendanceValue}
          onPress={() =>
            updateDailyRecord(student.id, dayKey, {
              attendance: cycleAttendance(record.attendance),
            })
          }
          testID={`daily-attendance-${student.id}`}
        />
        <QuickStatus
          title="الحفظ"
          value={memorizationValue}
          onPress={() =>
            updateDailyRecord(student.id, dayKey, {
              hasMemorizedSurah: cycleBoolean(record.hasMemorizedSurah),
            })
          }
          testID={`daily-memorized-${student.id}`}
        />
      </View>

      <View style={[styles.studyLine, { borderTopColor: colors.border }]}>
        <Text style={[styles.studyText, { color: colors.mutedForeground }]} numberOfLines={1}>
          السورة: {record.surahName || 'غير محددة'}
        </Text>
        <Text style={[styles.studyText, { color: colors.mutedForeground }]} numberOfLines={1}>
          المراجعة: {record.reviewName || 'غير محددة'}
        </Text>
      </View>
    </Surface>
  );
}

export default function AttendanceScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; month?: string }>();
  const insets = useSafeAreaInsets();
  const { students, isReady } = useStudents();
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof params.month === 'string' && /^\d{4}-\d{2}$/.test(params.month)) {
      const [year, month] = params.month.split('-').map(Number);
      return new Date(year, month - 1, 1);
    }
    return new Date();
  });
  const [mode, setMode] = useState<RegisterMode>(
    params.mode === 'monthly' ? 'monthly' : 'daily',
  );
  useEffect(() => {
    if (params.mode === 'daily' || params.mode === 'monthly') {
      setMode(params.mode);
    }
    if (typeof params.month === 'string' && /^\d{4}-\d{2}$/.test(params.month)) {
      const [year, month] = params.month.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, 1));
    }
  }, [params.mode, params.month]);
  const monthKey = getMonthKey(selectedDate);
  const dayKey = getDateKey(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
  );
  const dailyTotals = useMemo(
    () =>
      students.reduce(
        (total, student) => {
          const record = getDailyRecord(student, dayKey);
          return {
            present: total.present + (record.attendance === 'present' ? 1 : 0),
            absent: total.absent + (record.attendance === 'absent' ? 1 : 0),
            memorized: total.memorized + (record.hasMemorizedSurah === true ? 1 : 0),
          };
        },
        { present: 0, absent: 0, memorized: 0 },
      ),
    [dayKey, students],
  );
  const monthSummary = students.reduce(
    (total, student) => {
      const summary = getStudentAttendanceSummary(student, selectedDate);
      return {
        present: total.present + summary.present,
        absent: total.absent + summary.absent,
      };
    },
    { present: 0, absent: 0 },
  );

  const moveDate = (delta: number) => {
    setSelectedDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth(),
          current.getDate() + delta,
        ),
    );
  };
  const moveMonth = (delta: number) => {
    setSelectedDate((current) => {
      const targetMonth = new Date(current.getFullYear(), current.getMonth() + delta, 1);
      const lastDay = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth() + 1,
        0,
      ).getDate();
      return new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth(),
        Math.min(current.getDate(), lastDay),
      );
    });
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? 67 : insets.top + 14,
            paddingBottom: Platform.OS === 'web' ? 112 : 108,
          },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
        <ScreenHeading
          eyebrow="تسجيل سريع"
          title={mode === 'daily' ? 'سجل اليوم' : 'خطة بداية الشهر'}
          subtitle={
            mode === 'daily'
              ? 'حدّث الحضور والحفظ من هذه القائمة مباشرة.'
              : 'سجّل سورة ومراجعة بداية الشهر لكل طالب.'
          }
        />

        <View style={[styles.modeSwitch, { backgroundColor: colors.muted }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'daily' }}
            onPress={() => setMode('daily')}
            testID="register-mode-daily"
            style={[
              styles.modeButton,
              mode === 'daily' && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.modeLabel,
                { color: mode === 'daily' ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              تسجيل اليوم
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'monthly' }}
            onPress={() => setMode('monthly')}
            testID="register-mode-monthly"
            style={[
              styles.modeButton,
              mode === 'monthly' && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.modeLabel,
                {
                  color:
                    mode === 'monthly' ? colors.primaryForeground : colors.mutedForeground,
                },
              ]}
            >
              خطة أول الشهر
            </Text>
          </Pressable>
        </View>

        <Surface style={styles.dateCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mode === 'daily' ? 'اليوم التالي' : 'الشهر التالي'}
            onPress={() => (mode === 'daily' ? moveDate(1) : moveMonth(1))}
            testID="register-next-date"
            style={styles.dateArrow}
          >
            <Feather name="chevron-right" size={20} color={colors.primary} />
          </Pressable>
          <View style={styles.dateInfo}>
            <Text style={[styles.dateCaption, { color: colors.mutedForeground }]}>
              {mode === 'daily' ? 'تاريخ التسجيل' : 'الخطة المحددة'}
            </Text>
            <Text style={[styles.dateTitle, { color: colors.foreground }]}>
              {mode === 'daily'
                ? selectedDate.toLocaleDateString('ar-LY', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : getMonthTitle(selectedDate)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mode === 'daily' ? 'اليوم السابق' : 'الشهر السابق'}
            onPress={() => (mode === 'daily' ? moveDate(-1) : moveMonth(-1))}
            testID="register-previous-date"
            style={styles.dateArrow}
          >
            <Feather name="chevron-left" size={20} color={colors.primary} />
          </Pressable>
        </Surface>

        {mode === 'daily' ? (
          <>
            <View style={styles.dailyStats}>
              <Surface style={styles.dailyStat}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {formatArabicNumber(dailyTotals.present)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>حضور</Text>
              </Surface>
              <Surface style={styles.dailyStat}>
                <Text style={[styles.statValue, { color: colors.destructive }]}>
                  {formatArabicNumber(dailyTotals.absent)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>غياب</Text>
              </Surface>
              <Surface style={styles.dailyStat}>
                <Text style={[styles.statValue, { color: colors.accentForeground }]}>
                  {formatArabicNumber(dailyTotals.memorized)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>حفظوا</Text>
              </Surface>
            </View>
            <Text style={[styles.monthSummary, { color: colors.mutedForeground }]}>
              {getMonthTitle(selectedDate)}: {formatArabicNumber(monthSummary.present)} حضور ·{' '}
              {formatArabicNumber(monthSummary.absent)} غياب
            </Text>
          </>
        ) : (
          <Text style={[styles.planHint, { color: colors.mutedForeground }]}>
            تُستخدم أسماء السورة والمراجعة تلقائيًا في سجل كل يوم، ويمكن تغييرها لليوم منفردًا.
          </Text>
        )}

        {isReady && students.length ? (
          <View style={styles.studentList}>
            {students.map((student) =>
              mode === 'daily' ? (
                <DailyRegisterRow key={student.id} student={student} dayKey={dayKey} />
              ) : (
                <MonthlyPlanRow key={`${student.id}-${monthKey}`} student={student} monthKey={monthKey} />
              ),
            )}
          </View>
        ) : isReady ? (
          <Surface style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              لا يوجد طلاب مسجلون
            </Text>
            <Text style={[styles.emptyMessage, { color: colors.mutedForeground }]}>
              أضف طالبًا من تبويب الطلاب، ثم سجّل خطة الشهر والحضور اليومي.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/student/form')}
              testID="attendance-add-student"
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.addButtonLabel, { color: colors.primaryForeground }]}>
                إضافة طالب
              </Text>
            </Pressable>
          </Surface>
        ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 14, paddingHorizontal: 20 },
  modeSwitch: {
    borderRadius: 14,
    flexDirection: 'row-reverse',
    gap: 4,
    padding: 4,
  },
  modeButton: {
    alignItems: 'center',
    borderRadius: 11,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
  },
  modeLabel: { fontSize: 12, fontWeight: '700' },
  dateCard: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dateArrow: {
    alignItems: 'center',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  dateInfo: { alignItems: 'center', flex: 1, gap: 4 },
  dateCaption: { fontSize: 10 },
  dateTitle: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  dailyStats: { flexDirection: 'row-reverse', gap: 8 },
  dailyStat: { alignItems: 'center', flex: 1, gap: 4, paddingVertical: 10 },
  statValue: { fontSize: 19, fontWeight: '800' },
  statLabel: { fontSize: 10 },
  monthSummary: { fontSize: 11, marginTop: -5, textAlign: 'center' },
  planHint: { fontSize: 12, lineHeight: 20, textAlign: 'right' },
  studentList: { gap: 10 },
  dailyCard: { gap: 12, padding: 14 },
  planCard: { gap: 12, padding: 14 },
  studentHeader: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 9,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 13,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  studentName: { flex: 1, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  editToday: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row-reverse',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  editTodayText: { fontSize: 10, fontWeight: '700' },
  quickRow: { flexDirection: 'row-reverse', gap: 9 },
  quickStatus: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    minHeight: 55,
    justifyContent: 'center',
  },
  quickTitle: { fontSize: 9 },
  quickValue: { fontSize: 12, fontWeight: '800' },
  studyLine: { borderTopWidth: 1, gap: 4, paddingTop: 9 },
  studyText: { fontSize: 10, textAlign: 'right' },
  planFields: { gap: 9 },
  planField: { gap: 5 },
  inputLabel: { fontSize: 10, fontWeight: '700', textAlign: 'right' },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 13,
    minHeight: 42,
    paddingHorizontal: 11,
    textAlign: 'right',
  },
  planStatusRow: { flexDirection: 'row-reverse', gap: 8 },
  planStatus: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  autoSave: { fontSize: 9, marginTop: -3, textAlign: 'right' },
  emptyCard: { alignItems: 'center', gap: 10, padding: 22 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyMessage: { fontSize: 12, lineHeight: 19, textAlign: 'center' },
  addButton: { borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  addButtonLabel: { fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
