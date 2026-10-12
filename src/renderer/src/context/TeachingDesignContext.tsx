import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  parseTeachingDesigns,
  removeBigUnitCascade,
  removeUnitKeepLessons,
  type TeachingDesign
} from '@shared/teachingDesign'
import { getAppApi } from '../platform/appApi'

interface TeachingDesignContextValue {
  designs: TeachingDesign[]
  loading: boolean
  error: string | null
  saveDesigns: (items: TeachingDesign[]) => Promise<void>
  upsertDesigns: (items: TeachingDesign[]) => Promise<void>
  deleteDesign: (id: string) => Promise<void>
}

const TeachingDesignContext = createContext<TeachingDesignContextValue | null>(null)

export function TeachingDesignProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [designs, setDesigns] = useState<TeachingDesign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        const loaded = await (await getAppApi()).teachingDesigns.get()
        if (!cancelled) {
          setDesigns(loaded)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '教学设计读取失败')
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

  // 批量生成会在同一闭包内连续保存，必须基于最新已保存数据计算，不能用渲染时的 designs。
  const latestRef = useRef<TeachingDesign[]>([])
  latestRef.current = designs
  const readyRef = useRef(false)
  readyRef.current = !loading && !error
  const queueRef = useRef<Promise<unknown>>(Promise.resolve())

  const commit = useCallback((compute: (current: TeachingDesign[]) => TeachingDesign[] | null) => {
    const task = queueRef.current.then(async () => {
      if (!readyRef.current) throw new Error('数据尚未就绪，请重新加载后保存')
      const current = latestRef.current
      const next = compute(current)
      if (!next) return
      const saved = await (await getAppApi()).teachingDesigns.save(parseTeachingDesigns(next), current)
      latestRef.current = saved
      setDesigns(saved)
      setError(null)
    })
    queueRef.current = task.catch(() => undefined)
    return task
  }, [])

  const saveDesigns = useCallback((nextItems: TeachingDesign[]) => commit(() => nextItems), [commit])

  const upsertDesigns = useCallback(
    (items: TeachingDesign[]) =>
      commit((current) => {
        const ids = new Set(items.map((item) => item.id))
        return [...current.filter((entry) => !ids.has(entry.id)), ...items]
      }),
    [commit]
  )

  const deleteDesign = useCallback(
    (id: string) =>
      commit((current) => {
        const target = current.find((entry) => entry.id === id)
        if (!target) return null
        if (target.kind === 'bigUnit') return removeBigUnitCascade(current, id)
        if (target.kind === 'unit') return removeUnitKeepLessons(current, id, new Date().toISOString())
        return current.filter((entry) => entry.id !== id)
      }),
    [commit]
  )

  const value = useMemo(
    () => ({ designs, loading, error, saveDesigns, upsertDesigns, deleteDesign }),
    [designs, loading, error, saveDesigns, upsertDesigns, deleteDesign]
  )

  return <TeachingDesignContext.Provider value={value}>{children}</TeachingDesignContext.Provider>
}

export function useTeachingDesigns(): TeachingDesignContextValue {
  const context = useContext(TeachingDesignContext)
  if (!context) {
    throw new Error('useTeachingDesigns 必须在 TeachingDesignProvider 内使用')
  }
  return context
}
