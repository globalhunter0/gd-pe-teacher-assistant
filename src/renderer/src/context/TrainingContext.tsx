import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  getTrainingItemDeleteBlockers,
  parseTrainingItems,
  parseTrainingMembers,
  parseTrainingPlans,
  parseTrainingResults,
  parseTrainingSessions,
  parseTrainingTeams,
  type TrainingItem,
  type TrainingPlan,
  type TrainingResult,
  type TrainingSession,
  type TrainingTeam,
  type TrainingTeamDeleteCheck,
  type TrainingTeamMember
} from '@shared/trainingTeam'

interface TrainingContextValue {
  teams: TrainingTeam[]
  members: TrainingTeamMember[]
  sessions: TrainingSession[]
  plans: TrainingPlan[]
  items: TrainingItem[]
  results: TrainingResult[]
  loading: boolean
  error: string | null
  saveTeams: (items: TrainingTeam[]) => Promise<void>
  addMembers: (items: TrainingTeamMember[]) => Promise<void>
  saveMembers: (items: TrainingTeamMember[]) => Promise<void>
  saveSessions: (items: TrainingSession[]) => Promise<void>
  savePlans: (items: TrainingPlan[]) => Promise<void>
  saveItems: (items: TrainingItem[]) => Promise<void>
  saveResults: (items: TrainingResult[]) => Promise<void>
  upsertTeam: (item: TrainingTeam) => Promise<void>
  archiveTeam: (id: string) => Promise<void>
  checkDeleteTeam: (id: string) => Promise<TrainingTeamDeleteCheck>
  deleteTeam: (id: string) => Promise<'physical_delete' | 'archive'>
  upsertSession: (item: TrainingSession) => Promise<void>
  upsertPlan: (item: TrainingPlan) => Promise<void>
  deletePlan: (id: string) => Promise<void>
  recordSession: (session: TrainingSession, sessionResults: TrainingResult[]) => Promise<void>
  upsertResult: (item: TrainingResult) => Promise<void>
  upsertItem: (item: TrainingItem) => Promise<void>
  deleteItem: (id: string) => Promise<void>
}

const TrainingContext = createContext<TrainingContextValue | null>(null)

function trainingBridge(): Window['electronAPI'] {
  const api = window.electronAPI
  if (!api || !api.trainingTeams || !api.trainingPlans || !api.trainingMembers || !api.trainingSessions || !api.trainingItems || !api.trainingResults) {
    const keys = api ? Object.keys(api).join(', ') : '(无 electronAPI)'
    throw new Error(`训练队接口未加载。请完全退出应用后重新打开，不要只刷新页面。当前接口：${keys}`)
  }
  return api
}

