import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { parsePeTestSessions, type PETestSession } from '@shared/peTest'

interface PeTestContextValue {
  sessions: PETestSession[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  saveSessions: (items: PETestSession[]) => Promise<void>
  upsertSession: (item: PETestSession) => Promise<void>
  deleteSession: (id: string) => Promise<void>
}

const PeTestContext = createContext<PeTestContextValue | null>(null)

export function PeTestProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [sessions, setSessions] = useState<PETestSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const loaded = await window.electronAPI.peTests.get()
    setSessions(loaded)
    setError(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        await reload()
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '体育测试读取失败')
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
  }, [reload])

  const saveSessions = useCallback(async (nextItems: PETestSession[]) => {
    const saved = await window.electronAPI.peTests.save(parsePeTestSessions(nextItems))
    setSessions(saved)
    setError(null)
  }, [])

  const upsertSession = useCallback(
    async (item: PETestSession) => {
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
      reload,
      saveSessions,
      upsertSession,
      deleteSession
    }),
    [sessions, loading, error, reload, saveSessions, upsertSession, deleteSession]
  )

  return <PeTestContext.Provider value={value}>{children}</PeTestContext.Provider>
}

export function usePeTests(): PeTestContextValue {
  const context = useContext(PeTestContext)
  if (!context) {
    throw new Error('usePeTests 必须在 PeTestProvider 内使用')
  }
  return context
}
