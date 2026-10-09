import { useEffect, useMemo, useRef, useState } from 'react'
import { listedClassRecords, type ClassRecord } from '@shared/class'
import PageLayout, { PageHeader } from '../components/PageLayout'
import TechEmptyState from '../components/workspace/TechEmptyState'
import OverviewBar from '../components/workspace/OverviewBar'
import {
  parseScoreInput,
  testUnitDisplay,
  TEST_DIRECTIONS,
  TEST_UNITS,
  TEST_UNIT_LABELS,
  TEST_VALUE_TYPES,
  TEST_VALUE_TYPE_LABELS,
  TIME_INPUT_MODES,
  TIME_INPUT_MODE_LABELS,
  type TestDirection,
  type TestUnit,
  type TestValueType,
  type TimeInputMode
} from '@shared/peTest'
import { type StudentRecord } from '@shared/student'
import {
  TRAINING_MEMBER_STATUS_LABELS,
  TRAINING_PARTICIPATION_LABELS,
  TRAINING_RESULT_KIND_LABELS,
  TRAINING_PLAN_STATUS_LABELS,
  TRAINING_SPORT_LABELS,
  TRAINING_TEAM_STATUS_LABELS,
  buildTrainingTeamStats,
  canMutateTrainingTeam,
  childTeams,
  classLabelOf,
  classNameOf,
  compareToPreviousResult,
  createTrainingItemId,
  createTrainingMemberId,
  createTrainingResultId,
  currentMemberCount,
  currentRosterStudents,
  trainingRosterStudents,
  filterSchoolWideStudents,
  firstResult,
  formatTrainingDate,
  formatTrainingScoreWithUnit,
  hasActiveMembership,
  isActiveMembership,
  isActiveTrainingTeam,
  isArchivedTrainingTeam,
  isListedTrainingTeam,
  latestResult,
  latestSessionForTeam,
  linkedTrainingSessionForPlan,
  personalBest,
  summarizeTeam,
  teamDisplayPath,
  trainingResultsForTeam,
  validResultsForStudentItem,
  type TrainingItem,
  type TrainingPlan,
  type TrainingResult,
  type TrainingResultKind,
  type TrainingSession,
  type TrainingTeam,
  type TrainingTeamDeleteCheck,
  type TrainingTeamMember
} from '@shared/trainingTeam'
import ManualTrainingMembers from '../components/ManualTrainingMembers'
import AthleteDetailPanel from '../components/AthleteDetailPanel'
import MemberProfileDialog from '../components/MemberProfileDialog'
import TrainingPlanDialog from '../components/TrainingPlanDialog'
import TrainingSessionEditor from '../components/TrainingSessionEditor'
import TrainingTeamDialog from '../components/TrainingTeamDialog'
import { useClasses } from '../context/ClassContext'
import { useStudents } from '../context/StudentContext'
import { useTraining } from '../context/TrainingContext'

const LAST_TEAM_KEY = 'gd-pe-last-training-team-id'
type HomeTab = 'home' | 'plans' | 'members' | 'sessions' | 'results' | 'stats'

function rememberTeam(id: string): void {
  try {
    localStorage.setItem(LAST_TEAM_KEY, id)
  } catch {
    // Ignore quota / private mode.
  }
}

function rememberedTeamId(): string {
  try {
    return localStorage.getItem(LAST_TEAM_KEY) ?? ''
  } catch {
    return ''
  }
}

function percent(value: number | null): string {
  if (value === null) {
    return '数据不足'
  }
  return `${Math.round(value * 1000) / 10}%`
}

function trainingTeamDeleteConfirmText(check: TrainingTeamDeleteCheck): string {
  const { team, total } = check
  const lines = [
    `队伍：${team.name}（${TRAINING_TEAM_STATUS_LABELS[team.status]}）`,
    `当前队员：${total.activeMemberCount} 名`,
    `已退出/历史队员：${total.historicalMemberCount} 名`,
    `训练场次：${total.sessionCount} 次`,
    `训练计划：${total.planCount} 条`,
    `成绩：${total.resultCount} 条（其中绑定训练课 ${total.sessionLinkedResultCount} 条，独立成绩 ${total.independentResultCount} 条）`
  ]
  if (check.descendantCount > 0) {
    lines.push(`直接子组 ${check.directChildCount} 个，共影响本队及 ${check.descendantCount} 个下属组。`)
  }
  if (total.scheduleLinkCount > 0) {
    lines.push(`课表关联：${total.scheduleLinkCount} 条。`)
  }
  if (check.canPhysicallyDelete) {
    lines.push('该队及下属组没有队员、训练、成绩或课表引用，可以永久删除。此操作不可撤销。')
  } else {
    lines.push(
      `保护原因：${check.blockingReasons.join('；')}。`,
      '为保护历史数据，本操作只会停用/归档相关队伍，并结束当前队籍；不会删除成员历史、训练场次、训练计划或成绩，也不会破坏 sessionId 关联。'
    )
  }
  return lines.join('\n')
}

function planHorizonLabel(date: string, today: string): string {
  if (date === today) {
    return '今天'
  }
  const todayDate = new Date(`${today}T00:00:00`)
  const weekday = todayDate.getDay()
  const monday = new Date(todayDate)
  monday.setDate(todayDate.getDate() + (weekday === 0 ? -6 : 1 - weekday))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  if (date >= formatTrainingDate(monday) && date <= formatTrainingDate(sunday)) {
    return '本周'
  }
  return date > today ? '未来' : '历史'
}

