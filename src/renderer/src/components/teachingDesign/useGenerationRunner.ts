import { useCallback, useRef, useState } from 'react'
import type { GenerationRequest, GenerationResult } from '@shared/teachingDesign'
import { getAppApi } from '../../platform/appApi'

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
export type GenerationRequestBody = DistributiveOmit<GenerationRequest, 'requestId'>

export function errorText(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/^Error invoking remote method '[^']+': (?:\w*Error: )?/, '')
}

export interface GenerationRunner {
  busyLabel: string | null
  canceled: () => boolean
  run: (label: string, request: GenerationRequestBody) => Promise<GenerationResult>
  cancel: () => Promise<void>
  begin: (label: string) => void
  end: () => void
}

/** 同一时间只跑一个生成请求；批量生成时由调用方循环并检查 canceled()。 */
export function useGenerationRunner(): GenerationRunner {
  const [busyLabel, setBusyLabel] = useState<string | null>(null)
  const currentId = useRef<string | null>(null)
  const canceledRef = useRef(false)

  const begin = useCallback((label: string) => {
    canceledRef.current = false
    setBusyLabel(label)
  }, [])

  const end = useCallback(() => {
    currentId.current = null
    canceledRef.current = false
    setBusyLabel(null)
  }, [])

  const run = useCallback(async (label: string, request: GenerationRequestBody) => {
    if (canceledRef.current) {
      throw new Error('已取消生成')
    }
    const requestId = crypto.randomUUID()
    currentId.current = requestId
    setBusyLabel(label)
    try {
      return await (await getAppApi()).teachingDesigns.generate({ ...request, requestId } as GenerationRequest)
    } finally {
      if (currentId.current === requestId) {
        currentId.current = null
      }
    }
  }, [])

  const cancel = useCallback(async () => {
    canceledRef.current = true
    const requestId = currentId.current
    if (requestId) {
      await (await getAppApi()).teachingDesigns.cancelGeneration(requestId)
    }
  }, [])

  return { busyLabel, canceled: () => canceledRef.current, run, cancel, begin, end }
}
