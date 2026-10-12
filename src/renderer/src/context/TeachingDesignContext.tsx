import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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

  const saveDesigns = useCallback(async (nextItems: TeachingDesign[]) => {
    if (loading || error) throw new Error('数据尚未就绪，请重新加载后保存')
    const saved = await (await getAppApi()).teachingDesigns.save(parseTeachingDesigns(nextItems), designs)
    setDesigns(saved)
    setError(null)
  }, [designs, loading, error])

  const upsertDesigns = useCallback(
    async (items: TeachingDesign[]) => {
      const ids = new Set(items.map((item) => item.id))
      await saveDesigns([...designs.filter((entry) => !ids.has(entry.id)), ...items])
    },
    [designs, saveDesigns]
  )

  const deleteDesign = useCallback(
    async (id: string) => {
      const target = designs.find((entry) => entry.id === id)
      if (!target) {
        return
      }
      if (target.kind === 'bigUnit') {
        await saveDesigns(removeBigUnitCascade(designs, id))
      } else if (target.kind === 'unit') {
        await saveDesigns(removeUnitKeepLessons(designs, id, new Date().toISOString()))
      } else {
        await saveDesigns(designs.filter((entry) => entry.id !== id))
      }
    },
    [designs, saveDesigns]
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