export default function TrainingTeamsPage({
  openTeamId = null,
  startSessionOnOpen = false,
  onOpenTeamConsumed
}: {
  openTeamId?: string | null
  startSessionOnOpen?: boolean
  onOpenTeamConsumed?: () => void
}): React.JSX.Element {
  const { classes } = useClasses()
  const { students: schoolStudents } = useStudents()
  const training = useTraining()
  const students = trainingRosterStudents(schoolStudents, training.members)
  const joining = useRef(new Set<string>())
  const [selectedId, setSelectedId] = useState(rememberedTeamId)
  const [tab, setTab] = useState<HomeTab>('home')
  const [sessionRecord, setSessionRecord] = useState<TrainingSession | null | undefined>(undefined)
  const [sourcePlan, setSourcePlan] = useState<TrainingPlan | null>(null)
  const [planDialog, setPlanDialog] = useState<TrainingPlan | null | undefined>(undefined)
  const [teamDialog, setTeamDialog] = useState<{ record: TrainingTeam | null; parent: TrainingTeam | null } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TrainingTeamDeleteCheck | null>(null)

  useEffect(() => {
    if (!openTeamId) {
      return
    }
    setSelectedId(openTeamId)
    rememberTeam(openTeamId)
    setTab('home')
    setSessionRecord(startSessionOnOpen ? null : undefined)
    setSourcePlan(null)
    setPlanDialog(undefined)
    onOpenTeamConsumed?.()
  }, [openTeamId, startSessionOnOpen, onOpenTeamConsumed])
  const [memberQuery, setMemberQuery] = useState('')
  const [showLeftMembers, setShowLeftMembers] = useState(false)
  const [showArchivedTeams, setShowArchivedTeams] = useState(false)
  const [profileMember, setProfileMember] = useState<TrainingTeamMember | null>(null)
  const [athleteMemberId, setAthleteMemberId] = useState<string | null>(null)
  const [resultStudentId, setResultStudentId] = useState('')
  const [resultItemId, setResultItemId] = useState('')
  const [resultDate, setResultDate] = useState(formatTrainingDate(new Date()))
  const [resultInput, setResultInput] = useState('')
  const [resultKind, setResultKind] = useState<TrainingResultKind>('training')
  const [resultNote, setResultNote] = useState('')
  const [customItemName, setCustomItemName] = useState('')
  const [customValueType, setCustomValueType] = useState<TestValueType>('number')
  const [customTimeMode, setCustomTimeMode] = useState<TimeInputMode>('seconds')
  const [customUnit, setCustomUnit] = useState<TestUnit>('times')
  const [customDirection, setCustomDirection] = useState<TestDirection>('higherBetter')
  const [actionError, setActionError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const listedTeams = training.teams.filter((team) =>
    showArchivedTeams ? isListedTrainingTeam(team) : isActiveTrainingTeam(team)
  )
  const selected = listedTeams.find((item) => item.id === selectedId) ?? null
  const roots = listedTeams.filter((item) => item.parentTeamId === null)
  const listedTeamIds = new Set(listedTeams.map((item) => item.id))
  const overviewMemberCount = new Set(
    training.members
      .filter(
        (item) =>
          listedTeamIds.has(item.teamId) &&
          isActiveMembership(item) &&
          students.some((student) => item.studentId === student.id && student.status === 'active')
      )
      .map((item) => item.studentId)
  ).size
  const overviewSessionCount = training.sessions.filter((item) => listedTeamIds.has(item.teamId)).length

  function openTeam(id: string): void {
    rememberTeam(id)
    setSelectedId(id)
    setTab('home')
    setSessionRecord(undefined)
    setSourcePlan(null)
    setPlanDialog(undefined)
    setActionError(null)
  }

  async function handleSaveTeam(record: TrainingTeam): Promise<void> {
    await training.upsertTeam(record)
    setTeamDialog(null)
    openTeam(record.id)
  }

  async function handleJoin(student: StudentRecord): Promise<void> {
    if (!selected) {
      return
    }
    if (!canMutateTrainingTeam(selected)) {
      setActionError('该训练队已停用或已删除，不能再添加队员')
      return
    }
    if (student.status !== 'active') {
      setActionError('只能添加当前在读学生')
      return
    }
    if (hasActiveMembership(training.members, selected.id, student.id)) {
      setActionError('该学生已在本队/组中')
      return
    }
    const now = new Date().toISOString()
    const next: TrainingTeamMember = {
      source: training.members.some((member) => member.studentId === student.id && member.source === 'manual') ? 'manual' : 'student',
      id: createTrainingMemberId(),
      teamId: selected.id,
      studentId: student.id,
      joinedAt: now,
      leftAt: null,
      status: 'active',
      nameSnapshot: student.name,
      studentNoSnapshot: student.studentNo,
      classNameSnapshot: classLabelOf(classes, student.classId),
      genderSnapshot: student.gender,
      specialty: '',
      position: '',
      trainingGroup: '',
      trainingNotes: '',
      notes: '',
      createdAt: now,
      updatedAt: now
    }
    if (joining.current.has(student.id)) return
    joining.current.add(student.id)
    setActionError(null)
    try {
      await training.addMembers([next])
      setMessage(`已加入：${student.name}`)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '添加队员失败')
    } finally { joining.current.delete(student.id) }
  }

  async function handleLeave(member: TrainingTeamMember): Promise<void> {
    const now = new Date().toISOString()
    await training.saveMembers(
      training.members.map((item) =>
        item.id === member.id ? { ...item, status: 'left', leftAt: now, updatedAt: now } : item
      )
    )
  }

  async function handleSaveSession(session: TrainingSession, sessionResults: TrainingResult[]): Promise<void> {
    if (selected && !canMutateTrainingTeam(selected)) {
      setActionError('该训练队已停用或已删除，不能再保存训练')
      return
    }
    if (session.planId && !sessionRecord?.id) {
      await training.completePlanWithSession(session.planId, session)
    } else {
      await training.upsertSession(session)
    }
    const retained = training.results.filter((item) => item.sessionId !== session.id)
    await training.saveResults([...retained, ...sessionResults])
    setSessionRecord(undefined)
    setSourcePlan(null)
    setTab(session.planId ? 'plans' : 'sessions')
    setMessage(
      sessionResults.length > 0
        ? `训练已保存，并绑定 ${sessionResults.length} 条当堂测试成绩。`
        : '训练已保存'
    )
  }

  async function handleSaveMemberProfile(member: TrainingTeamMember): Promise<void> {
    await training.saveMembers(training.members.map((item) => (item.id === member.id ? member : item)))
    setProfileMember(null)
    setMessage(`已更新运动员档案：${member.nameSnapshot}`)
  }

  async function handleSaveResult(): Promise<void> {
    if (!selected) {
      return
    }
    if (!canMutateTrainingTeam(selected)) {
      setActionError('该训练队已停用或已删除，不能再新增成绩')
      return
    }
    const student = students.find((item) => item.id === resultStudentId)
    const item = training.items.find((entry) => entry.id === resultItemId)
    if (!student || !item) {
      setActionError('请选择队员和项目')
      return
    }
    try {
      const rawValue = parseScoreInput(resultInput, item.valueType, item.timeInputMode)
      const now = new Date().toISOString()
      const result: TrainingResult = {
        id: createTrainingResultId(),
        teamId: selected.id,
        studentId: student.id,
        studentNameSnapshot: student.name,
        studentNoSnapshot: student.studentNo,
        classNameSnapshot: classNameOf(classes, student.classId),
        genderSnapshot: student.gender,
        date: resultDate,
        itemId: item.id,
        itemNameSnapshot: item.name,
        unitSnapshot: item.unit,
        customUnitLabelSnapshot: item.customUnitLabel,
        directionSnapshot: item.direction,
        valueTypeSnapshot: item.valueType,
        timeInputModeSnapshot: item.timeInputMode,
        decimalPlacesSnapshot: item.decimalPlaces,
        rawInput: resultInput.trim(),
        rawValue,
        kind: resultKind,
        sessionId: null,
        status: 'valid',
        note: resultNote.trim(),
        createdAt: now,
        updatedAt: now
      }
      await training.upsertResult(result)
      setResultInput('')
      setResultNote('')
      setMessage('成绩已保存')
      setActionError(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '成绩无法识别')
    }
  }

  async function handleSavePlan(plan: TrainingPlan): Promise<void> {
    await training.upsertPlan(plan)
    setPlanDialog(undefined)
    setTab('plans')
    setMessage(planDialog ? '训练计划已更新' : '训练计划已保存')
    setActionError(null)
  }

  async function handleCancelPlan(plan: TrainingPlan): Promise<void> {
    if (plan.status !== 'planned') {
      setActionError('只有待执行计划可以取消')
      return
    }
    if (linkedTrainingSessionForPlan(training.sessions, plan.id)) {
      setActionError('该计划已有训练记录，不能取消')
      return
    }
    if (!window.confirm(`确定取消「${plan.title}」？取消后不再执行，历史训练记录不会被删除。`)) {
      return
    }
    await training.upsertPlan({ ...plan, status: 'cancelled', updatedAt: new Date().toISOString() })
    setMessage('训练计划已取消')
  }

  async function handleDeletePlan(plan: TrainingPlan): Promise<void> {
    if (plan.status === 'completed' || linkedTrainingSessionForPlan(training.sessions, plan.id)) {
      setActionError('已有训练记录的计划不能删除')
      return
    }
    if (!window.confirm(`确定删除「${plan.title}」？此操作不可撤销。`)) {
      return
    }
    await training.deletePlan(plan.id)
    setMessage('训练计划已删除')
  }

  function handleStartFromPlan(plan: TrainingPlan): void {
    if (!selected) {
      return
    }
    if (!canMutateTrainingTeam(selected)) {
      setActionError('该训练队已停用或已删除，不能再开始训练')
      return
    }
    const linked = linkedTrainingSessionForPlan(training.sessions, plan.id)
    if (linked) {
      setSourcePlan(null)
      setSessionRecord(linked)
      return
    }
    if (plan.status !== 'planned') {
      setActionError('只有待执行计划可以开始训练')
      return
    }
    setSourcePlan(plan)
    setSessionRecord(null)
  }

  function handleViewPlanSession(plan: TrainingPlan): void {
    const linked = linkedTrainingSessionForPlan(training.sessions, plan.id)
    if (!linked) {
      setActionError('未找到该计划对应的训练记录')
      return
    }
    setSourcePlan(null)
    setSessionRecord(linked)
  }

  async function handleAddCustomItem(): Promise<void> {
    const name = customItemName.trim()
    if (name === '') {
      setActionError('请填写自定义项目名称')
      return
    }
    const now = new Date().toISOString()
    const decimalPlaces =
      customValueType === 'time' ? (customTimeMode === 'minutesSeconds' ? 1 : 2) : customUnit === 'm' || customUnit === 'cm' ? 2 : 0
    const item: TrainingItem = {
      id: createTrainingItemId(),
      builtinKey: null,
      name,
      valueType: customValueType,
      timeInputMode: customValueType === 'time' ? customTimeMode : 'seconds',
      unit: customUnit,
      customUnitLabel: customUnit === 'other' ? '单位' : '',
      direction: customDirection,
      decimalPlaces,
      isBuiltin: false,
      isActive: true,
      notes: '',
      createdAt: now,
      updatedAt: now
    }
    await training.upsertItem(item)
    setCustomItemName('')
    setResultItemId(item.id)
    setMessage(`已添加项目：${name}`)
    setActionError(null)
  }

  if (training.loading) {
    return (
      <PageLayout>
        <PageHeader icon="training" title="训练队" description="正在读取本地训练数据…" />
      </PageLayout>
    )
  }

  if (sessionRecord !== undefined && selected) {
    const sessionId = sessionRecord?.id ?? null
    const existingSessionResults = sessionId
      ? training.results.filter((item) => item.sessionId === sessionId)
      : []
    return (
      <PageLayout className="page--training">
        <TrainingSessionEditor
          team={selected}
          roster={currentRosterStudents(selected.id, training.members, students)}
          classes={classes}
          items={training.items}
          existingSessionResults={existingSessionResults}
          record={sessionRecord}
          sourcePlan={sessionRecord ? null : sourcePlan}
          onCancel={() => {
            setSessionRecord(undefined)
            setSourcePlan(null)
          }}
          onSave={handleSaveSession}
        />
      </PageLayout>
    )
  }

  const athleteMember =
    athleteMemberId && selected
      ? training.members.find((item) => item.id === athleteMemberId && item.teamId === selected.id) ?? null
      : null
  if (athleteMember && selected) {
    const live = students.find((item) => item.id === athleteMember.studentId)
    const cls = live ? classes.find((item) => item.id === live.classId) : undefined
    return (
      <PageLayout className="page--training">
        <AthleteDetailPanel
          member={athleteMember}
          displayName={live?.status === 'deleted' ? athleteMember.nameSnapshot : live?.name ?? athleteMember.nameSnapshot}
          studentNo={live?.studentNo || athleteMember.studentNoSnapshot}
          classLabel={cls ? `${cls.grade} ${cls.className}` : athleteMember.classNameSnapshot}
          genderLabel={athleteMember.genderSnapshot === 'male' ? '男' : '女'}
          sessions={training.sessions}
          results={training.results}
          onBack={() => setAthleteMemberId(null)}
          onEditProfile={() => setProfileMember(athleteMember)}
          canEdit={canMutateTrainingTeam(selected)}
        />
        {profileMember ? (
          <MemberProfileDialog
            member={profileMember}
            displayName={live?.name ?? profileMember.nameSnapshot}
            studentNo={live?.studentNo || profileMember.studentNoSnapshot}
            classLabel={cls ? `${cls.grade} ${cls.className}` : profileMember.classNameSnapshot}
            genderLabel={profileMember.genderSnapshot === 'male' ? '男' : '女'}
            readOnly={!canMutateTrainingTeam(selected)}
            onClose={() => setProfileMember(null)}
            onSave={handleSaveMemberProfile}
          />
        ) : null}
      </PageLayout>
    )
  }

  return (
    <PageLayout className="page--training">
      <PageHeader
        icon="training"
        title="训练队"
        description="管理校队/训练组、出勤和训练成绩。与行政班、课堂记录、体育测试相互独立，不改班级人数。"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setTeamDialog({ record: null, parent: null })}>
            新建队伍
          </button>
        }
      />
      {training.error ? <p className="page-error">{training.error}</p> : null}
      {actionError ? <p className="page-error">{actionError}</p> : null}
      {message ? <p className="exam-notes">{message}</p> : null}

      <OverviewBar
        items={[
          {
            label: '训练队',
            value: listedTeams.filter(isActiveTrainingTeam).length,
            hint: showArchivedTeams ? '启用中（另含已停用）' : '当前启用'
          },
          { label: '当前队员', value: overviewMemberCount, hint: '在队且在读' },
          { label: '训练记录', value: overviewSessionCount, hint: '已保存训练' }
        ]}
      />

      <div className="training-archive-filter">
        <label className="team-member-left-filter">
          <input
            type="checkbox"
            checked={showArchivedTeams}
            onChange={(event) => setShowArchivedTeams(event.target.checked)}
          />
          显示已停用队伍
        </label>
      </div>

      {roots.length === 0 ? (
        <TechEmptyState
          kind="training"
          title="还没有训练队"
          description="先新建校队或训练组，例如校田径队、校篮球队，再在队下建短跑组、中长跑组。训练队不绑定行政班。"
          actionLabel="新建队伍"
          onAction={() => setTeamDialog({ record: null, parent: null })}
        />
      ) : (
      <div className="training-layout">
        <aside className="training-list">
          {roots.length === 0 ? <p className="exam-notes">还没有训练队。</p> : null}
          {roots.map((root) => (
            <div key={root.id} className="training-tree">
              <button
                type="button"
                className={selectedId === root.id ? 'nav-item is-active' : 'nav-item'}
                onClick={() => openTeam(root.id)}
              >
                {root.name}
                <span className="text-muted">
                  {' '}
                  · {TRAINING_SPORT_LABELS[root.sport]}
                  {isArchivedTrainingTeam(root) ? ' · 已停用' : ''} ·{' '}
                  {currentMemberCount(root.id, training.members, students)}人
                </span>
              </button>
              {childTeams(training.teams, root.id)
                .filter((child) => (showArchivedTeams ? isListedTrainingTeam(child) : isActiveTrainingTeam(child)))
                .map((child) => (
                <button
                  key={child.id}
                  type="button"
                  className={selectedId === child.id ? 'nav-item is-active training-child' : 'nav-item training-child'}
                  onClick={() => openTeam(child.id)}
                >
                  {child.name}
                  <span className="text-muted">
                    {' '}
                    · {isArchivedTrainingTeam(child) ? '已停用 · ' : ''}
                    {currentMemberCount(child.id, training.members, students)}人
                  </span>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <div className="training-main">
          {!selected ? (
            <TechEmptyState
              kind="training"
              title="选择或新建一支训练队"
              description="例如校田径队、校篮球队，再在队下建短跑组、中长跑组。"
            />
          ) : (
            <TeamWorkspace
              team={selected}
              tab={tab}
              onTab={setTab}
              classes={classes}
              students={students}
              memberQuery={memberQuery}
              setMemberQuery={setMemberQuery}
              showLeftMembers={showLeftMembers}
              setShowLeftMembers={setShowLeftMembers}
              onStartTraining={() => {
                if (!canMutateTrainingTeam(selected)) {
                  setActionError('该训练队已停用或已删除，不能再开始训练')
                  return
                }
                setSourcePlan(null)
                setSessionRecord(null)
              }}
              onEditSession={(session) => {
                setSourcePlan(null)
                setSessionRecord(session)
              }}
              onCreatePlan={() => {
                if (!canMutateTrainingTeam(selected)) {
                  setActionError('该训练队已停用或已删除，不能再新建训练计划')
                  return
                }
                setPlanDialog(null)
              }}
              onEditPlan={(plan) => {
                if (!canMutateTrainingTeam(selected) || plan.status !== 'planned') {
                  setActionError('只有启用中训练队的待执行计划可以编辑')
                  return
                }
                setPlanDialog(plan)
              }}
              onCancelPlan={(plan) => void handleCancelPlan(plan)}
              onDeletePlan={(plan) => void handleDeletePlan(plan)}
              onStartPlan={handleStartFromPlan}
              onViewPlanSession={handleViewPlanSession}
              onAddGroup={() => setTeamDialog({ record: null, parent: selected.parentTeamId ? listedTeams.find((item) => item.id === selected.parentTeamId) ?? null : selected })}
              onEditTeam={() => setTeamDialog({ record: selected, parent: null })}
              onJoin={handleJoin}
              onLeave={(member) => void handleLeave(member)}
              onOpenAthlete={(member) => setAthleteMemberId(member.id)}
              onEditAthlete={(member) => setProfileMember(member)}
              onArchive={() =>
                void training.archiveTeam(selected.id).then(() => setMessage('已停用。未执行计划已取消，历史训练、计划和成绩仍保留。'))
              }
              onDelete={() => {
                setActionError(null)
                void training
                  .checkDeleteTeam(selected.id)
                  .then(setPendingDelete)
                  .catch((error) =>
                    setActionError(error instanceof Error ? error.message : '无法检查训练队删除影响')
                  )
              }}
              resultStudentId={resultStudentId}
              setResultStudentId={setResultStudentId}
              resultItemId={resultItemId}
              setResultItemId={setResultItemId}
              resultDate={resultDate}
              setResultDate={setResultDate}
              resultInput={resultInput}
              setResultInput={setResultInput}
              resultKind={resultKind}
              setResultKind={setResultKind}
              resultNote={resultNote}
              setResultNote={setResultNote}
              customItemName={customItemName}
              setCustomItemName={setCustomItemName}
              customValueType={customValueType}
              setCustomValueType={setCustomValueType}
              customTimeMode={customTimeMode}
              setCustomTimeMode={setCustomTimeMode}
              customUnit={customUnit}
              setCustomUnit={setCustomUnit}
              customDirection={customDirection}
              setCustomDirection={setCustomDirection}
              onSaveResult={() => void handleSaveResult()}
              onAddCustomItem={() => void handleAddCustomItem()}
            />
          )}
        </div>
      </div>
      )}

      {profileMember && !athleteMemberId ? (
        <MemberProfileDialog
          member={profileMember}
          displayName={
            students.find((item) => item.id === profileMember.studentId)?.name ?? profileMember.nameSnapshot
          }
          studentNo={
            students.find((item) => item.id === profileMember.studentId)?.studentNo || profileMember.studentNoSnapshot
          }
          classLabel={(() => {
            const live = students.find((item) => item.id === profileMember.studentId)
            const cls = live ? classes.find((item) => item.id === live.classId) : undefined
            return cls ? `${cls.grade} ${cls.className}` : profileMember.classNameSnapshot
          })()}
          genderLabel={profileMember.genderSnapshot === 'male' ? '男' : '女'}
          readOnly={!(selected && canMutateTrainingTeam(selected))}
          onClose={() => setProfileMember(null)}
          onSave={handleSaveMemberProfile}
        />
      ) : null}

      {teamDialog ? (
        <TrainingTeamDialog
          record={teamDialog.record}
          parentTeam={teamDialog.parent}
          parentOptions={roots.filter((item) => item.status === 'active')}
          onClose={() => setTeamDialog(null)}
          onSave={handleSaveTeam}
        />
      ) : null}

      {planDialog !== undefined && selected ? (
        <TrainingPlanDialog
          trainingTeamId={selected.id}
          record={planDialog}
          onClose={() => setPlanDialog(undefined)}
          onSave={handleSavePlan}
        />
      ) : null}

      {pendingDelete ? (
        <div className="dialog-backdrop" onMouseDown={() => setPendingDelete(null)}>
          <div className="dialog" role="dialog" onMouseDown={(event) => event.stopPropagation()}>
            <h3>
              {pendingDelete.canPhysicallyDelete ? '永久删除' : '安全停用'}“
              {pendingDelete.team.name}”？
            </h3>
            <p className="dialog-slot" style={{ whiteSpace: 'pre-wrap' }}>
              {trainingTeamDeleteConfirmText(pendingDelete)}
            </p>
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={() => setPendingDelete(null)}>
                  取消
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    void (async () => {
                      try {
                        const action = await training.deleteTeam(pendingDelete.team.id)
                        setPendingDelete(null)
                        setSelectedId('')
                        setMessage(
                          action === 'physical_delete'
                            ? '空训练队已永久删除。'
                            : '训练队已安全停用；队员、训练场次、训练计划和成绩均已保留，未执行计划已取消。'
                        )
                      } catch (deleteError) {
                        setActionError(deleteError instanceof Error ? deleteError.message : '无法删除')
                      }
                    })()
                  }}
                >
                  {pendingDelete.canPhysicallyDelete ? '确认永久删除' : '确认安全停用'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageLayout>
  )
}

function TeamWorkspace({
  team,
  tab,
  onTab,
  classes,
  students,
  memberQuery,
  setMemberQuery,
  showLeftMembers,
  setShowLeftMembers,
  onStartTraining,
  onEditSession,
  onCreatePlan,
  onEditPlan,
  onCancelPlan,
  onDeletePlan,
  onStartPlan,
  onViewPlanSession,
  onAddGroup,
  onEditTeam,
  onJoin,
  onLeave,
  onOpenAthlete,
  onEditAthlete,
  onArchive,
  onDelete,
  resultStudentId,
  setResultStudentId,
  resultItemId,
  setResultItemId,
  resultDate,
  setResultDate,
  resultInput,
  setResultInput,
  resultKind,
  setResultKind,
  resultNote,
  setResultNote,
  customItemName,
  setCustomItemName,
  customValueType,
  setCustomValueType,
  customTimeMode,
  setCustomTimeMode,
  customUnit,
  setCustomUnit,
  customDirection,
  setCustomDirection,
  onSaveResult,
  onAddCustomItem
}: {
  team: TrainingTeam
  tab: HomeTab
  onTab: (tab: HomeTab) => void
  classes: ClassRecord[]
  students: StudentRecord[]
  memberQuery: string
  setMemberQuery: (value: string) => void
  showLeftMembers: boolean
  setShowLeftMembers: (value: boolean) => void
  onStartTraining: () => void
  onEditSession: (session: TrainingSession) => void
  onCreatePlan: () => void
  onEditPlan: (plan: TrainingPlan) => void
  onCancelPlan: (plan: TrainingPlan) => void
  onDeletePlan: (plan: TrainingPlan) => void
  onStartPlan: (plan: TrainingPlan) => void
  onViewPlanSession: (plan: TrainingPlan) => void
  onAddGroup: () => void
  onEditTeam: () => void
  onJoin: (student: StudentRecord) => void
  onLeave: (member: TrainingTeamMember) => void
  onOpenAthlete: (member: TrainingTeamMember) => void
  onEditAthlete: (member: TrainingTeamMember) => void
  onArchive: () => void
  onDelete: () => void
  resultStudentId: string
  setResultStudentId: (value: string) => void
  resultItemId: string
  setResultItemId: (value: string) => void
  resultDate: string
  setResultDate: (value: string) => void
  resultInput: string
  setResultInput: (value: string) => void
  resultKind: TrainingResultKind
  setResultKind: (value: TrainingResultKind) => void
  resultNote: string
  setResultNote: (value: string) => void
  customItemName: string
  setCustomItemName: (value: string) => void
  customValueType: TestValueType
  setCustomValueType: (value: TestValueType) => void
  customTimeMode: TimeInputMode
  setCustomTimeMode: (value: TimeInputMode) => void
  customUnit: TestUnit
  setCustomUnit: (value: TestUnit) => void
  customDirection: TestDirection
  setCustomDirection: (value: TestDirection) => void
  onSaveResult: () => void
  onAddCustomItem: () => void
}): React.JSX.Element {
  const training = useTraining()
  const [memberClassFilter, setMemberClassFilter] = useState('all')
  const [memberAddMode, setMemberAddMode] = useState<'existing' | 'manual'>('manual')
  const teams = training.teams
  const teamStats = buildTrainingTeamStats(
    team.id,
    training.members,
    training.sessions,
    training.results
  )
  const latest = latestSessionForTeam(training.sessions, team.id)
  const today = formatTrainingDate(new Date())
  const teamPlans = training.plans
    .filter((item) => item.trainingTeamId === team.id)
    .slice()
    .sort((a, b) => {
      const aPlanned = a.status === 'planned' ? 0 : 1
      const bPlanned = b.status === 'planned' ? 0 : 1
      if (aPlanned !== bPlanned) {
        return aPlanned - bPlanned
      }
      if (a.status === 'planned') {
        return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
      }
      return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
    })
  const canEditPlans = canMutateTrainingTeam(team)
  const teamResults = trainingResultsForTeam(
    team.id,
    training.sessions,
    training.results
  )
  const overview = summarizeTeam(
    team.id,
    training.members,
    training.sessions,
    new Set(students.filter((item) => item.status === 'active').map((item) => item.id))
  )
  const teamMembers = training.members.filter((item) => item.teamId === team.id)
  const visibleMembers = teamMembers.filter((item) => showLeftMembers || isActiveMembership(item))
  const searchable = filterSchoolWideStudents(students, { classId: memberClassFilter, query: memberQuery })
  const historyByStudent = useMemo(() => {
    const map = new Map<string, TrainingResult[]>()
    for (const result of teamResults) {
      const list = map.get(result.studentId) ?? []
      list.push(result)
      map.set(result.studentId, list)
    }
    return map
  }, [teamResults])

  return (
    <>
      <div className="page-heading page-heading--split">
        <div className="page-heading-text">
          <h3>
            {teamDisplayPath(teams, team)}
            {isArchivedTrainingTeam(team) ? '（已停用）' : ''}
          </h3>
          <p>
            {TRAINING_SPORT_LABELS[team.sport]} · {TRAINING_TEAM_STATUS_LABELS[team.status]}
            {team.coach ? ` · 教练 ${team.coach}` : ''}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={onStartTraining}>
            开始训练
          </button>
          {!team.parentTeamId ? (
            <button type="button" className="btn" onClick={onAddGroup}>
              新建训练组
            </button>
          ) : null}
          <button type="button" className="btn" onClick={onEditTeam}>
            编辑
          </button>
          <button type="button" className="btn" onClick={onArchive}>
            停用
          </button>
          <button type="button" className="btn" onClick={onDelete}>
            删除
          </button>
        </div>
      </div>

      <div className="toolbar">
        {(['home', 'plans', 'members', 'sessions', 'results', 'stats'] as const).map((item) => (
          <button key={item} type="button" className={tab === item ? 'btn btn-primary' : 'btn'} onClick={() => onTab(item)}>
            {item === 'home'
              ? '主页'
              : item === 'plans'
                ? '训练计划'
                : item === 'members'
                  ? '队员'
                  : item === 'sessions'
                    ? '训练记录'
                    : item === 'results'
                      ? '成绩'
                      : '统计'}
          </button>
        ))}
      </div>

      {tab === 'home' ? (
        <div className="stat-grid">
          <article className="stat-card">
            <p className="stat-label">当前队员人数</p>
            <p className="stat-value">{teamStats.activeMemberCount}</p>
            <p className="stat-hint">当前有效在队成员</p>
          </article>
          <article className="stat-card">
            <p className="stat-label">历史队员</p>
            <p className="stat-value">{teamStats.historicalMemberCount}</p>
            <p className="stat-hint">已退出成员仍保留历史统计</p>
          </article>
          <article className="stat-card">
            <p className="stat-label">训练次数</p>
            <p className="stat-value">{teamStats.completedSessionCount}</p>
            <p className="stat-hint">按已发生的训练记录统计</p>
          </article>
          <article className="stat-card">
            <p className="stat-label">成绩记录</p>
            <p className="stat-value">{teamStats.resultCount}</p>
            <p className="stat-hint">
              训练内 {teamStats.sessionLinkedResultCount} · 独立 {teamStats.independentResultCount}
            </p>
          </article>
          <article className="stat-card">
            <p className="stat-label">最近训练</p>
            <p className="stat-value">{teamStats.latestSessionDate ?? '暂无'}</p>
            <p className="stat-hint">{latest ? latest.title : '还没有训练记录'}</p>
          </article>
        </div>
      ) : null}

      {tab === 'plans' ? (
        <>
          <div className="toolbar">
            {canEditPlans ? (
              <button type="button" className="btn btn-primary" onClick={onCreatePlan}>
                新建计划
              </button>
            ) : (
              <p className="exam-notes">该训练队已停用，仅可查看历史训练计划，不能再新增未来计划。</p>
            )}
          </div>
          {teamPlans.length === 0 ? (
            <TechEmptyState
              title="还没有训练计划"
              description="先写下今天或本周要练什么，再从计划一键开始训练。"
              kind="training"
            />
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>训练日期</th>
                    <th>范围</th>
                    <th>训练主题</th>
                    <th>训练目标</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPlans.map((plan) => {
                    const linked = linkedTrainingSessionForPlan(training.sessions, plan.id)
                    return (
                      <tr key={plan.id}>
                        <td>{plan.date}</td>
                        <td>{planHorizonLabel(plan.date, today)}</td>
                        <td>{plan.title}</td>
                        <td className="data-table-notes">{plan.goal || '—'}</td>
                        <td>{TRAINING_PLAN_STATUS_LABELS[plan.status]}</td>
                        <td>
                          {linked ? (
                            <button type="button" className="btn btn-small" onClick={() => onViewPlanSession(plan)}>
                              查看训练记录
                            </button>
                          ) : null}
                          {!linked && plan.status === 'planned' && canEditPlans ? (
                            <>
                              <button type="button" className="btn btn-small btn-primary" onClick={() => onStartPlan(plan)}>
                                开始训练
                              </button>
                              <button type="button" className="btn btn-small" onClick={() => onEditPlan(plan)}>
                                编辑
                              </button>
                              <button type="button" className="btn btn-small" onClick={() => onCancelPlan(plan)}>
                                取消
                              </button>
                              <button type="button" className="btn btn-small" onClick={() => onDeletePlan(plan)}>
                                删除
                              </button>
                            </>
                          ) : null}
                          {!linked && plan.status === 'cancelled' && canEditPlans ? (
                            <button type="button" className="btn btn-small" onClick={() => onDeletePlan(plan)}>
                              删除
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}

      {tab === 'members' ? (
        <div className="team-members-workspace">
          <details className="team-member-add" open={teamMembers.length === 0 ? true : undefined}>
            <summary>
              <span className="team-member-add-icon" aria-hidden="true">+</span>
              <span><strong>添加队员</strong><small>从已有名单选择，或直接录入其他班级队员</small></span>
              <span className="team-member-add-toggle" aria-hidden="true" />
            </summary>
            <div className="team-member-add-body">
              <div className="team-member-mode" role="group" aria-label="添加方式">
                <button type="button" aria-pressed={memberAddMode === 'manual'} onClick={() => setMemberAddMode('manual')}>手动录入</button>
                <button type="button" aria-pressed={memberAddMode === 'existing'} onClick={() => setMemberAddMode('existing')}>从名单选择</button>
              </div>
              <div hidden={memberAddMode !== 'manual'}><ManualTrainingMembers key={team.id} team={team} /></div>
              <div hidden={memberAddMode !== 'existing'}>
          <div className="toolbar team-member-filters">
            <label className="toolbar-field">
              行政班
              <select value={memberClassFilter} onChange={(event) => setMemberClassFilter(event.target.value)}>
                <option value="all">全部班级</option>
                {listedClassRecords(classes).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.grade} {item.className}
                  </option>
                ))}
              </select>
            </label>
            <label className="toolbar-field toolbar-field-grow">
              搜索学生加入
              <input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder="姓名 / 学号" />
            </label>

          </div>
          <div className="import-preview-wrap team-member-picker">
            <table className="data-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>学号</th>
                  <th>年级</th>
                  <th>行政班</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {searchable.length === 0 ? (
                  <tr>
                    <td colSpan={5}>没有符合条件的在读学生</td>
                  </tr>
                ) : (
                  searchable.map((student) => {
                    const cls = classes.find((item) => item.id === student.classId)
                    const joined = hasActiveMembership(training.members, team.id, student.id)
                    return (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.studentNo || '—'}</td>
                        <td>{cls?.grade ?? '—'}</td>
                        <td>{cls?.className ?? '—'}</td>
                        <td>
                          <button type="button" className="btn" disabled={joined || team.status !== 'active'} onClick={() => onJoin(student)}>
                            {joined ? '已加入' : '加入'}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
              </div>
            </div>
          </details>
          <section className="team-member-roster" aria-label="本队队员">
            <div className="team-member-roster-heading">
              <div><h3>本队队员 <span>{teamMembers.filter(isActiveMembership).length}</span></h3><p>管理队员档案，查看训练与成绩记录</p></div>
              <label className="team-member-left-filter"><input type="checkbox" checked={showLeftMembers} onChange={(event) => setShowLeftMembers(event.target.checked)} />显示已退出</label>
            </div>
          <div className="import-preview-wrap team-member-roster-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>年级 / 行政班</th>
                  <th>专项 / 分组</th>
                  <th>状态</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibleMembers.length === 0 ? <tr><td colSpan={5}><div className="team-member-empty"><strong>{showLeftMembers ? '暂无队员记录' : '还没有在队队员'}</strong><p>展开上方「添加队员」，组建你的训练名单。</p></div></td></tr> : null}
                {visibleMembers.map((member) => {
                  const live = students.find((item) => item.id === member.studentId)
                  const cls = live ? classes.find((item) => item.id === live.classId) : undefined
                  return (
                    <tr key={member.id}>
                      <td title={`加入日期：${member.joinedAt.slice(0, 10)}`}><strong className="team-member-name">{live?.status === 'deleted' ? member.nameSnapshot : live?.name ?? member.nameSnapshot}</strong><small className="team-member-secondary">{live?.studentNo || member.studentNoSnapshot ? `学号 ${live?.studentNo || member.studentNoSnapshot}` : '未填写学号'}</small></td>
                      <td>{cls ? `${cls.grade} ${cls.className}` : member.classNameSnapshot || '—'}</td>
                      <td>{member.specialty || '未设置专项'}<small className="team-member-secondary">{member.trainingGroup || '未分组'}</small></td>
                      <td>
                        <span className={isActiveMembership(member) ? 'team-member-status is-active' : 'team-member-status'}>{TRAINING_MEMBER_STATUS_LABELS[member.status]}</span>
                        {live?.status === 'deleted' ? ' · 学生已删除' : live?.status === 'transferred' ? ' · 不在当前名单' : ''}
                      </td>
                      <td className="team-member-actions">
                        <button type="button" className="btn btn-small" onClick={() => onOpenAthlete(member)}>
                          详情
                        </button>
                        <button type="button" className="btn btn-small" onClick={() => onEditAthlete(member)}>
                          档案
                        </button>
                        {isActiveMembership(member) ? (
                          <button type="button" className="btn btn-small team-member-leave" onClick={() => onLeave(member)}>
                            退出
                          </button>
                        ) : (
                          member.leftAt?.slice(0, 10)
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </section>
        </div>
      ) : null}

      {tab === 'sessions' ? (
        training.sessions.filter((item) => item.teamId === team.id).length === 0 ? (
          <TechEmptyState title="还没有训练记录" description="点右上角「开始训练」记录出勤、内容和备注。" kind="training" />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>训练日期</th>
                  <th>队伍</th>
                  <th>训练内容</th>
                  <th>参与情况</th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {training.sessions
                  .filter((item) => item.teamId === team.id)
                  .map((session) => (
                    <tr key={session.id}>
                      <td>{session.date}</td>
                      <td>{session.teamNameSnapshot || team.name}</td>
                      <td>{session.exercises.map((item) => item.name).join('、') || session.title}</td>
                      <td>
                        {session.attendance.filter((row) => row.participation !== 'absent').length}/{session.attendance.length} 人次
                      </td>
                      <td className="data-table-notes">{session.notes || '—'}</td>
                      <td>
                        <button type="button" className="btn btn-small" onClick={() => onEditSession(session)}>
                          打开
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      {tab === 'results' ? (
        <>
          <div className="toolbar">
            <label className="toolbar-field">
              队员
              <select value={resultStudentId} onChange={(event) => setResultStudentId(event.target.value)}>
                <option value="">选择队员</option>
                {teamMembers.map((member) => {
                  const live = students.find((item) => item.id === member.studentId)
                  return (
                    <option key={member.id} value={member.studentId}>
                      {live?.name ?? member.nameSnapshot}
                      {member.status === 'left' ? '（已退出）' : ''}
                    </option>
                  )
                })}
              </select>
            </label>
            <label className="toolbar-field">
              项目
              <select value={resultItemId} onChange={(event) => setResultItemId(event.target.value)}>
                <option value="">选择项目</option>
                {training.items
                  .filter((item) => item.isActive)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}（{item.direction === 'lowerBetter' ? '越低越好' : '越高越好'}）
                    </option>
                  ))}
              </select>
            </label>
            <label className="toolbar-field">
              日期
              <input type="date" value={resultDate} onChange={(event) => setResultDate(event.target.value)} />
            </label>
            <label className="toolbar-field">
              原始成绩
              <input value={resultInput} onChange={(event) => setResultInput(event.target.value)} placeholder="3.39 或 12.84" />
            </label>
            <label className="toolbar-field">
              类型
              <select value={resultKind} onChange={(event) => setResultKind(event.target.value as TrainingResultKind)}>
                <option value="training">{TRAINING_RESULT_KIND_LABELS.training}</option>
                <option value="competition">{TRAINING_RESULT_KIND_LABELS.competition}</option>
              </select>
            </label>
            <button type="button" className="btn btn-primary" onClick={onSaveResult}>
              保存成绩
            </button>
          </div>
          <div className="toolbar">
            <label className="toolbar-field">
              自定义项目
              <input value={customItemName} onChange={(event) => setCustomItemName(event.target.value)} placeholder="例如 30米" />
            </label>
            <label className="toolbar-field">
              类型
              <select
                value={customValueType}
                onChange={(event) => {
                  const next = event.target.value as TestValueType
                  setCustomValueType(next)
                  if (next === 'time') {
                    setCustomUnit('s')
                    setCustomDirection('lowerBetter')
                  } else if (customUnit === 's') {
                    setCustomUnit('times')
                    setCustomDirection('higherBetter')
                  }
                }}
              >
                {TEST_VALUE_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {TEST_VALUE_TYPE_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            {customValueType === 'time' ? (
              <label className="toolbar-field">
                时间格式
                <select value={customTimeMode} onChange={(event) => setCustomTimeMode(event.target.value as TimeInputMode)}>
                  {TIME_INPUT_MODES.map((value) => (
                    <option key={value} value={value}>
                      {TIME_INPUT_MODE_LABELS[value]}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="toolbar-field">
              单位
              <select value={customUnit} onChange={(event) => setCustomUnit(event.target.value as TestUnit)}>
                {TEST_UNITS.map((value) => (
                  <option key={value} value={value}>
                    {TEST_UNIT_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="toolbar-field">
              方向
              <select value={customDirection} onChange={(event) => setCustomDirection(event.target.value as TestDirection)}>
                {TEST_DIRECTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value === 'lowerBetter' ? '越低越好' : value === 'higherBetter' ? '越高越好' : '中性'}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn" onClick={onAddCustomItem}>
              添加项目
            </button>
            <span className="exam-notes">1000米请输入 3.39 表示 3分39秒。独立成绩不绑定训练课。</span>
          </div>
          {resultStudentId && resultItemId ? (
            <AthleteResultSummary
              results={validResultsForStudentItem(teamResults, resultStudentId, resultItemId)}
              item={training.items.find((item) => item.id === resultItemId) ?? null}
            />
          ) : (
            <p className="exam-notes">选择队员和项目后，可查看首次、最近、PB 和比上次变化。</p>
          )}
          <div className="import-preview-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>队员</th>
                  <th>项目</th>
                  <th>输入</th>
                  <th>成绩</th>
                  <th>类型</th>
                  <th>来源</th>
                </tr>
              </thead>
              <tbody>
                {teamResults.slice(0, 40).map((row) => {
                  const sourceSession = row.sessionId
                    ? training.sessions.find((session) => session.id === row.sessionId)
                    : null
                  return (
                    <tr key={row.id}>
                      <td>{row.date}</td>
                      <td>{row.studentNameSnapshot}</td>
                      <td>{row.itemNameSnapshot}</td>
                      <td>{row.rawInput}</td>
                      <td>{formatTrainingScoreWithUnit(row)}</td>
                      <td>{TRAINING_RESULT_KIND_LABELS[row.kind]}</td>
                      <td>
                        {row.sessionId
                          ? sourceSession
                            ? `${sourceSession.date} ${sourceSession.title}`
                            : '已关联训练'
                          : '独立成绩'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {tab === 'stats' ? (
        <>
          <div className="stat-grid">
            <article className="stat-card">
              <p className="stat-label">累计训练次数</p>
              <p className="stat-value">{overview.sessionCount}</p>
              <p className="stat-hint">按训练记录条数，不是人次</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">当前队员人数</p>
              <p className="stat-value">{overview.currentMemberCount}</p>
              <p className="stat-hint">有效在队且在读</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">近期出勤人次</p>
              <p className="stat-value">{overview.recentPresentPersonTimes}</p>
              <p className="stat-hint">最近最多 5 次训练中「非缺席」行数</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">近期缺席人次</p>
              <p className="stat-value">{overview.recentAbsentPersonTimes}</p>
              <p className="stat-hint">最近最多 5 次训练中缺席行数</p>
            </article>
          </div>
          <div className="import-preview-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>队员</th>
                  <th>训练次数</th>
                  <th>出勤次数</th>
                  <th>缺席次数</th>
                  <th>出勤率</th>
                  <th>最近训练</th>
                  <th>最近成绩</th>
                  <th>PB</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers
                  .filter((item) => isActiveMembership(item) || showLeftMembers)
                  .map((member) => {
                    const live = students.find((item) => item.id === member.studentId)
                    const athlete = teamStats.memberStats.find((item) => item.memberId === member.id)
                    const history = historyByStudent.get(member.studentId) ?? []
                    const last = latestResult(history)
                    const best = last ? personalBest(history.filter((row) => row.itemId === last.itemId)) : null
                    return (
                      <tr key={member.id}>
                        <td>{live?.name ?? member.nameSnapshot}</td>
                        <td>{athlete?.trainingSessionCount ?? 0}</td>
                        <td>{athlete?.presentSessionCount ?? 0}</td>
                        <td>{(athlete?.trainingSessionCount ?? 0) - (athlete?.presentSessionCount ?? 0)}</td>
                        <td>
                          {percent(
                            athlete && athlete.trainingSessionCount > 0
                              ? athlete.presentSessionCount / athlete.trainingSessionCount
                              : null
                          )}
                        </td>
                        <td>{athlete?.latestSessionDate ?? '—'}</td>
                        <td>{last ? `${last.itemNameSnapshot} ${formatTrainingScoreWithUnit(last)}` : '—'}</td>
                        <td>{best ? `${best.itemNameSnapshot} ${formatTrainingScoreWithUnit(best)}` : '数据不足'}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </>
  )
}

function AthleteResultSummary({ results, item }: { results: TrainingResult[]; item: TrainingItem | null }): React.JSX.Element {
  const first = firstResult(results)
  const last = latestResult(results)
  const best = personalBest(results)
  const previous = results.length >= 2 ? results[results.length - 2] : null
  const trend = last ? compareToPreviousResult(last, previous) : null
  return (
    <p className="exam-notes">
      {item ? `${item.name}（${testUnitDisplay(item.unit, item.customUnitLabel)}）` : ''}
      首次：{first ? formatTrainingScoreWithUnit(first) : '数据不足'}
      ；最近：{last ? formatTrainingScoreWithUnit(last) : '数据不足'}
      ；PB：{best ? formatTrainingScoreWithUnit(best) : '数据不足'}
      {trend ? ` · ${trend.text}` : results.length < 2 ? ' · 趋势数据不足' : ''}
    </p>
  )
}
