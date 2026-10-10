import { useEffect, useRef, useState } from 'react'
import { shouldPromptAppUpdate, type AppUpdateStatus } from '@shared/appUpdate'
import { getAppUpdatePort, type AppUpdatePort } from '../platform/appUpdatePort'
import UpdateDialog from './UpdateDialog'

function promptKey(status: AppUpdateStatus): string {
  return `${status.state}:${status.availableVersion ?? ''}`
}

export default function UpdateHost(): React.JSX.Element | null {
  const portRef = useRef<AppUpdatePort | null>(null)
  const [status, setStatus] = useState<AppUpdateStatus | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}
    void getAppUpdatePort().then((port) => {
      if (cancelled) {
        return
      }
      portRef.current = port
      void port.getStatus().then((next) => {
        if (!cancelled) {
          setStatus(next)
        }
      })
      unsubscribe = port.subscribe((next) => {
        setStatus(next)
      })
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!status) {
      return
    }
    if (shouldPromptAppUpdate(status) && promptKey(status) !== dismissedKey) {
      setOpen(true)
    }
  }, [status, dismissedKey])

  useEffect(() => {
    if (!open) {
      return
    }
    const timer = window.setInterval(() => {
      void portRef.current?.getStatus().then(setStatus)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [open])

  if (!status || !open) {
    return null
  }

  return (
    <UpdateDialog
      status={status}
      busy={busy}
      onDismiss={() => {
        setDismissedKey(promptKey(status))
        setOpen(false)
      }}
      onDownload={() => {
        setBusy(true)
        void portRef.current
          ?.startDownload()
          .then((next) => setStatus(next))
          .finally(() => setBusy(false))
      }}
      onInstall={() => {
        setBusy(true)
        void portRef.current
          ?.quitAndInstall()
          .catch(() => undefined)
          .finally(() => setBusy(false))
      }}
    />
  )
}
