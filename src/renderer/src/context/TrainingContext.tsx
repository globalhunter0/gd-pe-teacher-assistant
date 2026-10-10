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
import { getAppApi } from '../platform/appApi'

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

export function TrainingProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [teams, setTeams] = useState<TrainingTeam[]>([])
  const [members, setMembers] = useState<TrainingTeamMember[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [items, setItems] = useState<TrainingItem[]>([])
  const [results, setResults] = useState<TrainingResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadGeneration = useRef(0)

  useEffect(() => {
    const generation = ++loadGeneration.current
    async function load(): Promise<void> {
      try {
        const api = await getAppApi()
        const [nextTeams, nextPlans, nextMembers, nextSessions, nextItems, nextResults] = await Promise.all([
          api.trainingTeams.get(),
          api.trainingPlans.get(),
          api.trainingMembers.get(),
          api.trainingSessions.get(),
          api.trainingItems.get(),
          api.trainingResults.get()
        ])
        if (generation !== loadGeneration.current) return
        setTeams(nextTeams)
        setPlans(nextPlans)
        setMembers(nextMembers)
        setSessions(nextSessions)
        setItems(nextItems)
        setResults(nextResults)
        setError(null)
      } catch (loadError) {
        if (generation !== loadGeneration.current) return
        setError(loadError instanceof Error ? loadError.message : '训练队数据读取失败')
      } finally {
        if (generation === loadGeneration.current) {
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      loadGeneration.current++
    }
  }, [])

  const saveTeams = useCallback(async (next: TrainingTeam[]) => {
    const saved = await (await getAppApi()).trainingTeams.save(parseTrainingTeams(next), teams)
    setTeams(saved)
  }, [teams])

  const memberAddQueue = useRef<Promise<void>>(Promise.resolve())
  const addMembers = useCallback((next: TrainingTeamMember[]) => {
    const operation = memberAddQueue.current.then(async () => {
      const saved = await (await getAppApi()).trainingMembers.add(parseTrainingMembers(next))
      setMembers(saved)
    })
    memberAddQueue.current = operation.catch(() => {})
    return operation
  }, [])

  const saveMembers = useCallback(async (next: TrainingTeamMember[]) => {
    const saved = await (await getAppApi()).trainingMembers.save(parseTrainingMembers(next), members)
    setMembers(saved)
  }, [members])

  const saveSessions = useCallback(async (next: TrainingSession[]) => {
    const saved = await (await getAppApi()).trainingSessions.save(parseTrainingSessions(next), sessions)
    setSessions(saved)
  }, [sessions])

  const savePlans = useCallback(async (next: TrainingPlan[]) => {
    const saved = await (await getAppApi()).trainingPlans.save(parseTrainingPlans(next), plans)
    setPlans(saved)
  }, [plans])

  const saveItems = useCallback(async (next: TrainingItem[]) => {
    const saved = await (await getAppApi()).trainingItems.save(parseTrainingItems(next), items)
    setItems(saved)
  }, [items])

  const saveResults = useCallback(async (next: TrainingResult[]) => {
    const saved = await (await getAppApi()).trainingResults.save(parseTrainingResults(next), results)
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
      const result = await (await getAppApi()).trainingTeams.archive(id)
      setTeams(result.teams)
      setPlans(result.plans)
    },
    []
  )

  const deleteTeam = useCallback(
    async (id: string) => {
      const result = await (await getAppApi()).trainingTeams.safeDelete(id)
      setTeams(result.teams)
      setMembers(result.members)
      setPlans(result.plans)
      return result.action
    },
    []
  )

  const checkDeleteTeam = useCallback(
    async (id: string) => await (await getAppApi()).trainingTeams.deleteCheck(id),
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
      const result = await (await getAppApi()).trainingSessions.record(
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
