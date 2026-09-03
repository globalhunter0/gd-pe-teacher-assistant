import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { parsePeSessions, type PEClassSession } from '@shared/peSession'

interface PeSessionContextValue {
  sessions: PEClassSession[]
  loading: boolean
  error: string | null
  saveSessions: (items: PEClassSession[]) => Promise<void>
  upsertSession: (item: PEClassSession) => Promise<void>
  deleteSession: (id: string) => Promise<void>
}

const PeSessionContext = createContext<PeSessionContextValue | null>(null)

export function PeSessionProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [sessions, setSessions] = useState<PEClassSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        const loaded = await window.electronAPI.peSessions.get()
        if (!cancelled) {
          setSessions(loaded)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '体育课记录读取失败')
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

  const saveSessions = useCallback(async (nextItems: PEClassSession[]) => {
    const saved = await window.electronAPI.peSessions.save(parsePeSessions(nextItems))
    setSessions(saved)
    setError(null)
  }, [])

  const upsertSession = useCallback(
    async (item: PEClassSession) => {
      const without = sessions.filter((entry) => entry.id !== item.id)
      await saveSessions([...without, item])
    },
    [sessions, saveSessions]
  )

  const deleteSession = useCallback(
    async (id: string) => {
      await saveSessions(sessions.filter((entry) => entry.id !== id))
    },
    [sessions, saveSessions]
  )

  const value = useMemo(
    () => ({
      sessions,
      loading,
      error,
      saveSessions,
      upsertSession,
      deleteSession
    }),
    [sessions, loading, error, saveSessions, upsertSession, deleteSession]
  )

  return <PeSessionContext.Provider value={value}>{children}</PeSessionContext.Provider>
}

export function usePeSessions(): PeSessionContextValue {
  const context = useContext(PeSessionContext)
  if (!context) {
    throw new Error('usePeSessions 必须在 PeSessionProvider 内使用')
  }
  return context
}
