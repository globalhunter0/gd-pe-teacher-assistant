import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getStudentDeleteBlockers, parseStudentRecords, type StudentRecord } from '@shared/student'

interface StudentContextValue {
  students: StudentRecord[]
  loading: boolean
  error: string | null
  saveStudents: (items: StudentRecord[]) => Promise<void>
  upsertStudent: (item: StudentRecord) => Promise<void>
  deleteStudent: (id: string) => Promise<void>
}

const StudentContext = createContext<StudentContextValue | null>(null)

export function StudentProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        const loaded = await window.electronAPI.students.get()
        if (!cancelled) {
          setStudents(loaded)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '学生读取失败')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const saveStudents = useCallback(async (nextItems: StudentRecord[]) => {
    const saved = await window.electronAPI.students.save(parseStudentRecords(nextItems))
    setStudents(saved)
    setError(null)
  }, [])

  const upsertStudent = useCallback(
    async (item: StudentRecord) => {
      const without = students.filter((entry) => entry.id !== item.id)
      await saveStudents([...without, item])
    },
    [students, saveStudents]
  )

  const deleteStudent = useCallback(
    async (id: string) => {
      const blockers = getStudentDeleteBlockers(id)
      if (blockers.length > 0) {
        throw new Error(blockers.join('；'))
      }

      await saveStudents(students.filter((entry) => entry.id !== id))
    },
    [students, saveStudents]
  )

  const value = useMemo(
    () => ({
      students,
      loading,
      error,
      saveStudents,
      upsertStudent,
      deleteStudent
    }),
    [students, loading, error, saveStudents, upsertStudent, deleteStudent]
  )

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
}

export function useStudents(): StudentContextValue {
  const context = useContext(StudentContext)
  if (!context) {
    throw new Error('useStudents 必须在 StudentProvider 内使用')
  }
  return context
}
