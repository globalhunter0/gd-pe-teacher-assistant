import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  applyStudentSafeDelete,
  parseStudentRecords,
  type StudentRecord
} from '@shared/student'
import { getAppApi } from '../platform/appApi'
import { useTraining } from './TrainingContext'

interface StudentContextValue {
  students: StudentRecord[]
  loading: boolean
  error: string | null
  saveStudents: (items: StudentRecord[]) => Promise<void>
  upsertStudent: (item: StudentRecord) => Promise<void>
  deleteStudent: (id: string) => Promise<void>
  applyImportedStudents: (items: StudentRecord[]) => void
}

const StudentContext = createContext<StudentContextValue | null>(null)

export function StudentProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const training = useTraining()
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        const loaded = await (await getAppApi()).students.get()
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
    if (loading || error) throw new Error('数据尚未就绪，请重新加载后保存')
    const saved = await (await getAppApi()).students.save(parseStudentRecords(nextItems), students)
    setStudents(saved)
    setError(null)
  }, [students, loading, error])

  const upsertStudent = useCallback(
    async (item: StudentRecord) => {
      const without = students.filter((entry) => entry.id !== item.id)
      await saveStudents([...without, item])
    },
    [students, saveStudents]
  )

  const deleteStudent = useCallback(
    async (id: string) => {
      const api = await getAppApi()
      const sessions = await api.peSessions.get()
      const tests = await api.peTests.get()
      const now = new Date().toISOString()
      const next = applyStudentSafeDelete(students, id, now, {
        sessions,
        testSessions: tests,
        members: training.members,
        trainingSessions: training.sessions,
        results: training.results
      })
      if (next.members.some((item, index) => item !== training.members[index])) {
        await training.saveMembers(next.members)
      }
      await saveStudents(next.students)
    },
    [students, saveStudents, training]
  )

  const applyImportedStudents = useCallback((items: StudentRecord[]) => {
    setStudents(items)
    setError(null)
  }, [])

  const value = useMemo(
    () => ({
      students,
      loading,
      error,
      saveStudents,
      upsertStudent,
      deleteStudent,
      applyImportedStudents
    }),
    [students, loading, error, saveStudents, upsertStudent, deleteStudent, applyImportedStudents]
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
