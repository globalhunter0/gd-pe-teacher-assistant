import { useMemo, useState } from 'react'
import {
  PLAN_DURATION_MAX,
  PLAN_DURATION_MIN,
  PLAN_SESSIONS_PER_WEEK_MAX,
  PLAN_WEEKS_MAX,
  SCHOOL_STAGE_LABELS,
  SCHOOL_STAGES,
  SPORT_PROGRAM_FAMILIES,
  SPORT_PROGRAMS,
  TRAINING_FOCUS_LABELS,
  TRAINING_LEVEL_HINTS,
  TRAINING_LEVEL_LABELS,
  TRAINING_LEVELS,
  TRAINING_PHASE_LABELS,
  TRAINING_PLAN_REFERENCES,
  TRAINING_SPORT_LABELS,
  createTrainingPlanId,
  defaultSportProgramId,
  formatTrainingDate,
  generateTrainingBlock,
  getSportProgram,
  type GeneratedTrainingPlan,
  type SchoolStage,
  type TrainingLevel,
  type TrainingPlan,
  type TrainingTeam
} from '@shared/trainingTeam'

function range(max: number): number[] {
  return Array.from({ length: max }, (_, index) => index + 1)
}

export default function SportPlanGenerator({
  team,
  onSave
}: {
  team: TrainingTeam
  onSave: (plans: TrainingPlan[]) => Promise<void>
}): React.JSX.Element {
  const [stage, setStage] = useState<SchoolStage>('junior')
  const [programId, setProgramId] = useState(() => defaultSportProgramId(team.sport))
  const [level, setLevel] = useState<TrainingLevel>('basic')
  const [durationInput, setDurationInput] = useState('90')
  const [weeks, setWeeks] = useState(4)
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3)
  const [startDate, setStartDate] = useState(formatTrainingDate(new Date()))
  const [blockId, setBlockId] = useState(() => `training-block-${crypto.randomUUID()}`)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const program = getSportProgram(programId) ?? SPORT_PROGRAMS[0]
  const duration = Number(durationInput)

  const generated = useMemo((): { plans: GeneratedTrainingPlan[]; error: string | null } => {
    try {
      return {
        plans: generateTrainingBlock({
          stage,
          programId: program.id,
          level,
          durationMinutes: duration,
          weeks,
          sessionsPerWeek,
          startDate,
          blockId
        }),
        error: null
      }
    } catch (generateError) {
      return { plans: [], error: generateError instanceof Error ? generateError.message : '无法生成训练计划' }
    }
  }, [stage, program.id, level, duration, weeks, sessionsPerWeek, startDate, blockId])

  const preview = generated.plans[Math.min(previewIndex, generated.plans.length - 1)]
  const teamSportDiffers = program.sport !== team.sport && team.sport !== 'other'

  async function handleSave(): Promise<void> {
    if (generated.plans.length === 0) {
      return
    }
    setSaving(true)
    setError(null)
    const now = new Date().toISOString()
    try {
      await onSave(
        generated.plans.map((item) => ({
          id: createTrainingPlanId(),
          trainingTeamId: team.id,
          date: item.date,
          title: item.title,
          goal: item.goal,
          content: item.content,
          notes: item.notes,
          status: 'planned',
          blueprint: item.blueprint,
          createdAt: now,
          updatedAt: now
        }))
      )
      setBlockId(`training-block-${crypto.randomUUID()}`)
      setPreviewIndex(0)
      setSaving(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存训练计划失败')
      setSaving(false)
    }
  }

  return (
    <section className="sport-plan-generator">
      <div className="sport-plan-generator-head">
        <h4>按项目生成周期训练计划</h4>
        <p>
          设定单次时长、周期和每周次数，生成一组前后衔接的训练课。每节课包含 RAMP 热身、速度与爆发、专项技术、专项应用、力量与动作能力、能量系统和整理恢复，并按时长分配时间。周与周之间按适应、发展、强化、减量递进；周期达到4周时，首课和减量周首课会安排测评。
        </p>
      </div>
      <div className="sport-plan-generator-grid">
        <label>
          学段
          <select value={stage} onChange={(event) => setStage(event.target.value as SchoolStage)}>
            {SCHOOL_STAGES.map((item) => (
              <option key={item} value={item}>
                {SCHOOL_STAGE_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          项目
          <select value={program.id} onChange={(event) => setProgramId(event.target.value)}>
            {SPORT_PROGRAM_FAMILIES.map((family) => (
              <optgroup key={family} label={family}>
                {SPORT_PROGRAMS.filter((item) => item.family === family).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          水平
          <select value={level} onChange={(event) => setLevel(event.target.value as TrainingLevel)}>
            {TRAINING_LEVELS.map((item) => (
              <option key={item} value={item}>
                {TRAINING_LEVEL_LABELS[item]}
              </option>
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
          />
        </label>
        <label>
          周期（周）
          <select value={weeks} onChange={(event) => setWeeks(Number(event.target.value))}>
            {range(PLAN_WEEKS_MAX).map((item) => (
              <option key={item} value={item}>
                {item}周
              </option>
            ))}
          </select>
        </label>
        <label>
          每周次数
          <select value={sessionsPerWeek} onChange={(event) => setSessionsPerWeek(Number(event.target.value))}>
            {range(PLAN_SESSIONS_PER_WEEK_MAX).map((item) => (
              <option key={item} value={item}>
                {item}次
              </option>
            ))}
          </select>
        </label>
        <label>
          开始日期
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
      </div>
      <p className="sport-plan-hint">{`${TRAINING_LEVEL_HINTS[level]} ${program.summary}`}</p>
      {teamSportDiffers ? (
        <div className="sport-plan-hint sport-plan-mismatch">
          <span>当前队伍是{TRAINING_SPORT_LABELS[team.sport]}，这份计划来自{program.name}。保存后仍记在本队。</span>
          <button type="button" className="btn btn-small" onClick={() => setProgramId(defaultSportProgramId(team.sport))}>
            改用本队项目
          </button>
        </div>
      ) : null}
      {generated.error ? <p className="dialog-error">{generated.error}</p> : null}
      {preview ? (
        <div className="sport-plan-body">
          <ol className="sport-plan-sessions" aria-label="课次列表">
            {generated.plans.map((item, index) => (
              <li key={`${item.blueprint.week}-${item.blueprint.session}`}>
                <button
                  type="button"
                  aria-pressed={item === preview}
                  onClick={() => setPreviewIndex(index)}
                >
                  <strong>
                    第{item.blueprint.week}周第{item.blueprint.session}课 · {item.date}
                  </strong>
                  <small>
                    {item.blueprint.phase ? TRAINING_PHASE_LABELS[item.blueprint.phase] : ''} ·{' '}
                    {item.blueprint.focus ? TRAINING_FOCUS_LABELS[item.blueprint.focus] : ''}
                  </small>
                </button>
              </li>
            ))}
          </ol>
          <div className="sport-plan-preview">
            <strong>{preview.title}</strong>
            <p>{preview.goal}</p>
            <div>{preview.content}</div>
            <p className="sport-plan-preview-notes">{preview.notes}</p>
          </div>
        </div>
      ) : null}
      <details className="sport-plan-references">
        <summary>编写依据</summary>
        <p>以下资料的训练原则用于编排课次结构、负荷与递进；生成内容不是书中原文，请结合队员实际调整。</p>
        <ul>
          {TRAINING_PLAN_REFERENCES.map((item) => (
            <li key={item.title}>
              {item.title}：{item.use}
            </li>
          ))}
        </ul>
      </details>
      {error ? <p className="dialog-error">{error}</p> : null}
      <div className="sport-plan-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void handleSave()}
          disabled={saving || generated.plans.length === 0}
        >
          {saving ? '保存中…' : `保存 ${generated.plans.length} 条训练计划`}
        </button>
      </div>
    </section>
  )
}
