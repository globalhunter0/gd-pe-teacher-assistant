import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  copyTeachingPlan,
  parseTeachingPlans,
  type TeachingPlan
} from '@shared/teachingPlan'
import { getAppApi } from '../platform/appApi'

interface TeachingPlanContextValue {
  plans: TeachingPlan[]
  loading: boolean
  error: string | null
  savePlans: (items: TeachingPlan[]) => Promise<void>
  upsertPlan: (item: TeachingPlan) => Promise<void>
  deletePlan: (id: string) => Promise<void>
  duplicatePlan: (id: string) => Promise<TeachingPlan>
}

const TeachingPlanContext = createContext<TeachingPlanContextValue | null>(null)

export function TeachingPlanProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [plans, setPlans] = useState<TeachingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        const loaded = await (await getAppApi()).teachingPlans.get()
        if (!cancelled) {
          setPlans(loaded)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '教学计划读取失败')
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

  const savePlans = useCallback(async (nextItems: TeachingPlan[]) => {
    if (loading || error) throw new Error('数据尚未就绪，请重新加载后保存')
    const saved = await (await getAppApi()).teachingPlans.save(parseTeachingPlans(nextItems), plans)
    setPlans(saved)
    setError(null)
  }, [plans, loading, error])

  const upsertPlan = useCallback(
    async (item: TeachingPlan) => {
      const without = plans.filter((entry) => entry.id !== item.id)
      await savePlans([...without, item])
    },
    [plans, savePlans]
  )

  const deletePlan = useCallback(
    async (id: string) => {
      await savePlans(plans.filter((entry) => entry.id !== id))
    },
    [plans, savePlans]
  )

  const duplicatePlan = useCallback(
    async (id: string) => {
      const source = plans.find((entry) => entry.id === id)
      if (!source) {
        throw new Error('找不到要复制的教学计划')
      }

      const copied = copyTeachingPlan(source)
      await savePlans([...plans, copied])
      return copied
    },
    [plans, savePlans]
  )

  const value = useMemo(
    () => ({
      plans,
      loading,
      error,
      savePlans,
      upsertPlan,
      deletePlan,
      duplicatePlan
    }),
    [plans, loading, error, savePlans, upsertPlan, deletePlan, duplicatePlan]
  )

  return <TeachingPlanContext.Provider value={value}>{children}</TeachingPlanContext.Provider>
}

export function useTeachingPlans(): TeachingPlanContextValue {
  const context = useContext(TeachingPlanContext)
  if (!context) {
    throw new Error('useTeachingPlans 必须在 TeachingPlanProvider 内使用')
  }
  return context
}
