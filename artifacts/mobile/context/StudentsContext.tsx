import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DailyRecord,
  StudyPlan,
  Student,
  StudentDraft,
} from '@/lib/student-utils';

const STORAGE_KEY = '@halaqati/students-v1';

interface StudentsContextValue {
  students: Student[];
  isReady: boolean;
  storageError: string | null;
  addStudent: (draft: StudentDraft) => string;
  updateStudent: (id: string, draft: StudentDraft) => void;
  removeStudent: (id: string) => void;
  setMonthlyPlan: (id: string, monthKey: string, plan: StudyPlan) => void;
  updateDailyRecord: (
    id: string,
    dayKey: string,
    updates: Partial<DailyRecord>,
  ) => void;
}

const StudentsContext = createContext<StudentsContextValue | undefined>(
  undefined,
);

type StoredStudent = Omit<Student, 'monthlyPlans' | 'dailyRecords'> & {
  monthlyPlans?: Record<string, StudyPlan>;
  dailyRecords?: Record<string, DailyRecord>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isStudentList(value: unknown): value is StoredStudent[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.surahName === 'string' &&
        typeof item.hasMemorizedSurah === 'boolean' &&
        typeof item.reviewName === 'string' &&
        typeof item.hasCompletedReview === 'boolean' &&
        typeof item.createdAt === 'string' &&
        isRecord(item.attendance) &&
        (item.monthlyPlans === undefined || isRecord(item.monthlyPlans)) &&
        (item.dailyRecords === undefined || isRecord(item.dailyRecords)),
    )
  );
}

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active || !stored) return;
        const parsed: unknown = JSON.parse(stored);
        if (!isStudentList(parsed)) {
          throw new Error('Saved student data has an invalid format.');
        }
        setStudents(
          parsed.map((student) => ({
            ...student,
            monthlyPlans: student.monthlyPlans ?? {},
            dailyRecords: student.dailyRecords ?? {},
          })),
        );
      })
      .catch(() => {
        if (active) {
          setStorageError(
            'تعذّر فتح البيانات المحفوظة. لم يتم استبدالها أو حذفها.',
          );
        }
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || storageError) return;

    const snapshot = JSON.stringify(students);
    writeQueue.current = writeQueue.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(STORAGE_KEY, snapshot))
      .catch(() => {
        setStorageError('تعذّر حفظ التغييرات على هذا الجهاز.');
      });
  }, [isReady, storageError, students]);

  const addStudent = useCallback((draft: StudentDraft) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const student: Student = {
      ...draft,
      id,
      createdAt: new Date().toISOString(),
      attendance: {},
      monthlyPlans: {},
      dailyRecords: {},
    };
    setStudents((current) => [student, ...current]);
    return id;
  }, []);

  const updateStudent = useCallback((id: string, draft: StudentDraft) => {
    setStudents((current) =>
      current.map((student) => (student.id === id ? { ...student, ...draft } : student)),
    );
  }, []);

  const removeStudent = useCallback((id: string) => {
    setStudents((current) => current.filter((student) => student.id !== id));
  }, []);

  const setMonthlyPlan = useCallback(
    (id: string, monthKey: string, plan: StudyPlan) => {
      setStudents((current) =>
        current.map((student) =>
          student.id === id
            ? {
                ...student,
                monthlyPlans: { ...student.monthlyPlans, [monthKey]: plan },
              }
            : student,
        ),
      );
    },
    [],
  );

  const updateDailyRecord = useCallback(
    (id: string, dayKey: string, updates: Partial<DailyRecord>) => {
      setStudents((current) =>
        current.map((student) => {
          if (student.id !== id) return student;

          const monthKey = dayKey.slice(0, 7);
          const plan = student.monthlyPlans[monthKey] ?? {
            surahName: student.surahName,
            hasMemorizedSurah: student.hasMemorizedSurah,
            reviewName: student.reviewName,
            hasCompletedReview: student.hasCompletedReview,
          };
          const previous = student.dailyRecords[dayKey] ?? {
            attendance: student.attendance[dayKey] ?? null,
            surahName: plan.surahName,
            hasMemorizedSurah: null,
            reviewName: plan.reviewName,
            hasCompletedReview: null,
          };
          const nextRecord = { ...previous, ...updates };
          const attendance = { ...student.attendance };
          if (nextRecord.attendance) {
            attendance[dayKey] = nextRecord.attendance;
          } else {
            delete attendance[dayKey];
          }

          return {
            ...student,
            attendance,
            dailyRecords: {
              ...student.dailyRecords,
              [dayKey]: nextRecord,
            },
          };
        }),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      students,
      isReady,
      storageError,
      addStudent,
      updateStudent,
      removeStudent,
      setMonthlyPlan,
      updateDailyRecord,
    }),
    [
      students,
      isReady,
      storageError,
      addStudent,
      updateStudent,
      removeStudent,
      setMonthlyPlan,
      updateDailyRecord,
    ],
  );

  return (
    <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>
  );
}

export function useStudents() {
  const context = useContext(StudentsContext);
  if (!context) {
    throw new Error('useStudents must be used inside StudentsProvider.');
  }
  return context;
}
