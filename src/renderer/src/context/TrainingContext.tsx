import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  getTrainingItemDeleteBlockers,
  getTrainingTeamDeleteBlockers,
  parseTrainingItems,
  parseTrainingMembers,
  parseTrainingResults,
  parseTrainingSessions,
  parseTrainingTeams,
  type TrainingItem,
  type TrainingResult,
  type TrainingSession,
  type TrainingTeam,
  type TrainingTeamMember
} from '@shared/trainingTeam'

interface TrainingContextValue {
  teams: TrainingTeam[]
  members: TrainingTeamMember[]
  sessions: TrainingSession[]
  items: TrainingItem[]
  results: TrainingResult[]
  loading: boolean
  error: string | null
  saveTeams: (items: TrainingTeam[]) => Promise<void>
  saveMembers: (items: TrainingTeamMember[]) => Promise<void>
  saveSessions: (items: TrainingSession[]) => Promise<void>
  saveItems: (items: TrainingItem[]) => Promise<void>
  saveResults: (items: TrainingResult[]) => Promise<void>
  upsertTeam: (item: TrainingTeam) => Promise<void>
  archiveTeam: (id: string) => Promise<void>
  deleteTeam: (id: string) => Promise<void>
  upsertSession: (item: TrainingSession) => Promise<void>
  upsertResult: (item: TrainingResult) => Promise<void>
  upsertItem: (item: TrainingItem) => Promise<void>
  deleteItem: (id: string) => Promise<void>
}

const TrainingContext = createContext<TrainingContextValue | null>(null)

function trainingBridge(): Window['electronAPI'] {
  const api = window.electronAPI
  if (!api || !api.trainingTeams || !api.trainingMembers || !api.trainingSessions || !api.trainingItems || !api.trainingResults) {
    const keys = api ? Object.keys(api).join(', ') : '(无 electronAPI)'
    throw new Error(`训练队接口未加载。请完全退出应用后重新打开，不要只刷新页面。当前接口：${keys}`)
  }
  return api
}

export function TrainingProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [teams, setTeams] = useState<TrainingTeam[]>([])
  const [members, setMembers] = useState<TrainingTeamMember[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [items, setItems] = useState<TrainingItem[]>([])
  const [results, setResults] = useState<TrainingResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        const api = trainingBridge()
        const [nextTeams, nextMembers, nextSessions, nextItems, nextResults] = await Promise.all([
          api.trainingTeams.get(),
          api.trainingMembers.get(),
          api.trainingSessions.get(),
          api.trainingItems.get(),
          api.trainingResults.get()
        ])
        if (!cancelled) {
          setTeams(nextTeams)
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
    const saved = await trainingBridge().trainingTeams.save(parseTrainingTeams(next))
    setTeams(saved)
  }, [])

  const saveMembers = useCallback(async (next: TrainingTeamMember[]) => {
    const saved = await trainingBridge().trainingMembers.save(parseTrainingMembers(next))
    setMembers(saved)
  }, [])

  const saveSessions = useCallback(async (next: TrainingSession[]) => {
    const saved = await trainingBridge().trainingSessions.save(parseTrainingSessions(next))
    setSessions(saved)
  }, [])

  const saveItems = useCallback(async (next: TrainingItem[]) => {
    const saved = await trainingBridge().trainingItems.save(parseTrainingItems(next))
    setItems(saved)
  }, [])

  const saveResults = useCallback(async (next: TrainingResult[]) => {
    const saved = await trainingBridge().trainingResults.save(parseTrainingResults(next))
    setResults(saved)
  }, [])

  const upsertTeam = useCallback(
    async (item: TrainingTeam) => {
      await saveTeams([...teams.filter((entry) => entry.id !== item.id), item])
    },
    [saveTeams, teams]
  )

  const archiveTeam = useCallback(
    async (id: string) => {
      const now = new Date().toISOString()
      await saveTeams(teams.map((item) => (item.id === id ? { ...item, status: 'archived', updatedAt: now } : item)))
    },
    [saveTeams, teams]
  )

  const deleteTeam = useCallback(
    async (id: string) => {
      const blockers = getTrainingTeamDeleteBlockers(id, teams, members, sessions, results)
      if (blockers.length > 0) {
        throw new Error(blockers.join('；'))
      }
      await saveTeams(teams.filter((item) => item.id !== id))
    },
    [members, results, saveTeams, sessions, teams]
  )

  const upsertSession = useCallback(
    async (item: TrainingSession) => {
      await saveSessions([...sessions.filter((entry) => entry.id !== item.id), item])
    },
    [saveSessions, sessions]
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
      items,
      results,
      loading,
      error,
      saveTeams,
      saveMembers,
      saveSessions,
      saveItems,
      saveResults,
      upsertTeam,
      archiveTeam,
      deleteTeam,
      upsertSession,
      upsertResult,
      upsertItem,
      deleteItem
    }),
    [
      archiveTeam,
      deleteItem,
      deleteTeam,
      error,
      items,
      loading,
      members,
      results,
      saveItems,
      saveMembers,
      saveResults,
      saveSessions,
      saveTeams,
      sessions,
      teams,
      upsertItem,
      upsertResult,
      upsertSession,
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
