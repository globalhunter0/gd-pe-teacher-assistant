import {
  TRAINING_MEMBER_STATUS_LABELS,
  TRAINING_PARTICIPATION_LABELS,
  TRAINING_RESULT_KIND_LABELS,
  formatTrainingScoreWithUnit,
  latestResult,
  latestSessionDateForStudent,
  summarizeAthleteSessions,
  type TrainingResult,
  type TrainingSession,
  type TrainingTeamMember
} from '@shared/trainingTeam'
import { PageHeader } from './PageLayout'

interface AthleteDetailPanelProps {
  member: TrainingTeamMember
  displayName: string
  studentNo: string
  classLabel: string
  genderLabel: string
  sessions: TrainingSession[]
  results: TrainingResult[]
  onBack: () => void
  onEditProfile: () => void
  canEdit: boolean
}

function sessionTitle(sessions: TrainingSession[], sessionId: string | null): string {
  if (!sessionId) {
    return '独立成绩'
  }
  const session = sessions.find((item) => item.id === sessionId)
  return session ? `${session.date} ${session.title}` : '已关联训练（记录可能已停用）'
}

export default function AthleteDetailPanel({
  member,
  displayName,
  studentNo,
  classLabel,
  genderLabel,
  sessions,
  results,
  onBack,
  onEditProfile,
  canEdit
}: AthleteDetailPanelProps): React.JSX.Element {
  const athlete = summarizeAthleteSessions(sessions, member.studentId, member.teamId)
  const teamSessions = sessions
    .filter((item) => item.teamId === member.teamId && item.attendance.some((row) => row.studentId === member.studentId))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))
  const recentSessions = teamSessions.slice(0, 8)
  const teamResults = results
    .filter((item) => item.teamId === member.teamId && item.studentId === member.studentId && item.status === 'valid')
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  const recentResults = teamResults.slice(0, 12)
  const lastResult = latestResult(teamResults)
  const lastSession = recentSessions[0] ?? null
  const lastAttendance = lastSession?.attendance.find((row) => row.studentId === member.studentId) ?? null
  const latestSessionDate = latestSessionDateForStudent(teamSessions, member.studentId)

  return (
    <div className="exam-detail">
      <PageHeader
        icon="training"
        title={displayName}
        description="运动员训练档案与历史回看。训练成绩与体育测试相互独立。"
        actions={
          <>
            <button type="button" className="btn" onClick={onBack}>
              返回
            </button>
            {canEdit ? (
              <button type="button" className="btn btn-primary" onClick={onEditProfile}>
                编辑档案
              </button>
            ) : null}
          </>
        }
      />

      <div className="stat-grid">
        <article className="stat-card">
          <p className="stat-label">基本信息</p>
          <p className="stat-hint">
            {studentNo || '无学号'} · {classLabel || '无班级'} · {genderLabel}
            <br />
            状态：{TRAINING_MEMBER_STATUS_LABELS[member.status]}
            <br />
            专项：{member.specialty || '未填'} · 位置：{member.position || '未填'}
            <br />
            分组：{member.trainingGroup || '未填'} · 入队：{member.joinedAt.slice(0, 10)}
            <br />
            备注：{member.trainingNotes || '无'}
          </p>
        </article>
        <article className="stat-card">
          <p className="stat-label">训练概览</p>
          <p className="stat-value">{athlete.sessionCount}</p>
          <p className="stat-hint">
            总训练次数 · 出勤 {athlete.presentCount} / 缺席 {athlete.absentCount}
            <br />
            最近训练：{latestSessionDate ?? '暂无'}
            <br />
            最近 RPE：{lastAttendance?.rpe != null ? lastAttendance.rpe : '未填'}
            <br />
            最近成绩：{lastResult ? `${lastResult.itemNameSnapshot} ${formatTrainingScoreWithUnit(lastResult)}` : '暂无'}
          </p>
        </article>
      </div>

      <h3>最近训练</h3>
      {recentSessions.length === 0 ? (
        <p className="exam-notes">还没有参加过训练记录。</p>
      ) : (
        <div className="import-preview-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>主题</th>
                <th>内容摘要</th>
                <th>参与</th>
                <th>RPE</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((session) => {
                const row = session.attendance.find((item) => item.studentId === member.studentId)
                return (
                  <tr key={session.id}>
                    <td>{session.date}</td>
                    <td>{session.title}</td>
                    <td>{session.exercises.map((item) => item.name).join('、') || '—'}</td>
                    <td>{row ? TRAINING_PARTICIPATION_LABELS[row.participation] : '—'}</td>
                    <td>{row?.rpe != null ? row.rpe : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <h3>测试 / 成绩</h3>
      {recentResults.length === 0 ? (
        <p className="exam-notes">还没有训练成绩。</p>
      ) : (
        <div className="import-preview-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>项目</th>
                <th>成绩</th>
                <th>类型</th>
                <th>来源</th>
              </tr>
            </thead>
            <tbody>
              {recentResults.map((result) => (
                <tr key={result.id}>
                  <td>{result.date}</td>
                  <td>{result.itemNameSnapshot}</td>
                  <td>{formatTrainingScoreWithUnit(result)}</td>
                  <td>{TRAINING_RESULT_KIND_LABELS[result.kind]}</td>
                  <td>{sessionTitle(sessions, result.sessionId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
