import { useEffect, useId } from 'react'
import {
  appUpdateInstallActionLabel,
  formatAppUpdateStatusMessage,
  formatAppUpdateVersion,
  type AppUpdateStatus
} from '@shared/appUpdate'

interface UpdateDialogProps {
  status: AppUpdateStatus
  busy?: boolean
  onDismiss: () => void
  onDownload: () => void
  onInstall: () => void
}

function titleFor(status: AppUpdateStatus): string {
  if (status.state === 'downloading') {
    return '正在下载更新'
  }
  if (status.state === 'readyToInstall') {
    return '更新已就绪'
  }
  if (status.state === 'error') {
    return '更新失败'
  }
  return '发现新版本'
}

export default function UpdateDialog({
  status,
  busy = false,
  onDismiss,
  onDownload,
  onInstall
}: UpdateDialogProps): React.JSX.Element {
  const titleId = useId()
  const percent = Math.round(status.progressPercent ?? 0)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onDismiss()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onDismiss])

  return (
    <div className="dialog-backdrop" onMouseDown={onDismiss}>
      <div
        className="dialog dialog--update"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>{titleFor(status)}</h3>
        <p className="dialog-slot">
          当前版本 {formatAppUpdateVersion(status.currentVersion)}
          {status.availableVersion ? `，新版本 ${formatAppUpdateVersion(status.availableVersion)}` : ''}
          。检查更新需要能访问 GitHub。
        </p>
        <p>{formatAppUpdateStatusMessage(status)}</p>
        {status.releaseNotes ? <p className="update-dialog-notes">{status.releaseNotes}</p> : null}
        {status.state === 'downloading' ? (
          <div className="update-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div className="update-progress-bar" style={{ width: `${percent}%` }} />
          </div>
        ) : null}
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onDismiss} disabled={busy && status.state === 'checking'}>
            {status.state === 'readyToInstall' || status.state === 'error' ? '关闭' : '稍后'}
          </button>
          <div className="dialog-actions-right">
            {status.state === 'available' || (status.state === 'error' && status.availableVersion) ? (
              <button type="button" className="btn btn-primary" disabled={busy} onClick={onDownload}>
                下载更新
              </button>
            ) : null}
            {status.state === 'readyToInstall' ? (
              <button type="button" className="btn btn-primary" disabled={busy} onClick={onInstall}>
                {appUpdateInstallActionLabel(status.installKind)}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
