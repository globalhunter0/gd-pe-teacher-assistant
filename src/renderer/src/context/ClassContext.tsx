import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  getClassDeleteBlockers,
  parseClassRecords,
  type ClassRecord
} from '@shared/class'

interface ClassContextValue {
  classes: ClassRecord[]
  loading: boolean
  error: string | null
  saveClasses: (items: ClassRecord[]) => Promise<void>
  upsertClass: (item: ClassRecord) => Promise<void>
  deleteClass: (id: string) => Promise<void>
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
        const loaded = await window.electronAPI.classes.get()
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
    const saved = await window.electronAPI.classes.save(parseClassRecords(nextItems))
    setClasses(saved)
    setError(null)
  }, [])

  const upsertClass = useCallback(
    async (item: ClassRecord) => {
      const without = classes.filter((entry) => entry.id !== item.id)
      await saveClasses([...without, item])
    },
    [classes, saveClasses]
  )

  const deleteClass = useCallback(
    async (id: string) => {
      const students = await window.electronAPI.students.get()
      const blockers = getClassDeleteBlockers(id, students)
      if (blockers.length > 0) {
        throw new Error(blockers.join('；'))
      }

      await saveClasses(classes.filter((entry) => entry.id !== id))
    },
    [classes, saveClasses]
  )

  const value = useMemo(
    () => ({
      classes,
      loading,
      error,
      saveClasses,
      upsertClass,
      deleteClass
    }),
    [classes, loading, error, saveClasses, upsertClass, deleteClass]
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
