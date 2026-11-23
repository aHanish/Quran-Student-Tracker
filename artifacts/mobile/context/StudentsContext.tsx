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
  AttendanceStatus,
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
  cycleAttendance: (id: string, dayKey: string) => void;
}

const StudentsContext = createContext<StudentsContextValue | undefined>(
  undefined,
);

function isStudentList(value: unknown): value is Student[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.surahName === 'string' &&
        typeof item.hasMemorizedSurah === 'boolean' &&
        typeof item.reviewName === 'string' &&
        typeof item.hasCompletedReview === 'boolean' &&
        typeof item.createdAt === 'string' &&
        item.attendance &&
        typeof item.attendance === 'object',
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
        setStudents(parsed);
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

  const cycleAttendance = useCallback((id: string, dayKey: string) => {
    setStudents((current) =>
      current.map((student) => {
        if (student.id !== id) return student;
        const attendance = { ...student.attendance };
        const currentStatus: AttendanceStatus | undefined = attendance[dayKey];
        if (!currentStatus) {
          attendance[dayKey] = 'present';
        } else if (currentStatus === 'present') {
          attendance[dayKey] = 'absent';
        } else {
          delete attendance[dayKey];
        }
        return { ...student, attendance };
      }),
    );
  }, []);

  const value = useMemo(
    () => ({
      students,
      isReady,
      storageError,
      addStudent,
      updateStudent,
      removeStudent,
      cycleAttendance,
    }),
    [
      students,
      isReady,
      storageError,
      addStudent,
      updateStudent,
      removeStudent,
      cycleAttendance,
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
