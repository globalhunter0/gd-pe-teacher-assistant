import { useState } from 'react'
import {
  notifyLiveSyncConfigChanged,
  readSavedLiveSync,
  saveLiveSyncConnection,
  useCompanionLiveSyncStatus
} from './liveSyncClient'
import {
  companionSnapshotFileName,
  parseCompanionSnapshot,
  serializeCompanionSnapshot
} from '@shared/companion'
import PageLayout, { PageHeader } from '../components/PageLayout'
import { getAppApi } from '../platform/appApi'

function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function CompanionSyncPage(): React.JSX.Element {
  const saved = readSavedLiveSync()
  const live = useCompanionLiveSyncStatus()
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [liveUrl, setLiveUrl] = useState(saved.url)
  const [liveToken, setLiveToken] = useState(saved.token)

  async function handleImportFile(file: File | null): Promise<void> {
    if (!file) {
      return
    }
    setWorking(true)
    setError(null)
    setMessage(null)
    try {
      const text = await file.text()
      let raw: unknown
      try {
        raw = JSON.parse(text)
      } catch {
        throw new Error('所选文件不是有效的 JSON')
      }
      const snapshot = parseCompanionSnapshot(raw)
      const confirmed = window.confirm(
        `将用同步包整表替换本机网页数据：\n班级 ${snapshot.classes.length}、学生 ${snapshot.students.length}、测试 ${snapshot.peTests.length}、课表 ${snapshot.schedule?.length ?? '保留原课表'}、课堂 ${snapshot.peSessions?.length ?? '保留原课堂'}。\n是否继续？`
      )
      if (!confirmed) {
        setMessage('已取消导入。')
        return
      }
      const result = await (await getAppApi()).companion.applySnapshot(snapshot)
      setMessage(`${result.message} 即将重新加载。`)
      window.setTimeout(() => {
        window.location.reload()
      }, 800)
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : '导入失败')
    } finally {
      setWorking(false)
    }
  }

  async function handleExport(): Promise<void> {
    setWorking(true)
    setError(null)
    setMessage(null)
    try {
      const snapshot = await (await getAppApi()).companion.getSnapshot()
      downloadText(companionSnapshotFileName(snapshot.exportedAt), serializeCompanionSnapshot(snapshot))
      setMessage('已开始下载手机同步包。可把该文件发到电脑，在 Windows 版「备份与恢复」里导入。')
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : '导出失败')
    } finally {
      setWorking(false)
    }
  }

  return (
    <PageLayout className="page--companion-sync page-shell">
      <PageHeader
        icon="settings"
        title="数据同步"
        description="电脑开着在线同步时，手机会自动跟上课表、考勤和成绩。也可以继续用同步包手动拷贝。"
      />
      {error ? <p className="page-error">{error}</p> : null}
      {message ? <p className="page-ok">{message}</p> : null}

      <div className="settings-grid settings-grid--actions">
        <article className="info-panel">
          <h3>在线同步</h3>
          <p className="settings-copy">
            在 Windows 桌面版「备份与恢复」里开启在线同步，把那里显示的地址和同步码填到下面。电脑需要保持打开。
          </p>
          <p className={live.phase === 'error' ? 'page-error' : 'settings-copy'}>{live.message}</p>
          <label className="toolbar-field">
            <span>电脑地址</span>
            <input
              value={liveUrl}
              placeholder="https://xxxx.trycloudflare.com"
              onChange={(event) => setLiveUrl(event.target.value)}
            />
          </label>
          <label className="toolbar-field">
            <span>同步码</span>
            <input
              value={liveToken}
              placeholder="ABCD-EFGH-JKLM"
              onChange={(event) => setLiveToken(event.target.value)}
            />
          </label>
          <div className="settings-health-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                saveLiveSyncConnection(liveUrl, liveToken, true)
                notifyLiveSyncConfigChanged()
              }}
            >
              开始同步
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                saveLiveSyncConnection(liveUrl, liveToken, false)
                notifyLiveSyncConfigChanged()
              }}
            >
              停止
            </button>
          </div>
        </article>

        <article className="info-panel">
          <h3>从电脑导入</h3>
          <p className="settings-copy">
            在 Windows 版打开「备份与恢复」→「导出手机同步包」，把生成的 JSON 发到手机后在此选择导入。
          </p>
          <label className="btn btn-primary companion-file-label">
            {working ? '处理中…' : '选择同步包文件'}
            <input
              type="file"
              accept="application/json,.json"
              disabled={working}
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                event.target.value = ''
                void handleImportFile(file)
              }}
            />
          </label>
        </article>

        <article className="info-panel">
          <h3>导出回电脑</h3>
          <p className="settings-copy">
            把当前浏览器里的班级、学生、课表、课堂考勤、测试项目与体育测试导出为同步包，再在 Windows 版导入（同样会整表替换对应数据）。已安装的 1.0.2 桌面版还不会带回课表和课堂，需要下一版安装包。
          </p>
          <button type="button" className="btn" disabled={working} onClick={() => void handleExport()}>
            {working ? '处理中…' : '导出同步包'}
          </button>
        </article>

        <article className="info-panel">
          <h3>说明</h3>
          <ul>
            <li>在线同步的内容会加密后再传。电脑关掉后，手机暂停同步，已有数据仍留在本机浏览器。</li>
            <li>清除 Safari 网站数据会丢掉本机录入，请先导出同步包。</li>
            <li>Excel 批量、备份包、资料与 AI 仍只在 Windows 桌面版。</li>
          </ul>
        </article>
      </div>
    </PageLayout>
  )
}
