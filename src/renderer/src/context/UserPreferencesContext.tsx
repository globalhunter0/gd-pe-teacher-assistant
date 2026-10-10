import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  defaultUserPreferences,
  parseUserPreferences,
  type UserPreferences
} from '@shared/userPreferences'
import { getAppApi } from '../platform/appApi'

interface UserPreferencesContextValue {
  preferences: UserPreferences
  loading: boolean
  error: string | null
  savePreferences: (next: UserPreferences) => Promise<void>
}

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null)

export function UserPreferencesProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultUserPreferences)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        const loaded = await (await getAppApi()).userPreferences.get()
        if (!cancelled) {
          setPreferences(parseUserPreferences(loaded))
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setPreferences(defaultUserPreferences())
          setError(loadError instanceof Error ? loadError.message : '教师设置读取失败')
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

  const savePreferences = useCallback(async (next: UserPreferences) => {
    const saved = await (await getAppApi()).userPreferences.save(parseUserPreferences(next))
    setPreferences(parseUserPreferences(saved))
    setError(null)
  }, [])

  const value = useMemo(
    () => ({ preferences, loading, error, savePreferences }),
    [preferences, loading, error, savePreferences]
  )

  return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
}

export function useUserPreferences(): UserPreferencesContextValue {
  const value = useContext(UserPreferencesContext)
  if (!value) {
    throw new Error('useUserPreferences 必须在 UserPreferencesProvider 内使用')
  }
  return value
}
