import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { parseTestItems, type TestItem } from '@shared/peTest'

interface TestItemContextValue {
  items: TestItem[]
  loading: boolean
  error: string | null
  saveItems: (items: TestItem[]) => Promise<void>
  upsertItem: (item: TestItem) => Promise<void>
}

const TestItemContext = createContext<TestItemContextValue | null>(null)

export function TestItemProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [items, setItems] = useState<TestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        const loaded = await window.electronAPI.testItems.get()
        if (!cancelled) {
          setItems(loaded)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '测试项目读取失败')
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

  const saveItems = useCallback(async (nextItems: TestItem[]) => {
    const saved = await window.electronAPI.testItems.save(parseTestItems(nextItems))
    setItems(saved)
    setError(null)
  }, [])

  const upsertItem = useCallback(
    async (item: TestItem) => {
      const without = items.filter((entry) => entry.id !== item.id)
      await saveItems([...without, item])
    },
    [items, saveItems]
  )

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      saveItems,
      upsertItem
    }),
    [items, loading, error, saveItems, upsertItem]
  )

  return <TestItemContext.Provider value={value}>{children}</TestItemContext.Provider>
}

export function useTestItems(): TestItemContextValue {
  const context = useContext(TestItemContext)
  if (!context) {
    throw new Error('useTestItems 必须在 TestItemProvider 内使用')
  }
  return context
}
