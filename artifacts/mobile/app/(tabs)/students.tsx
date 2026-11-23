import React, { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

export default function StudentsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { students, isReady } = useStudents();
  const [search, setSearch] = useState('');
  const visibleStudents = useMemo(
    () =>
      students.filter((student) =>
        `${student.name} ${student.surahName} ${student.reviewName}`
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()),
      ),
    [search, students],
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
    >
      <ScrollView
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
        <View style={styles.headingRow}>
          <View style={styles.titleWrap}>
            <ScreenHeading
              eyebrow="إدارة الحلقة"
              title="الطلاب"
              subtitle={`${students.length} طالب مسجل`}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="إضافة طالب"
            onPress={() => router.push('/student/form')}
            testID="students-add"
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
          >
            <Feather name="plus" size={20} color={colors.primaryForeground} />
          </Pressable>
        </View>

        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            accessibilityLabel="ابحث عن طالب"
            autoCorrect={false}
            onChangeText={setSearch}
            placeholder="ابحث بالاسم أو السورة..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            testID="student-search"
            value={search}
          />
          {search.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="مسح البحث"
              onPress={() => setSearch('')}
              testID="student-search-clear"
            >
              <Feather name="x-circle" size={17} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        {isReady && visibleStudents.length ? (
          <View style={styles.list}>
            {visibleStudents.map((student) => (
              <Pressable
                key={student.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/student/[id]', params: { id: student.id } })
                }
                testID={`student-card-${student.id}`}
                style={({ pressed }) => [
                  styles.studentCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                    {student.name.trim().slice(0, 1)}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: colors.foreground }]}>
                    {student.name}
                  </Text>
                  <Text style={[styles.studentDetail, { color: colors.mutedForeground }]}>
                    {student.surahName ? `السورة: ${student.surahName}` : 'السورة غير محددة'}
                  </Text>
                  <Text style={[styles.studentDetail, { color: colors.mutedForeground }]}>
                    {student.reviewName ? `المراجعة: ${student.reviewName}` : 'المراجعة غير محددة'}
                  </Text>
                </View>
                <View style={styles.badges}>
                  <StatusBadge
                    label={student.hasMemorizedSurah ? 'حفظ' : 'لم يحفظ'}
                    tone={student.hasMemorizedSurah ? 'good' : 'muted'}
                  />
                  <Feather name="chevron-left" size={17} color={colors.mutedForeground} />
                </View>
              </Pressable>
            ))}
          </View>
        ) : isReady ? (
          <Surface style={styles.emptyCard}>
            <EmptyState
              title={search ? 'لا توجد نتائج' : 'لا يوجد طلاب بعد'}
              message={
                search
                  ? 'جرّب اسمًا آخر أو امسح البحث.'
                  : 'سجّل أسماء الطلاب لتبدأ متابعة الحفظ والمراجعة.'
              }
              icon={search ? 'search' : 'users'}
              action={
                search ? undefined : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/student/form')}
                    testID="students-empty-add"
                    style={({ pressed }) => [
                      styles.emptyAction,
                      { backgroundColor: colors.primary },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.emptyActionText, { color: colors.primaryForeground }]}>
                      تسجيل أول طالب
                    </Text>
                  </Pressable>
                )
              }
            />
          </Surface>
        ) : (
          <Text style={[styles.loading, { color: colors.mutedForeground }]}>
            جارٍ تحميل الطلاب...
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 15, paddingHorizontal: 20 },
  headingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    gap: 12,
  },
  titleWrap: { flex: 1 },
  addButton: {
    alignItems: 'center',
    borderRadius: 15,
    height: 46,
    justifyContent: 'center',
    marginTop: 4,
    width: 46,
  },
  searchBox: {
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    minHeight: 48,
    textAlign: 'right',
  },
  list: { gap: 10 },
  studentCard: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 11,
    minHeight: 92,
    padding: 13,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 15,
    height: 45,
    justifyContent: 'center',
    width: 45,
  },
  avatarLetter: { fontSize: 18, fontWeight: '800' },
  studentInfo: { flex: 1, gap: 4 },
  studentName: { fontSize: 15, fontWeight: '700', textAlign: 'right' },
  studentDetail: { fontSize: 11, textAlign: 'right' },
  badges: { alignItems: 'center', gap: 8 },
  emptyCard: { paddingHorizontal: 5 },
  emptyAction: { borderRadius: 12, paddingHorizontal: 17, paddingVertical: 11 },
  emptyActionText: { fontSize: 13, fontWeight: '700' },
  loading: { paddingVertical: 32, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
