import React, { useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { PrimaryButton, ScreenHeading, Surface } from '@/components/StudentUI';
import { useStudents } from '@/context/StudentsContext';
import { useColors } from '@/hooks/useColors';
import {
  AttendanceStatus,
  DailyRecord,
  getDailyRecord,
} from '@/lib/student-utils';

function Choice({
  label,
  active,
  tone = 'normal',
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  tone?: 'normal' | 'good' | 'bad';
  onPress: () => void;
  testID: string;
}) {
  const colors = useColors();
  const background =
    active && tone === 'good'
      ? colors.secondary
      : active && tone === 'bad'
        ? colors.muted
        : active
          ? colors.primary
          : colors.background;
  const foreground =
    active && tone === 'good'
      ? colors.primary
      : active && tone === 'bad'
        ? colors.destructive
        : active
          ? colors.primaryForeground
          : colors.mutedForeground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.choiceButton,
        { backgroundColor: background, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.choiceLabel, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}

export default function DailyRecordScreen() {
  const { id, dayKey } = useLocalSearchParams<{ id?: string; dayKey?: string }>();
  const studentId = typeof id === 'string' ? id : '';
  const selectedDay = typeof dayKey === 'string' ? dayKey : '';
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { students, isReady, updateDailyRecord } = useStudents();
  const student = students.find((item) => item.id === studentId);
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
  const [hasMemorizedSurah, setHasMemorizedSurah] = useState<boolean | null>(null);
  const [hasCompletedReview, setHasCompletedReview] = useState<boolean | null>(null);
  const [surahName, setSurahName] = useState('');
  const [reviewName, setReviewName] = useState('');

  useEffect(() => {
    if (!isReady || !student || !selectedDay) return;
    const saved: DailyRecord = getDailyRecord(student, selectedDay);
    setAttendance(saved.attendance);
    setHasMemorizedSurah(saved.hasMemorizedSurah);
    setHasCompletedReview(saved.hasCompletedReview);
    setSurahName(saved.surahName);
    setReviewName(saved.reviewName);
  }, [isReady, student?.id, selectedDay]);

  const saveRecord = () => {
    if (!student) return;
    updateDailyRecord(student.id, selectedDay, {
      attendance,
      hasMemorizedSurah,
      hasCompletedReview,
      surahName: surahName.trim(),
      reviewName: reviewName.trim(),
    });
    router.back();
  };

  const selectedDate = selectedDay ? new Date(`${selectedDay}T12:00:00`) : null;
  const dateTitle =
    selectedDate && !Number.isNaN(selectedDate.getTime())
      ? selectedDate.toLocaleDateString('ar-LY', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'اليوم المحدد';

  if (!isReady) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!student || !selectedDay) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>
          تعذّر فتح سجل اليوم
        </Text>
        <PrimaryButton label="رجوع" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12,
          paddingBottom: insets.bottom + 28,
        },
      ]}
      bottomOffset={64}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="رجوع"
        onPress={() => router.back()}
        testID="daily-record-back"
        style={({ pressed }) => [
          styles.backButton,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <Feather name="arrow-right" size={18} color={colors.foreground} />
      </Pressable>

      <ScreenHeading
        eyebrow={student.name}
        title="تفاصيل تسجيل اليوم"
        subtitle={dateTitle}
      />

      <Surface style={styles.formCard}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>السورة لهذا اليوم</Text>
          <TextInput
            accessibilityLabel="السورة لهذا اليوم"
            onChangeText={setSurahName}
            placeholder="تُنسخ من خطة الشهر تلقائيًا"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.input,
                color: colors.foreground,
              },
            ]}
            testID="daily-surah-input"
            value={surahName}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>المراجعة لهذا اليوم</Text>
          <TextInput
            accessibilityLabel="المراجعة لهذا اليوم"
            onChangeText={setReviewName}
            placeholder="تُنسخ من خطة الشهر تلقائيًا"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.input,
                color: colors.foreground,
              },
            ]}
            testID="daily-review-input"
            value={reviewName}
          />
        </View>
      </Surface>

      <Surface style={styles.statusCard}>
        <View style={styles.statusGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>هل حضر؟</Text>
          <View style={styles.choices}>
            <Choice
              label="حضر"
              active={attendance === 'present'}
              tone="good"
              onPress={() => setAttendance('present')}
              testID="daily-attended-yes"
            />
            <Choice
              label="غاب"
              active={attendance === 'absent'}
              tone="bad"
              onPress={() => setAttendance('absent')}
              testID="daily-attended-no"
            />
            <Choice
              label="لم يسجل"
              active={attendance === null}
              onPress={() => setAttendance(null)}
              testID="daily-attended-clear"
            />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.statusGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>هل حفظ السورة؟</Text>
          <View style={styles.choices}>
            <Choice
              label="نعم"
              active={hasMemorizedSurah === true}
              tone="good"
              onPress={() => setHasMemorizedSurah(true)}
              testID="daily-memorized-yes"
            />
            <Choice
              label="لا"
              active={hasMemorizedSurah === false}
              tone="bad"
              onPress={() => setHasMemorizedSurah(false)}
              testID="daily-memorized-no"
            />
            <Choice
              label="لم يسجل"
              active={hasMemorizedSurah === null}
              onPress={() => setHasMemorizedSurah(null)}
              testID="daily-memorized-clear"
            />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.statusGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>هل أتم المراجعة؟</Text>
          <View style={styles.choices}>
            <Choice
              label="نعم"
              active={hasCompletedReview === true}
              tone="good"
              onPress={() => setHasCompletedReview(true)}
              testID="daily-review-yes"
            />
            <Choice
              label="لا"
              active={hasCompletedReview === false}
              tone="bad"
              onPress={() => setHasCompletedReview(false)}
              testID="daily-review-no"
            />
            <Choice
              label="لم يسجل"
              active={hasCompletedReview === null}
              onPress={() => setHasCompletedReview(null)}
              testID="daily-review-clear"
            />
          </View>
        </View>
      </Surface>

      <PrimaryButton
        label="حفظ تسجيل اليوم"
        icon="check"
        onPress={saveRecord}
        testID="daily-record-save"
      />
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 15, paddingHorizontal: 20 },
  centered: { alignItems: 'center', flex: 1, gap: 14, justifyContent: 'center', padding: 24 },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: 13,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  formCard: { gap: 15, padding: 15 },
  field: { gap: 7 },
  label: { fontSize: 13, fontWeight: '700', textAlign: 'right' },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 13,
    minHeight: 46,
    paddingHorizontal: 12,
    textAlign: 'right',
  },
  statusCard: { gap: 14, padding: 15 },
  statusGroup: { gap: 10 },
  choices: { flexDirection: 'row-reverse', gap: 7 },
  choiceButton: {
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  choiceLabel: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1 },
  errorTitle: { fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