export function TrainingProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [teams, setTeams] = useState<TrainingTeam[]>([])
  const [members, setMembers] = useState<TrainingTeamMember[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [items, setItems] = useState<TrainingItem[]>([])
  const [results, setResults] = useState<TrainingResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        const api = trainingBridge()
        const [nextTeams, nextPlans, nextMembers, nextSessions, nextItems, nextResults] = await Promise.all([
          api.trainingTeams.get(),
          api.trainingPlans.get(),
          api.trainingMembers.get(),
          api.trainingSessions.get(),
          api.trainingItems.get(),
          api.trainingResults.get()
        ])
        if (!cancelled) {
          setTeams(nextTeams)
          setPlans(nextPlans)
          setMembers(nextMembers)
          setSessions(nextSessions)
          setItems(nextItems)
          setResults(nextResults)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '训练队数据读取失败')
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

  const saveTeams = useCallback(async (next: TrainingTeam[]) => {
    const saved = await trainingBridge().trainingTeams.save(parseTrainingTeams(next), teams)
    setTeams(saved)
  }, [teams])

  const memberAddQueue = useRef<Promise<void>>(Promise.resolve())
  const addMembers = useCallback((next: TrainingTeamMember[]) => {
    const operation = memberAddQueue.current.then(async () => {
      const saved = await trainingBridge().trainingMembers.add(parseTrainingMembers(next))
      setMembers(saved)
    })
    memberAddQueue.current = operation.catch(() => {})
    return operation
  }, [])

  const saveMembers = useCallback(async (next: TrainingTeamMember[]) => {
    const saved = await trainingBridge().trainingMembers.save(parseTrainingMembers(next), members)
    setMembers(saved)
  }, [members])

  const saveSessions = useCallback(async (next: TrainingSession[]) => {
    const saved = await trainingBridge().trainingSessions.save(parseTrainingSessions(next), sessions)
    setSessions(saved)
  }, [sessions])

  const savePlans = useCallback(async (next: TrainingPlan[]) => {
    const saved = await trainingBridge().trainingPlans.save(parseTrainingPlans(next), plans)
    setPlans(saved)
  }, [plans])

  const saveItems = useCallback(async (next: TrainingItem[]) => {
    const saved = await trainingBridge().trainingItems.save(parseTrainingItems(next), items)
    setItems(saved)
  }, [items])

  const saveResults = useCallback(async (next: TrainingResult[]) => {
    const saved = await trainingBridge().trainingResults.save(parseTrainingResults(next), results)
    setResults(saved)
  }, [results])

  const upsertTeam = useCallback(
    async (item: TrainingTeam) => {
      await saveTeams([...teams.filter((entry) => entry.id !== item.id), item])
    },
    [saveTeams, teams]
  )

  const archiveTeam = useCallback(
    async (id: string) => {
      const result = await trainingBridge().trainingTeams.archive(id)
      setTeams(result.teams)
      setPlans(result.plans)
    },
    []
  )

  const deleteTeam = useCallback(
    async (id: string) => {
      const result = await trainingBridge().trainingTeams.safeDelete(id)
      setTeams(result.teams)
      setMembers(result.members)
      setPlans(result.plans)
      return result.action
    },
    []
  )

  const checkDeleteTeam = useCallback(
    async (id: string) => trainingBridge().trainingTeams.deleteCheck(id),
    []
  )

  const upsertSession = useCallback(
    async (item: TrainingSession) => {
      await saveSessions([...sessions.filter((entry) => entry.id !== item.id), item])
    },
    [saveSessions, sessions]
  )

  const upsertPlan = useCallback(
    async (item: TrainingPlan) => {
      await savePlans([...plans.filter((entry) => entry.id !== item.id), item])
    },
    [plans, savePlans]
  )

  const deletePlan = useCallback(
    async (id: string) => {
      await savePlans(plans.filter((item) => item.id !== id))
    },
    [plans, savePlans]
  )

  const recordSession = useCallback(
    async (session: TrainingSession, sessionResults: TrainingResult[]) => {
      const result = await trainingBridge().trainingSessions.record(
        parseTrainingSessions([session])[0],
        parseTrainingResults(sessionResults)
      )
      setPlans(result.plans)
      setSessions(result.sessions)
      setResults(result.results)
    },
    []
  )

  const upsertResult = useCallback(
    async (item: TrainingResult) => {
      await saveResults([...results.filter((entry) => entry.id !== item.id), item])
    },
    [results, saveResults]
  )

  const upsertItem = useCallback(
    async (item: TrainingItem) => {
      await saveItems([...items.filter((entry) => entry.id !== item.id), item])
    },
    [items, saveItems]
  )

  const deleteItem = useCallback(
    async (id: string) => {
      const blockers = getTrainingItemDeleteBlockers(id, results)
      if (blockers.length > 0) {
        throw new Error(blockers.join('；'))
      }
      await saveItems(items.filter((item) => item.id !== id))
    },
    [items, results, saveItems]
  )

  const value = useMemo(
    () => ({
      teams,
      members,
      sessions,
      plans,
      items,
      results,
      loading,
      error,
      saveTeams,
      saveMembers,
      addMembers,
      saveSessions,
      savePlans,
      saveItems,
      saveResults,
      upsertTeam,
      archiveTeam,
      checkDeleteTeam,
      deleteTeam,
      upsertSession,
      upsertPlan,
      deletePlan,
      recordSession,
      upsertResult,
      upsertItem,
      deleteItem
    }),
    [
      archiveTeam,
      checkDeleteTeam,
      deleteItem,
      deletePlan,
      deleteTeam,
      error,
      items,
      loading,
      members,
      plans,
      results,
      saveItems,
      saveMembers,
      addMembers,
      saveResults,
      saveSessions,
      savePlans,
      saveTeams,
      sessions,
      teams,
      upsertItem,
      upsertResult,
      upsertSession,
      upsertPlan,
      recordSession,
      upsertTeam
    ]
  )

  return <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>
}

export function useTraining(): TrainingContextValue {
  const context = useContext(TrainingContext)
  if (!context) {
    throw new Error('useTraining 必须在 TrainingProvider 内使用')
  }
  return context
}
