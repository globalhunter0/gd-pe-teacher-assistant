import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  applyClassSafeDelete,
  parseClassRecords,
  type ClassRecord
} from '@shared/class'
import { getAppApi } from '../platform/appApi'

interface ClassContextValue {
  classes: ClassRecord[]
  loading: boolean
  error: string | null
  saveClasses: (items: ClassRecord[]) => Promise<void>
  upsertClass: (item: ClassRecord) => Promise<void>
  deleteClass: (id: string) => Promise<void>
  applyLoadedClasses: (items: ClassRecord[]) => void
}

const ClassContext = createContext<ClassContextValue | null>(null)

export function ClassProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        const loaded = await (await getAppApi()).classes.get()
        if (!cancelled) {
          setClasses(loaded)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '班级读取失败')
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

  const saveClasses = useCallback(async (nextItems: ClassRecord[]) => {
    if (loading || error) throw new Error('数据尚未就绪，请重新加载后保存')
    const saved = await (await getAppApi()).classes.save(parseClassRecords(nextItems), classes)
    setClasses(saved)
    setError(null)
  }, [classes, loading, error])

  const upsertClass = useCallback(
    async (item: ClassRecord) => {
      const without = classes.filter((entry) => entry.id !== item.id)
      await saveClasses([...without, item])
    },
    [classes, saveClasses]
  )

  const deleteClass = useCallback(
    async (id: string) => {
      const api = await getAppApi()
      const [students, sessions, tests, schedule] = await Promise.all([
        api.students.get(),
        api.peSessions.get(),
        api.peTests.get(),
        api.schedule.get()
      ])
      const now = new Date().toISOString()
      await saveClasses(
        applyClassSafeDelete(classes, id, now, {
          students,
          sessions,
          testSessions: tests,
          scheduleItems: schedule
        })
      )
    },
    [classes, saveClasses]
  )

  const applyLoadedClasses = useCallback((items: ClassRecord[]) => {
    setClasses(items)
    setError(null)
  }, [])

  const value = useMemo(
    () => ({
      classes,
      loading,
      error,
      saveClasses,
      upsertClass,
      deleteClass,
      applyLoadedClasses
    }),
    [classes, loading, error, saveClasses, upsertClass, deleteClass, applyLoadedClasses]
  )

  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>
}

export function useClasses(): ClassContextValue {
  const context = useContext(ClassContext)
  if (!context) {
    throw new Error('useClasses 必须在 ClassProvider 内使用')
  }
  return context
}
