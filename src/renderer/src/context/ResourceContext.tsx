import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type {
  ResourceFileImportInput,
  ResourceItem,
  ResourceLinkInput,
  ResourceNoteInput,
  ResourceSelectResult,
  ResourceUpdateInput
} from '@shared/resource'

interface ResourceContextValue {
  resources: ResourceItem[]
  loading: boolean
  error: string | null
  selectFile: () => Promise<ResourceSelectResult>
  cancelSelect: () => Promise<void>
  importFile: (input: ResourceFileImportInput) => Promise<void>
  createNote: (input: ResourceNoteInput) => Promise<void>
  createLink: (input: ResourceLinkInput) => Promise<void>
  updateResource: (id: string, input: ResourceUpdateInput) => Promise<void>
  deleteResource: (id: string) => Promise<string | null>
  openResource: (id: string) => Promise<void>
}

const ResourceContext = createContext<ResourceContextValue | null>(null)

export function ResourceProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        const loaded = await window.electronAPI.resources.get()
        if (!cancelled) {
          setResources(loaded)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '资料读取失败')
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

  const selectFile = useCallback(async () => {
    return window.electronAPI.resources.selectFile()
  }, [])

  const cancelSelect = useCallback(async () => {
    await window.electronAPI.resources.cancelSelect()
  }, [])

  const importFile = useCallback(async (input: ResourceFileImportInput) => {
    const saved = await window.electronAPI.resources.importFile(input)
    setResources(saved)
    setError(null)
  }, [])

  const createNote = useCallback(async (input: ResourceNoteInput) => {
    const saved = await window.electronAPI.resources.createNote(input)
    setResources(saved)
    setError(null)
  }, [])

  const createLink = useCallback(async (input: ResourceLinkInput) => {
    const saved = await window.electronAPI.resources.createLink(input)
    setResources(saved)
    setError(null)
  }, [])

  const updateResource = useCallback(async (id: string, input: ResourceUpdateInput) => {
    const saved = await window.electronAPI.resources.update(id, input)
    setResources(saved)
    setError(null)
  }, [])

  const deleteResource = useCallback(async (id: string) => {
    const result = await window.electronAPI.resources.delete(id)
    setResources(result.items)
    setError(null)
    return result.warning
  }, [])

  const openResource = useCallback(async (id: string) => {
    await window.electronAPI.resources.open(id)
  }, [])

  const value = useMemo(
    () => ({
      resources,
      loading,
      error,
      selectFile,
      cancelSelect,
      importFile,
      createNote,
      createLink,
      updateResource,
      deleteResource,
      openResource
    }),
    [
      resources,
      loading,
      error,
      selectFile,
      cancelSelect,
      importFile,
      createNote,
      createLink,
      updateResource,
      deleteResource,
      openResource
    ]
  )

  return <ResourceContext.Provider value={value}>{children}</ResourceContext.Provider>
}

export function useResources(): ResourceContextValue {
  const context = useContext(ResourceContext)
  if (!context) {
    throw new Error('useResources 必须在 ResourceProvider 内使用')
  }
  return context
}
