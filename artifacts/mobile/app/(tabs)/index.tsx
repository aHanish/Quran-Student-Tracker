import React from 'react';
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
  PrimaryButton,
  ScreenHeading,
  SectionTitle,
  StatusBadge,
  Surface,
} from '@/components/StudentUI';
import { useColors } from '@/hooks/useColors';
import { formatArabicNumber, getAttendanceSummary } from '@/lib/student-utils';
import { useStudents } from '@/context/StudentsContext';

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { students, isReady, storageError } = useStudents();
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const attendedToday = students.filter(
    (student) => student.attendance[todayKey] === 'present',
  ).length;
  const monthlyTotals = students.reduce(
    (total, student) => {
      const summary = getAttendanceSummary(student.attendance, now);
      return {
        present: total.present + summary.present,
        absent: total.absent + summary.absent,
      };
    },
    { present: 0, absent: 0 },
  );
  const recentlyAdded = students.slice(0, 3);

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
      <View style={styles.topLine}>
        <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
          <Feather name="book-open" size={17} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.brandName, { color: colors.primary }]}>حلقتي</Text>
        <View style={styles.spacer} />
        <View style={[styles.dayChip, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.dayChipText, { color: colors.secondaryForeground }]}>
            {now.toLocaleDateString('ar-LY', { weekday: 'long', day: 'numeric' })}
          </Text>
        </View>
      </View>

      <ScreenHeading
        eyebrow="متابعة الحفظ والمراجعة"
        title="السلام عليكم"
        subtitle="كل تفاصيل الحلقة في مكان واحد، بخطوات بسيطة."
      />

      {storageError ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.muted }]}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {storageError}
          </Text>
        </View>
      ) : null}

      <Surface style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="users" size={19} color={colors.primary} />
          </View>
          <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>
            عدد الطلاب
          </Text>
        </View>
        <Text style={[styles.heroCount, { color: colors.foreground }]}>
          {isReady ? formatArabicNumber(students.length) : '…'}
        </Text>
        <Text style={[styles.heroHint, { color: colors.mutedForeground }]}>
          طالب مسجل في الحلقة
        </Text>
        <PrimaryButton
          label="إضافة طالب جديد"
          icon="plus"
          onPress={() => router.push('/student/form')}
          testID="home-add-student"
        />
      </Surface>

      <SectionTitle title="ملخص هذا الشهر" />
      <View style={styles.statsRow}>
        <Surface style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="check" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: colors.foreground }]}>
            {formatArabicNumber(monthlyTotals.present)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            مرات الحضور
          </Text>
        </Surface>
        <Surface style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.muted }]}>
            <Feather name="minus" size={16} color={colors.destructive} />
          </View>
          <Text style={[styles.statNumber, { color: colors.foreground }]}>
            {formatArabicNumber(monthlyTotals.absent)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            مرات الغياب
          </Text>
        </Surface>
        <Surface style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.accent }]}>
            <Feather name="sun" size={16} color={colors.accentForeground} />
          </View>
          <Text style={[styles.statNumber, { color: colors.foreground }]}>
            {formatArabicNumber(attendedToday)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            حضروا اليوم
          </Text>
        </Surface>
      </View>

      <SectionTitle
        title="الطلاب"
        actionLabel="عرض الكل"
        onAction={() => router.push('/students')}
      />
      {isReady && recentlyAdded.length ? (
        <View style={styles.studentList}>
          {recentlyAdded.map((student) => (
            <Pressable
              key={student.id}
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: '/student/[id]', params: { id: student.id } })
              }
              testID={`home-student-${student.id}`}
              style={({ pressed }) => [
                styles.studentRow,
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
                <Text style={[styles.studentSubtitle, { color: colors.mutedForeground }]}>
                  {student.surahName ? `السورة: ${student.surahName}` : 'لم تُحدد السورة بعد'}
                </Text>
              </View>
              <StatusBadge
                label={student.hasMemorizedSurah ? 'حفظ' : 'قيد الحفظ'}
                tone={student.hasMemorizedSurah ? 'good' : 'warm'}
              />
            </Pressable>
          ))}
        </View>
      ) : isReady ? (
        <Surface style={styles.emptySurface}>
          <EmptyState
            title="ابدأ بإضافة أول طالب"
            message="بعد التسجيل ستظهر هنا متابعة الطلاب والحفظ."
            action={
              <PrimaryButton
                label="تسجيل طالب"
                icon="plus"
                onPress={() => router.push('/student/form')}
                testID="home-empty-add-student"
              />
            }
          />
        </Surface>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/attendance')}
        style={({ pressed }) => [
          styles.attendanceLink,
          { backgroundColor: colors.secondary },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.attendanceTextWrap}>
          <Text style={[styles.attendanceTitle, { color: colors.secondaryForeground }]}>
            سجل الحضور الشهري
          </Text>
          <Text style={[styles.attendanceSubtitle, { color: colors.mutedForeground }]}>
            افتح تقويم كل طالب وعدّل حالة الأيام
          </Text>
        </View>
        <Feather name="calendar" size={21} color={colors.primary} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 16, paddingHorizontal: 20 },
  topLine: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 4,
  },
  brandMark: {
    alignItems: 'center',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  brandName: { fontSize: 17, fontWeight: '800' },
  spacer: { flex: 1 },
  dayChip: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  dayChipText: { fontSize: 11, fontWeight: '600' },
  hero: { gap: 10, padding: 18 },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 9,
  },
  heroIcon: {
    alignItems: 'center',
    borderRadius: 11,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  heroLabel: { fontSize: 13, fontWeight: '600' },
  heroCount: { fontSize: 42, fontWeight: '800', lineHeight: 50, textAlign: 'right' },
  heroHint: { fontSize: 13, marginTop: -7, textAlign: 'right' },
  statsRow: { flexDirection: 'row-reverse', gap: 8 },
  statCard: { alignItems: 'center', flex: 1, gap: 6, paddingHorizontal: 8, paddingVertical: 13 },
  statIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 29,
    justifyContent: 'center',
    width: 29,
  },
  statNumber: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, textAlign: 'center' },
  studentList: { gap: 9 },
  studentRow: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 10,
    minHeight: 74,
    padding: 12,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarText: { fontSize: 18, fontWeight: '800' },
  studentInfo: { flex: 1, gap: 4 },
  studentName: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  studentSubtitle: { fontSize: 11, textAlign: 'right' },
  emptySurface: { paddingHorizontal: 4 },
  attendanceLink: {
    alignItems: 'center',
    borderRadius: 17,
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 2,
    padding: 16,
  },
  attendanceTextWrap: { flex: 1, gap: 4 },
  attendanceTitle: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  attendanceSubtitle: { fontSize: 11, textAlign: 'right' },
  errorBanner: { borderRadius: 12, padding: 12 },
  errorText: { fontSize: 12, lineHeight: 19, textAlign: 'right' },
  pressed: { opacity: 0.75 },
});
