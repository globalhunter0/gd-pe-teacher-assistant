import { useState } from 'react'

export default function SettingsPage(): React.JSX.Element {
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleBackup(): Promise<void> {
    setWorking(true)
    setError(null)
    setMessage(null)
    try {
      const result = await window.electronAPI.backup.create()
      if (result.canceled) {
        setMessage('已取消备份。')
        return
      }
      setMessage(`备份成功。已写入 ${result.fileCount} 个文件，并完成校验。保存位置：${result.filePath}`)
    } catch (backupError) {
      setError(backupError instanceof Error ? backupError.message : '备份失败')
    } finally {
      setWorking(false)
    }
  }

  async function handleRestore(): Promise<void> {
    const confirmed = window.confirm(
      '恢复会用备份包替换当前班级、学生、课堂、测试、训练队和资料等全部业务数据。恢复前会自动再备份当前数据；若自动备份失败则不会继续恢复。是否继续？'
    )
    if (!confirmed) {
      return
    }

    setWorking(true)
    setError(null)
    setMessage(null)
    try {
      const result = await window.electronAPI.backup.restore()
      if (result.canceled) {
        setMessage('已取消恢复。')
        return
      }
      setMessage(
        `恢复成功，共写入 ${result.restoredCount} 个文件。恢复前安全备份：${result.safetyBackupPath}。即将重新加载。`
      )
      window.setTimeout(() => {
        window.location.reload()
      }, 1200)
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : '恢复失败')
    } finally {
      setWorking(false)
    }
  }

  return (
    <section className="page page--settings">
      <div className="page-heading">
        <h2>设置</h2>
        <p>备份与恢复只处理本软件管理的教学数据，不会上传网络，也不会改动课表 17 节结构或评分规则。</p>
      </div>

      {error ? <p className="page-error">{error}</p> : null}
      {message ? <p className="page-ok">{message}</p> : null}

      <div className="info-panel">
        <h3>数据备份</h3>
        <p className="settings-copy">
          生成单个备份包，包含全部业务 JSON、资料中心附件副本，以及带校验和的清单。写入完成后会再验证一遍，通过后才提示成功。
        </p>
        <button type="button" className="btn btn-primary" disabled={working} onClick={() => void handleBackup()}>
          {working ? '处理中…' : '一键备份'}
        </button>
      </div>

      <div className="info-panel">
        <h3>数据恢复</h3>
        <p className="settings-copy">
          先校验备份包。不支持或已损坏的备份会被拒绝。恢复前必须先自动备份当前数据；该安全备份失败则停止。恢复使用临时目录整体替换，避免新旧数据混在一起。
        </p>
        <button type="button" className="btn btn-danger" disabled={working} onClick={() => void handleRestore()}>
          {working ? '处理中…' : '一键恢复'}
        </button>
      </div>
    </section>
  )
}
