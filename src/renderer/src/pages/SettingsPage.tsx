import { useEffect, useState } from 'react'
import type { DataIntegrityReport } from '@shared/dataIntegrity'
import { APP_VERSION_LABEL } from '../appVersionLabel'
import PageLayout, { PageHeader } from '../components/PageLayout'
import { useUserPreferences } from '../context/UserPreferencesContext'
import { getAppApi } from '../platform/appApi'

export default function SettingsPage(): React.JSX.Element {
  const { preferences, savePreferences, error: preferenceError } = useUserPreferences()
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [teacherDisplayName, setTeacherDisplayName] = useState(preferences.teacherDisplayName)
  const [healthReport, setHealthReport] = useState<DataIntegrityReport | null>(null)
  const [healthOpen, setHealthOpen] = useState(false)
  const [startupReport, setStartupReport] = useState<DataIntegrityReport | null>(null)

  useEffect(() => {
    setTeacherDisplayName(preferences.teacherDisplayName)
  }, [preferences.teacherDisplayName])

  useEffect(() => {
    void getAppApi()
      .then((api) => api.dataIntegrity.startupStatus())
      .then((report) => {
        setStartupReport(report)
      })
  }, [])

  async function handleBackup(): Promise<void> {
    setWorking(true)
    setError(null)
    setMessage(null)
    try {
      const result = await (await getAppApi()).backup.create()
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
      '恢复会替换备份包里包含的业务数据。备份包没有的业务域（例如旧备份没有训练队或资料）会保留当前数据，不会被删除。恢复前会自动再备份当前数据；若自动备份失败则不会继续恢复。是否继续？'
    )
    if (!confirmed) {
      return
    }

    setWorking(true)
    setError(null)
    setMessage(null)
    try {
      const result = await (await getAppApi()).backup.restore()
      if (result.canceled) {
        setMessage('已取消恢复。')
        return
      }
      const keptNote =
        result.keptPaths.length > 0
          ? `备份未包含的 ${result.keptPaths.length} 个现有文件已保留。`
          : ''
      setMessage(
        `恢复成功，共写入 ${result.restoredCount} 个文件。${keptNote}恢复前安全备份：${result.safetyBackupPath}。即将重新加载。`
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

  async function handleSaveTeacher(): Promise<void> {
    setWorking(true)
    setError(null)
    setMessage(null)
    try {
      await savePreferences({ teacherDisplayName })
      setMessage('教师显示名称已保存。工作台问候语会立即更新，重启后仍然保留。')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '教师信息保存失败')
    } finally {
      setWorking(false)
    }
  }

  async function handleHealthCheck(): Promise<void> {
    setWorking(true)
    setError(null)
    setMessage(null)
    try {
      const report = await (await getAppApi()).dataIntegrity.audit()
      setHealthReport(report)
      setHealthOpen(true)
      if (report.status === 'healthy') {
        setMessage('数据健康检查通过：未发现警告或错误。')
      } else {
        setMessage(
          `数据健康检查完成：错误 ${report.issueCount.error}，警告 ${report.issueCount.warning}，提示 ${report.issueCount.info}。默认只检查，不会自动修改数据。`
        )
      }
    } catch (auditError) {
      setError(auditError instanceof Error ? auditError.message : '数据健康检查失败')
    } finally {
      setWorking(false)
    }
  }

  async function handleSafeRepair(): Promise<void> {
    const confirmed = window.confirm(
      '安全修复只会处理明确可逆的项（例如非法课堂状态）。修复前会先创建安全备份；备份失败则不会修改任何数据。悬空引用与重复 ID 不会自动删除。是否继续？'
    )
    if (!confirmed) {
      return
    }
    setWorking(true)
    setError(null)
    setMessage(null)
    try {
      const result = await (await getAppApi()).dataIntegrity.safeRepair()
      if (!result.ok) {
        setError(result.message)
        return
      }
      setMessage(result.message)
      if (result.reportAfter) {
        setHealthReport(result.reportAfter)
        setStartupReport(result.reportAfter)
        setHealthOpen(true)
      }
    } catch (repairError) {
      setError(repairError instanceof Error ? repairError.message : '安全修复失败')
    } finally {
      setWorking(false)
    }
  }

  return (
    <PageLayout className="page--settings">
      <PageHeader
        icon="settings"
        title="备份与恢复"
        description="管理教师显示名称，并备份或恢复本机教学数据。不会上传网络，也不会改动课表 17 节结构或评分规则。"
      />

      {preferenceError ? <p className="page-error">{preferenceError}</p> : null}
      {error ? <p className="page-error">{error}</p> : null}
      {message ? <p className="page-ok">{message}</p> : null}

      <div className="settings-grid">
        <div className="info-panel">
          <h3>教师信息</h3>
          <p className="settings-copy">用于工作台问候语及界面显示，只保存在本机偏好中，不影响历史教学数据。</p>
          <label className="settings-field">
            教师显示名称
            <input
              value={teacherDisplayName}
              onChange={(event) => setTeacherDisplayName(event.target.value)}
              maxLength={40}
              placeholder="选填"
            />
          </label>
          <button type="button" className="btn btn-primary" disabled={working} onClick={() => void handleSaveTeacher()}>
            {working ? '处理中…' : '保存显示名称'}
          </button>
        </div>

        <div className="info-panel">
          <h3>界面 / 应用信息</h3>
          <p className="settings-copy">本软件为本地优先桌面应用。当前版本不提供账号系统。</p>
          <ul>
            <li>应用版本：{APP_VERSION_LABEL}</li>
            <li>数据保存在本机应用目录，业务 JSON 与偏好文件分开存储。</li>
            <li>备份包格式仍为 .gdpebak。</li>
          </ul>
        </div>
      </div>

      <div className="settings-grid settings-grid--actions">
        <article className="info-panel settings-card--backup">
          <h3>创建备份</h3>
          <p className="settings-copy">
            生成单个备份包，包含全部业务 JSON、资料中心附件副本，以及带校验和的清单。写入完成后会再验证一遍，通过后才提示成功。
          </p>
          <button type="button" className="btn btn-primary" disabled={working} onClick={() => void handleBackup()}>
            {working ? '处理中…' : '创建备份'}
          </button>
        </article>

        <article className="info-panel settings-card--restore">
          <h3>恢复备份</h3>
          <p className="settings-copy">
            先校验备份包。不支持或已损坏的备份会被拒绝。恢复前必须先自动备份当前数据；该安全备份失败则停止。只替换备份包里有的业务数据；备份没有的业务域会保留当前文件。
          </p>
          <button type="button" className="btn btn-warning" disabled={working} onClick={() => void handleRestore()}>
            {working ? '处理中…' : '恢复备份'}
          </button>
        </article>

        <article className="info-panel">
          <h3>数据健康检查</h3>
          <p className="settings-copy">
            只读检查班级、学生、课表、课堂、测试、教学计划与训练队等引用关系。默认不会自动修改或删除任何数据。
          </p>
          {startupReport && startupReport.status !== 'healthy' ? (
            <p className={startupReport.status === 'error' ? 'page-error' : 'page-ok'}>
              启动自检：
              {startupReport.status === 'error'
                ? `发现错误 ${startupReport.issueCount.error}（请优先备份后处理；损坏 JSON 不会被自动清空）`
                : `警告 ${startupReport.issueCount.warning}（不阻塞使用，可运行完整检查查看明细）`}
            </p>
          ) : null}
          <div className="settings-health-actions">
            <button type="button" className="btn" disabled={working} onClick={() => void handleHealthCheck()}>
              {working ? '检查中…' : '运行完整数据健康检查'}
            </button>
            <button type="button" className="btn" disabled={working} onClick={() => void handleSafeRepair()}>
              安全修复（需先备份）
            </button>
          </div>
          {healthReport ? (
            <div className="settings-health-summary">
              <p>
                状态：
                {healthReport.status === 'healthy'
                  ? '正常'
                  : healthReport.status === 'warning'
                    ? `警告 ${healthReport.issueCount.warning}`
                    : `错误 ${healthReport.issueCount.error}`}
                {healthReport.issueCount.warning > 0 || healthReport.issueCount.error > 0
                  ? ` · 警告 ${healthReport.issueCount.warning} · 错误 ${healthReport.issueCount.error}`
                  : ''}
              </p>
              <button type="button" className="btn btn-small" onClick={() => setHealthOpen((open) => !open)}>
                {healthOpen ? '收起明细' : '展开明细'}
              </button>
              {healthOpen && healthReport.issues.length > 0 ? (
                <ul className="settings-health-list">
                  {healthReport.issues.slice(0, 40).map((item, index) => (
                    <li key={`${item.code}-${item.entityId}-${index}`}>
                      [{item.severity}] {item.domain} · {item.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </article>

        <article className="info-panel">
          <h3>数据安全说明</h3>
          <p className="settings-copy">
            备份与恢复只处理本软件管理的教学数据。恢复只会替换备份包里包含的班级、学生、课堂、测试、训练队和资料等业务数据；旧备份缺少的新业务域会保留现有数据，不会被删除。不会改评分规则引擎，也不会改 .gdpebak 格式。
          </p>
          <ul>
            <li>请把备份包保存在你能找到的位置，不要只留在临时文件夹。</li>
            <li>恢复前会自动再做一份安全备份；失败则不会继续恢复。</li>
            <li>旧备份缺少的业务域会保留当前数据，不会因为恢复而被删除。</li>
            <li>危险操作会再次确认，请仔细阅读提示后再继续。</li>
          </ul>
        </article>
      </div>
    </PageLayout>
  )
}
