import React, { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
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
  ScreenHeading,
  StatusBadge,
  Surface,
} from '@/components/StudentUI';
import { useStudents } from '@/context/StudentsContext';
import { useColors } from '@/hooks/useColors';
import {
  formatArabicNumber,
  getAttendanceSummary,
  getMonthTitle,
} from '@/lib/student-utils';

export default function AttendanceScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { students, isReady } = useStudents();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const summaries = useMemo(
    () =>
      students.map((student) => ({
        student,
        summary: getAttendanceSummary(student.attendance, month),
      })),
    [month, students],
  );
  const totals = summaries.reduce(
    (total, entry) => ({
      present: total.present + entry.summary.present,
      absent: total.absent + entry.summary.absent,
    }),
    { present: 0, absent: 0 },
  );

  const moveMonth = (delta: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Platform.OS === 'web' ? 67 : insets.top + 14,
          paddingBottom: Platform.OS === 'web' ? 112 : 108,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeading
        eyebrow="حضور وغياب"
        title="التقويم الشهري"
        subtitle="اختر طالبًا لفتح تقويم الأيام وتسجيل حالته."
      />

      <Surface style={styles.monthCard}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="الشهر التالي"
          onPress={() => moveMonth(1)}
          testID="attendance-next-month"
          style={({ pressed }) => [styles.monthArrow, pressed && styles.pressed]}
        >
          <Feather name="chevron-right" size={20} color={colors.primary} />
        </Pressable>
        <View style={styles.monthInfo}>
          <Text style={[styles.monthLabel, { color: colors.mutedForeground }]}>الشهر المحدد</Text>
          <Text style={[styles.monthTitle, { color: colors.foreground }]}>
            {getMonthTitle(month)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="الشهر السابق"
          onPress={() => moveMonth(-1)}
          testID="attendance-previous-month"
          style={({ pressed }) => [styles.monthArrow, pressed && styles.pressed]}
        >
          <Feather name="chevron-left" size={20} color={colors.primary} />
        </Pressable>
      </Surface>

      <View style={styles.summaryRow}>
        <Surface style={styles.summaryCard}>
          <StatusBadge label="حضور" tone="good" />
          <Text style={[styles.summaryNumber, { color: colors.foreground }]}>
            {formatArabicNumber(totals.present)}
          </Text>
          <Text style={[styles.summaryCaption, { color: colors.mutedForeground }]}>
            تسجيل حضور
          </Text>
        </Surface>
        <Surface style={styles.summaryCard}>
          <StatusBadge label="غياب" tone="bad" />
          <Text style={[styles.summaryNumber, { color: colors.foreground }]}>
            {formatArabicNumber(totals.absent)}
          </Text>
          <Text style={[styles.summaryCaption, { color: colors.mutedForeground }]}>
            تسجيل غياب
          </Text>
        </Surface>
      </View>

      <View style={styles.listHeading}>
        <Text style={[styles.listTitle, { color: colors.foreground }]}>قائمة الطلاب</Text>
        <Text style={[styles.listCount, { color: colors.mutedForeground }]}>
          {formatArabicNumber(students.length)}
        </Text>
      </View>

      {isReady && summaries.length ? (
        <View style={styles.studentList}>
          {summaries.map(({ student, summary }) => (
            <Pressable
              key={student.id}
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: '/student/[id]', params: { id: student.id } })
              }
              testID={`attendance-student-${student.id}`}
              style={({ pressed }) => [
                styles.studentCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {student.name.trim().slice(0, 1)}
                </Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, { color: colors.foreground }]}>
                  {student.name}
                </Text>
                <Text style={[styles.studentMeta, { color: colors.mutedForeground }]}>
                  {formatArabicNumber(summary.present)} حضور · {formatArabicNumber(summary.absent)} غياب
                </Text>
              </View>
              <Feather name="chevron-left" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      ) : isReady ? (
        <Surface style={styles.emptyCard}>
          <EmptyState
            title="لا يوجد طلاب مسجلون"
            message="أضف الطلاب أولًا، ثم سجّل حضورهم وغيابهم في تقويم الشهر."
            icon="calendar"
          />
        </Surface>
      ) : (
        <Text style={[styles.loading, { color: colors.mutedForeground }]}>
          جارٍ تحميل الحضور...
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 16, paddingHorizontal: 20 },
  monthCard: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  monthArrow: {
    alignItems: 'center',
    borderRadius: 11,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  monthInfo: { alignItems: 'center', gap: 4 },
  monthLabel: { fontSize: 11 },
  monthTitle: { fontSize: 16, fontWeight: '800' },
  summaryRow: { flexDirection: 'row-reverse', gap: 10 },
  summaryCard: { alignItems: 'flex-start', flex: 1, gap: 7, padding: 15 },
  summaryNumber: { fontSize: 25, fontWeight: '800' },
  summaryCaption: { fontSize: 11 },
  listHeading: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 2,
  },
  listTitle: { fontSize: 17, fontWeight: '700' },
  listCount: { fontSize: 12 },
  studentList: { gap: 9 },
  studentCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 11,
    minHeight: 70,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarText: { fontSize: 17, fontWeight: '800' },
  studentInfo: { flex: 1, gap: 5 },
  studentName: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  studentMeta: { fontSize: 11, textAlign: 'right' },
  emptyCard: { paddingHorizontal: 5 },
  loading: { paddingVertical: 28, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
