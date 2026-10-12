import { useEffect, useId, useRef, useState } from 'react'
import {
  PLAN_DURATION_MAX,
  PLAN_DURATION_MIN,
  SCHOOL_STAGE_LABELS,
  SCHOOL_STAGES,
  SPORT_PROGRAM_FAMILIES,
  SPORT_PROGRAMS,
  TRAINING_LEVEL_HINTS,
  TRAINING_LEVEL_LABELS,
  TRAINING_LEVELS,
  TRAINING_SPORT_LABELS,
  createTrainingPlanId,
  defaultSportProgramId,
  formatTrainingDate,
  getSportProgram,
  type SchoolStage,
  type TrainingLevel,
  type TrainingPlan,
  type TrainingPlanAiDraft,
  type TrainingTeam
} from '@shared/trainingTeam'
import { getAppApi } from '../platform/appApi'

interface Props {
  team: TrainingTeam
  onClose: () => void
  onSave: (plan: TrainingPlan) => Promise<void>
}

export default function AiTrainingPlanDialog({ team, onClose, onSave }: Props): React.JSX.Element {
  const titleId = useId()
  const [date, setDate] = useState(formatTrainingDate(new Date()))
  const [stage, setStage] = useState<SchoolStage>('junior')
  const [programId, setProgramId] = useState(() => defaultSportProgramId(team.sport))
  const [level, setLevel] = useState<TrainingLevel>('basic')
  const [durationInput, setDurationInput] = useState('90')
  const [requirements, setRequirements] = useState('')
  const [draft, setDraft] = useState<TrainingPlanAiDraft | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cancelRequested = useRef(false)
  const busy = requestId !== null || saving
  const program = getSportProgram(programId) ?? SPORT_PROGRAMS[0]
  const teamSportDiffers = program.sport !== team.sport && team.sport !== 'other'

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [busy, onClose])

  async function generate(): Promise<void> {
    const durationMinutes = Number(durationInput)
    if (!date) {
      setError('请选择训练日期')
      return
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < PLAN_DURATION_MIN || durationMinutes > PLAN_DURATION_MAX) {
      setError(`单次训练时长应为 ${PLAN_DURATION_MIN}–${PLAN_DURATION_MAX} 分钟`)
      return
    }
    const nextRequestId = `training-plan-ai-${crypto.randomUUID()}`
    cancelRequested.current = false
    setRequestId(nextRequestId)
    setError(null)
    try {
      const api = await getAppApi()
      const generated = await api.trainingPlans.generate({
        requestId: nextRequestId,
        trainingTeamId: team.id,
        date,
        stage,
        programId: program.id,
        level,
        durationMinutes,
        requirements: requirements.trim()
      })
      setDraft(generated)
    } catch (generateError) {
      if (!cancelRequested.current) {
        setError(generateError instanceof Error ? generateError.message : 'AI 制定训练计划失败')
      }
    } finally {
      setRequestId(null)
    }
  }

  async function cancelGeneration(): Promise<void> {
    if (!requestId) return
    cancelRequested.current = true
    const api = await getAppApi()
    await api.trainingPlans.cancelGeneration(requestId)
    setError(null)
  }

  async function save(): Promise<void> {
    if (!draft) return
    if (!draft.date || !draft.title.trim() || !draft.content.trim()) {
      setError('请填写训练日期、主题和内容')
      return
    }
    setSaving(true)
    setError(null)
    const now = new Date().toISOString()
    try {
      await onSave({
        id: createTrainingPlanId(),
        trainingTeamId: team.id,
        date: draft.date,
        title: draft.title.trim(),
        goal: draft.goal.trim(),
        content: draft.content.trim(),
        notes: draft.notes.trim(),
        status: 'planned',
        blueprint: draft.blueprint,
        createdAt: now,
        updatedAt: now
      })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存训练计划失败')
      setSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={() => !busy && onClose()}>
      <div
        className="dialog dialog--ai-training"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>AI 制定训练计划</h3>
        {!draft ? (
          <>
            <p className="dialog-slot">
              AI 会结合项目训练原则和当前队伍的匿名汇总画像生成一节训练草稿，不会上传队员姓名、学号、班级或个人备注。
            </p>
            <div className="dialog-grid">
              <label>
                训练日期
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={busy} />
              </label>
              <label>
                学段
                <select value={stage} onChange={(event) => setStage(event.target.value as SchoolStage)} disabled={busy}>
                  {SCHOOL_STAGES.map((item) => (
                    <option key={item} value={item}>{SCHOOL_STAGE_LABELS[item]}</option>
                  ))}
                </select>
              </label>
              <label>
                项目
                <select value={program.id} onChange={(event) => setProgramId(event.target.value)} disabled={busy}>
                  {SPORT_PROGRAM_FAMILIES.map((family) => (
                    <optgroup key={family} label={family}>
                      {SPORT_PROGRAMS.filter((item) => item.family === family).map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label>
                水平
                <select value={level} onChange={(event) => setLevel(event.target.value as TrainingLevel)} disabled={busy}>
                  {TRAINING_LEVELS.map((item) => (
                    <option key={item} value={item}>{TRAINING_LEVEL_LABELS[item]}</option>
                  ))}
                </select>
              </label>
              <label>
                单次时长（分钟）
                <input
                  type="number"
                  min={PLAN_DURATION_MIN}
                  max={PLAN_DURATION_MAX}
                  step={5}
                  value={durationInput}
                  onChange={(event) => setDurationInput(event.target.value)}
                  disabled={busy}
                />
              </label>
              <p className="ai-training-hint">{TRAINING_LEVEL_HINTS[level]}</p>
              {teamSportDiffers ? (
                <p className="dialog-span ai-training-warning">
                  当前队伍是{TRAINING_SPORT_LABELS[team.sport]}，本次选择的是{program.name}，生成后仍保存到当前队伍。
                </p>
              ) : null}
              <label className="dialog-span">
                教练补充要求
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={requirements}
                  onChange={(event) => setRequirements(event.target.value)}
                  placeholder="例如：重点练习传切配合；场地为半场；器材有篮球 12 个、标志桶 20 个"
                  disabled={busy}
                />
              </label>
              <p className="dialog-span ai-training-warning">
                请勿在补充要求中填写学生姓名、学号、联系方式、伤病诊断等个人信息。AI 内容仅作草稿，保存和执行前请核对负荷、场地器材与安全安排。
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="dialog-slot">
              AI 草稿来源：{draft.generation.provider} · {draft.generation.model}。请由教练审核、修改后再保存。
            </p>
            <div className="dialog-grid">
              <label>
                训练日期
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                  disabled={saving}
                />
              </label>
              <p className="ai-training-hint">
                {SCHOOL_STAGE_LABELS[draft.blueprint.stage]} · {getSportProgram(draft.blueprint.programId)?.name ?? draft.blueprint.programId} ·{' '}
                {TRAINING_LEVEL_LABELS[draft.blueprint.level]} · {draft.blueprint.durationMinutes}分钟
              </p>
              <label className="dialog-span">
                训练主题
                <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} disabled={saving} />
              </label>
              <label className="dialog-span">
                训练目标
                <textarea rows={3} value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} disabled={saving} />
              </label>
              <label className="dialog-span">
                训练内容
                <textarea rows={14} value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} disabled={saving} />
              </label>
              <label className="dialog-span">
                训练备注
                <textarea rows={4} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} disabled={saving} />
              </label>
            </div>
          </>
        )}
        {requestId ? <p className="ai-training-progress">AI 正在编排训练结构、负荷与安全要求，请稍候…</p> : null}
        {error ? <p className="dialog-error">{error}</p> : null}
        <div className="dialog-actions">
          {draft ? (
            <button type="button" className="btn" disabled={saving} onClick={() => { setDraft(null); setError(null) }}>
              重新设置
            </button>
          ) : <span />}
          <div className="dialog-actions-right">
            {requestId ? (
              <button type="button" className="btn" onClick={() => void cancelGeneration()}>
                取消生成
              </button>
            ) : (
              <button type="button" className="btn" onClick={onClose} disabled={saving}>
                关闭
              </button>
            )}
            {!draft ? (
              <button type="button" className="btn btn-primary" onClick={() => void generate()} disabled={busy}>
                {requestId ? '生成中…' : '生成 AI 草稿'}
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving}>
                {saving ? '保存中…' : '保存训练计划'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
