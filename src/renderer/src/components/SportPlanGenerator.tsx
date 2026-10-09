import { useMemo, useState } from 'react'
import {
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
  generateBasicTrainingPlan,
  getSportProgram,
  type SchoolStage,
  type TrainingLevel,
  type TrainingPlan,
  type TrainingTeam
} from '@shared/trainingTeam'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export default function SportPlanGenerator({
  team,
  onSave
}: {
  team: TrainingTeam
  onSave: (plan: TrainingPlan) => Promise<void>
}): React.JSX.Element {
  const [stage, setStage] = useState<SchoolStage>('junior')
  const [programId, setProgramId] = useState(() => defaultSportProgramId(team.sport))
  const [level, setLevel] = useState<TrainingLevel>('basic')
  const [date, setDate] = useState(formatTrainingDate(new Date()))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const program = getSportProgram(programId) ?? SPORT_PROGRAMS[0]
  const draft = useMemo(
    () => generateBasicTrainingPlan({ stage, programId: program.id, level }),
    [stage, program.id, level]
  )
  const teamSportDiffers = program.sport !== team.sport && team.sport !== 'other'

  async function handleSave(): Promise<void> {
    if (!DATE_PATTERN.test(date)) {
      setError('请选择训练日期')
      return
    }
    setSaving(true)
    setError(null)
    const now = new Date().toISOString()
    try {
      await onSave({
        id: createTrainingPlanId(),
        trainingTeamId: team.id,
        date,
        title: draft.title,
        goal: draft.goal,
        content: draft.content,
        notes: draft.notes,
        status: 'planned',
        blueprint: draft.blueprint,
        createdAt: now,
        updatedAt: now
      })
      setSaving(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存训练计划失败')
      setSaving(false)
    }
  }

  return (
    <section className="sport-plan-generator">
      <div className="sport-plan-generator-head">
        <h4>按项目生成基础计划</h4>
        <p>
          给同时带多个项目的教练：选学段、项目和水平，生成一节可以直接上课的基础课。保存后仍可按本队人数、场地和当天状态修改。
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
          训练日期
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
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
      <div className="sport-plan-preview">
        <strong>{draft.title}</strong>
        <p>{draft.goal}</p>
        <div>{draft.content}</div>
      </div>
      {error ? <p className="dialog-error">{error}</p> : null}
      <div className="sport-plan-actions">
        <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
          {saving ? '保存中…' : '保存为训练计划'}
        </button>
      </div>
    </section>
  )
}
