import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
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

export default function StudentFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const studentId = typeof id === 'string' ? id : undefined;
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { students, isReady, addStudent, updateStudent } = useStudents();
  const existing = studentId ? students.find((student) => student.id === studentId) : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [surahName, setSurahName] = useState(existing?.surahName ?? '');
  const [hasMemorizedSurah, setHasMemorizedSurah] = useState(
    existing?.hasMemorizedSurah ?? false,
  );
  const [reviewName, setReviewName] = useState(existing?.reviewName ?? '');
  const [hasCompletedReview, setHasCompletedReview] = useState(
    existing?.hasCompletedReview ?? false,
  );
  const [nameError, setNameError] = useState('');

  const saveStudent = () => {
    const cleanedName = name.trim();
    if (!cleanedName) {
      setNameError('اكتب اسم الطالب للمتابعة.');
      return;
    }
    setNameError('');
    const draft = {
      name: cleanedName,
      surahName: surahName.trim(),
      hasMemorizedSurah,
      reviewName: reviewName.trim(),
      hasCompletedReview,
    };

    if (studentId) {
      if (!existing) {
        Alert.alert('تعذر حفظ التعديل', 'لم يتم العثور على سجل الطالب.');
        return;
      }
      updateStudent(studentId, draft);
      router.replace({ pathname: '/student/[id]', params: { id: studentId } });
      return;
    }

    const newId = addStudent(draft);
    router.replace({ pathname: '/student/[id]', params: { id: newId } });
  };

  if (!isReady) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (studentId && !existing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.missingText, { color: colors.foreground }]}>
          لم يتم العثور على الطالب.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/students')}
          style={[styles.backButton, { backgroundColor: colors.secondary }]}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>العودة إلى الطلاب</Text>
        </Pressable>
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
      bottomOffset={72}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="إغلاق"
        onPress={() => router.back()}
        testID="student-form-back"
        style={({ pressed }) => [
          styles.closeButton,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <Feather name="x" size={20} color={colors.foreground} />
      </Pressable>

      <ScreenHeading
        eyebrow={studentId ? 'تحديث البيانات' : 'تسجيل جديد'}
        title={studentId ? 'تعديل بيانات الطالب' : 'إضافة طالب'}
        subtitle="أدخل السورة والمراجعة الحالية وحالة كل منهما."
      />

      <Surface style={styles.formCard}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>اسم الطالب</Text>
          <TextInput
            accessibilityLabel="اسم الطالب"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={(value) => {
              setName(value);
              if (value.trim()) setNameError('');
            }}
            placeholder="مثال: محمد أحمد"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="next"
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: nameError ? colors.destructive : colors.input,
                borderRadius: colors.radius,
                color: colors.foreground,
              },
            ]}
            testID="student-name-input"
            value={name}
          />
          {nameError ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{nameError}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>السورة الحالية</Text>
          <TextInput
            accessibilityLabel="السورة الحالية"
            onChangeText={setSurahName}
            placeholder="مثال: سورة الملك"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="next"
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.input,
                borderRadius: colors.radius,
                color: colors.foreground,
              },
            ]}
            testID="student-surah-input"
            value={surahName}
          />
        </View>

        <View style={[styles.choiceRow, { borderColor: colors.border }]}>
          <View style={styles.choiceText}>
            <Text style={[styles.label, { color: colors.foreground }]}>هل حفظ السورة؟</Text>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              سجّل إن أتم الطالب حفظها
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: hasMemorizedSurah }}
            accessibilityLabel="حالة حفظ السورة"
            onPress={() => setHasMemorizedSurah((current) => !current)}
            testID="student-surah-memorized"
            style={({ pressed }) => [
              styles.toggle,
              {
                backgroundColor: hasMemorizedSurah ? colors.primary : colors.muted,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color: hasMemorizedSurah ? colors.primaryForeground : colors.mutedForeground,
                },
              ]}
            >
              {hasMemorizedSurah ? 'نعم' : 'لا'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>المراجعة الحالية</Text>
          <TextInput
            accessibilityLabel="المراجعة الحالية"
            onChangeText={setReviewName}
            placeholder="مثال: مراجعة سورة يس"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="done"
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.input,
                borderRadius: colors.radius,
                color: colors.foreground,
              },
            ]}
            testID="student-review-input"
            value={reviewName}
          />
        </View>

        <View style={[styles.choiceRow, { borderColor: colors.border }]}>
          <View style={styles.choiceText}>
            <Text style={[styles.label, { color: colors.foreground }]}>هل أتم المراجعة؟</Text>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              حدّثها بعد إتمام المراجعة
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: hasCompletedReview }}
            accessibilityLabel="حالة إتمام المراجعة"
            onPress={() => setHasCompletedReview((current) => !current)}
            testID="student-review-completed"
            style={({ pressed }) => [
              styles.toggle,
              {
                backgroundColor: hasCompletedReview ? colors.primary : colors.muted,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color: hasCompletedReview ? colors.primaryForeground : colors.mutedForeground,
                },
              ]}
            >
              {hasCompletedReview ? 'نعم' : 'لا'}
            </Text>
          </Pressable>
        </View>
      </Surface>

      <PrimaryButton
        label={studentId ? 'حفظ التعديلات' : 'حفظ الطالب'}
        icon="check"
        onPress={saveStudent}
        testID="student-form-save"
      />
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 17, paddingHorizontal: 20 },
  centered: { alignItems: 'center', flex: 1, gap: 14, justifyContent: 'center', padding: 24 },
  closeButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  formCard: { gap: 17, padding: 16 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', textAlign: 'right' },
  input: {
    borderWidth: 1,
    fontSize: 14,
    minHeight: 50,
    paddingHorizontal: 14,
    textAlign: 'right',
  },
  errorText: { fontSize: 11, textAlign: 'right' },
  choiceRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  choiceText: { flex: 1, gap: 4 },
  hint: { fontSize: 11, textAlign: 'right' },
  toggle: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 56,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  toggleText: { fontSize: 12, fontWeight: '700' },
  backButton: { borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  backButtonText: { fontSize: 13, fontWeight: '700' },
  missingText: { fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
