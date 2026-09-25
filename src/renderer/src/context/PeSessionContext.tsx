import { assertCollectionUnchanged } from '@shared/persistence/collectionConflict'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { parsePeSessions, type PEClassSession } from '@shared/peSession'

interface PeSessionContextValue {
  sessions: PEClassSession[]
  loading: boolean
  error: string | null
  saveSessions: (items: PEClassSession[]) => Promise<void>
  createSession: (item: PEClassSession) => Promise<PEClassSession>
  upsertSession: (item: PEClassSession, expected?: PEClassSession) => Promise<void>
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
          setError(loadError instanceof Error ? loadError.message : '课堂记录读取失败')
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
    if (loading || error) throw new Error('数据尚未就绪，请重新加载后保存')
    const saved = await window.electronAPI.peSessions.save(parsePeSessions(nextItems), sessions)
    setSessions(saved)
    setError(null)
  }, [sessions, loading, error])

  const upsertSession = useCallback(
    async (item: PEClassSession, expected?: PEClassSession) => {
      if (expected) assertCollectionUnchanged([sessions.find(entry => entry.id === item.id)], [expected])
      const without = sessions.filter((entry) => entry.id !== item.id)
      await saveSessions([...without, item])
    },
    [sessions, saveSessions]
  )

  const createSession = useCallback(async (item: PEClassSession) => {
    if (loading || error) throw new Error('课堂数据尚未就绪，请重新加载')
    const result = await window.electronAPI.peSessions.create(item)
    setSessions(result.sessions)
    setError(null)
    return result.session
  }, [loading, error])

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
      createSession,
      upsertSession,
      deleteSession
    }),
    [sessions, loading, error, saveSessions, createSession, upsertSession, deleteSession]
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
