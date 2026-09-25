import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createScheduleService } from '../data/schedule/scheduleService'
import { WEEKLY_SCHEDULE, parseScheduleItems, type ScheduleItem } from '../data/schedule'
import { assertScheduleLinksRoundTrip } from '@shared/schedule/validate'

interface ScheduleContextValue {
  items: ScheduleItem[]
  loading: boolean
  error: string | null
  saveItems: (items: ScheduleItem[]) => Promise<void>
  restoreDefault: () => Promise<void>
  applyLoadedItems: (items: ScheduleItem[]) => void
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null)

export function ScheduleProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [items, setItems] = useState<ScheduleItem[]>(WEEKLY_SCHEDULE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        const loaded = await window.electronAPI.schedule.get()
        if (!cancelled) {
          setItems(loaded)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '课表读取失败')
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

  const saveItems = useCallback(async (nextItems: ScheduleItem[]) => {
    parseScheduleItems(nextItems)
    if (loading || error) throw new Error('数据尚未就绪，请重新加载后保存')
    const saved = await window.electronAPI.schedule.save(nextItems, items)
    assertScheduleLinksRoundTrip(nextItems, saved)
    setItems(saved)
    setError(null)
  }, [items, loading, error])

  const restoreDefault = useCallback(async () => {
    await saveItems(WEEKLY_SCHEDULE.map((item) => ({ ...item })))
  }, [saveItems])

  const applyLoadedItems = useCallback((nextItems: ScheduleItem[]) => {
    setItems(nextItems)
    setError(null)
  }, [])

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      saveItems,
      restoreDefault,
      applyLoadedItems
    }),
    [items, loading, error, saveItems, restoreDefault, applyLoadedItems]
  )

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>
}

export function useSchedule(): ScheduleContextValue {
  const context = useContext(ScheduleContext)
  if (!context) {
    throw new Error('useSchedule 必须在 ScheduleProvider 内使用')
  }
  return context
}

export function useScheduleService() {
  const { items } = useSchedule()
  return createScheduleService(items)
}
