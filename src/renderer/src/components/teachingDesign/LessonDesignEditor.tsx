import { useMemo, useState } from 'react'
import { LESSON_PART_LABELS, stageRuleForGrade, type LessonPartId } from '@shared/curriculum'
import { checkLessonCompliance, parseTeachingDesign, type LessonDesign, type LessonLoad, type LessonSegment } from '@shared/teachingDesign'
import CompliancePanel from './CompliancePanel'

const PARTS: LessonPartId[] = ['opening', 'warmup', 'main', 'closing']

function Area({ value, onChange, rows = 2, placeholder }: { value: string; onChange: (value: string) => void; rows?: number; placeholder?: string }): React.JSX.Element {
  const lines = Math.max(rows, Math.min(14, value.split('\n').length + Math.floor(value.length / 40)))
  return <textarea className="td-area" rows={lines} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
}

function numberOrNull(value: string): number | null {
  if (value.trim() === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

interface Props {
  lesson: LessonDesign
  busy: boolean
  onSave: (lesson: LessonDesign) => Promise<void>
  onClose: () => void
  onExport: () => Promise<void>
  onRegenerate: (() => Promise<void>) | null
}

export default function LessonDesignEditor({ lesson, busy, onSave, onClose, onExport, onRegenerate }: Props): React.JSX.Element {
  const [draft, setDraft] = useState<LessonDesign>(lesson)
  const [error, setError] = useState<string | null>(null)
  const dirty = JSON.stringify(draft) !== JSON.stringify(lesson)
  const issues = useMemo(() => checkLessonCompliance(draft), [draft])
  const rule = stageRuleForGrade(draft.grade)
  const senior = rule.stage === 'senior'
  const totalMinutes = draft.segments.reduce((sum, segment) => sum + segment.minutes, 0)

  function set<K extends keyof LessonDesign>(key: K, value: LessonDesign[K]): void {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function setSegment(index: number, patch: Partial<LessonSegment>): void {
    setDraft((current) => ({ ...current, segments: current.segments.map((segment, position) => (position === index ? { ...segment, ...patch } : segment)) }))
  }

  function setLoad(patch: Partial<LessonLoad>): void {
    setDraft((current) => ({ ...current, load: { ...current.load, ...patch } }))
  }

  function addSegment(part: LessonPartId): void {
    setDraft((current) => {
      const lastIndex = current.segments.map((segment) => segment.part).lastIndexOf(part)
      const insertAt = lastIndex >= 0 ? lastIndex + 1 : current.segments.filter((segment) => PARTS.indexOf(segment.part) < PARTS.indexOf(part)).length
      const segments = [...current.segments]
      segments.splice(insertAt, 0, { part, minutes: 0, goal: '', content: '', teacherActivities: '', studentActivities: '', organization: '', requirements: '' })
      return { ...current, segments }
    })
  }

  function removeSegment(index: number): void {
    setDraft((current) => ({ ...current, segments: current.segments.filter((_segment, position) => position !== index) }))
  }

  async function save(): Promise<void> {
    setError(null)
    try {
      const parsed = parseTeachingDesign({ ...draft, updatedAt: new Date().toISOString() }) as LessonDesign
      await onSave(parsed)
      setDraft(parsed)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败')
    }
  }

  function close(): void {
    if (dirty && !window.confirm('课时教案有未保存修改，确定返回？')) return
    onClose()
  }

  return (
    <div className="td-lesson">
      <div className="td-toolbar">
        <button type="button" className="btn" onClick={close} disabled={busy}>
          返回
        </button>
        <span className="td-toolbar-title">{dirty ? '有未保存修改' : draft.generation ? `AI 生成：${draft.generation.provider} · ${draft.generation.model}` : '手动编写'}</span>
        <div className="table-actions">
          {onRegenerate ? (
            <button type="button" className="btn" disabled={busy || dirty} title={dirty ? '请先保存或放弃修改' : ''} onClick={() => void onRegenerate()}>
              AI 重新生成
            </button>
          ) : null}
          <button type="button" className="btn" disabled={busy || dirty} title={dirty ? '请先保存' : ''} onClick={() => void onExport()}>
            导出 Word
          </button>
          <button type="button" className="btn btn-primary" disabled={busy || !dirty} onClick={() => void save()}>
            保存教案
          </button>
        </div>
      </div>
      {error ? <p className="page-error">{error}</p> : null}

      <div className="td-sheet">
        <input className="td-sheet-title" value={draft.title} onChange={(event) => set('title', event.target.value)} aria-label="课题" />
        <div className="td-sheet-header">
          <span>课次：第{draft.lessonNo ?? '_'}课时</span>
          <span>年级：{draft.grade}</span>
          <label>
            人数：男
            <input inputMode="numeric" value={draft.maleCount ?? ''} onChange={(event) => set('maleCount', numberOrNull(event.target.value))} />
            人、女
            <input inputMode="numeric" value={draft.femaleCount ?? ''} onChange={(event) => set('femaleCount', numberOrNull(event.target.value))} />人
          </label>
          <span className={totalMinutes === draft.lessonMinutes ? '' : 'td-bad'}>
            时间：{draft.lessonMinutes}分钟{totalMinutes === draft.lessonMinutes ? '' : `（各部分合计 ${totalMinutes}）`}
          </span>
        </div>
        <table className="td-table">
          <colgroup>
            <col style={{ width: '8%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '19%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '21%' }} />
          </colgroup>
          <tbody>
            <tr>
              <th>教学目标</th>
              <td colSpan={6}>
                <label className="td-objective">
                  1.运动能力：
                  <Area value={draft.objectives.sportAbility} onChange={(value) => set('objectives', { ...draft.objectives, sportAbility: value })} />
                </label>
                <label className="td-objective">
                  2.健康行为：
                  <Area value={draft.objectives.healthBehavior} onChange={(value) => set('objectives', { ...draft.objectives, healthBehavior: value })} />
                </label>
                <label className="td-objective">
                  3.体育品德：
                  <Area value={draft.objectives.sportsMorality} onChange={(value) => set('objectives', { ...draft.objectives, sportsMorality: value })} />
                </label>
              </td>
            </tr>
            <tr>
              <th>教学内容</th>
              <td colSpan={3}>
                <Area value={draft.content} onChange={(value) => set('content', value)} />
              </td>
              <th>{senior ? '安全防范措施' : '安全预案'}</th>
              <td colSpan={2}>
                <Area value={draft.safetyPlan} onChange={(value) => set('safetyPlan', value)} />
              </td>
            </tr>
            <tr>
              <th>重点</th>
              <td colSpan={3}>
                <Area value={draft.keyPoint} onChange={(value) => set('keyPoint', value)} />
              </td>
              <th>难点</th>
              <td colSpan={2}>
                <Area value={draft.difficulty} onChange={(value) => set('difficulty', value)} />
              </td>
            </tr>
            <tr>
              <th>教学流程</th>
              <td colSpan={6}>
                <Area value={draft.flow} onChange={(value) => set('flow', value)} rows={1} />
              </td>
            </tr>
            <tr className="td-head">
              <th>顺序</th>
              <th>时间</th>
              <th>达成目标</th>
              <th>教学内容</th>
              <th>教师活动</th>
              <th>学生活动</th>
              <th>组织方法与学练要求</th>
            </tr>
            {draft.segments.map((segment, index) => {
              const first = index === 0 || draft.segments[index - 1].part !== segment.part
              const span = first ? draft.segments.slice(index).findIndex((item) => item.part !== segment.part) : 0
              const rowSpan = span === -1 ? draft.segments.length - index : span
              return (
                <tr key={index}>
                  {first ? (
                    <th rowSpan={rowSpan}>
                      {LESSON_PART_LABELS[segment.part]}
                      <button type="button" className="td-link" onClick={() => addSegment(segment.part)}>
                        + 分段
                      </button>
                    </th>
                  ) : null}
                  <td>
                    <input
                      className="td-minutes"
                      inputMode="numeric"
                      value={segment.minutes}
                      onChange={(event) => setSegment(index, { minutes: Math.max(0, Math.round(Number(event.target.value) || 0)) })}
                    />
                    分钟
                    {draft.segments.filter((item) => item.part === segment.part).length > 1 ? (
                      <button type="button" className="td-link td-danger" onClick={() => removeSegment(index)}>
                        删除
                      </button>
                    ) : null}
                  </td>
                  <td>
                    <Area value={segment.goal} onChange={(value) => setSegment(index, { goal: value })} />
                  </td>
                  <td>
                    <Area value={segment.content} onChange={(value) => setSegment(index, { content: value })} />
                  </td>
                  <td>
                    <Area value={segment.teacherActivities} onChange={(value) => setSegment(index, { teacherActivities: value })} />
                  </td>
                  <td>
                    <Area value={segment.studentActivities} onChange={(value) => setSegment(index, { studentActivities: value })} />
                  </td>
                  <td>
                    <span className="td-label">组织：</span>
                    <Area value={segment.organization} onChange={(value) => setSegment(index, { organization: value })} />
                    <span className="td-label">要求：</span>
                    <Area value={segment.requirements} onChange={(value) => setSegment(index, { requirements: value })} />
                  </td>
                </tr>
              )
            })}
            <tr>
              <th>预计运动负荷</th>
              <td colSpan={6}>
                <div className="td-load">
                  {(
                    [
                      ['groupDensityPct', `群体运动密度（≥${rule.load.groupDensityMinPct}%）`],
                      ['individualDensityPct', `个体运动密度（≥${rule.load.individualDensityMinPct}%）`],
                      ['avgHeartRate', `平均心率（${rule.load.heartRateMin}～${rule.load.heartRateMax}）`],
                      ['peakHeartRate', '最高心率'],
                      ['fitnessMinutes', `体能练习（约${rule.load.fitnessMinutesTarget}分钟）`]
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input inputMode="numeric" value={draft.load[key] ?? ''} onChange={(event) => setLoad({ [key]: numberOrNull(event.target.value) })} />
                    </label>
                  ))}
                </div>
                <Area value={draft.load.note} onChange={(value) => setLoad({ note: value })} rows={1} placeholder="强度变化说明（选填）" />
              </td>
            </tr>
            <tr>
              <th>场地器材</th>
              <td colSpan={6}>
                <Area value={draft.venueEquipment} onChange={(value) => set('venueEquipment', value)} rows={1} />
              </td>
            </tr>
            <tr>
              <th>教学反思</th>
              <td colSpan={6}>
                <Area value={draft.reflection} onChange={(value) => set('reflection', value)} rows={1} placeholder="课后填写（选填）" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <CompliancePanel issues={issues} standardTitle={rule.standard.title} />
    </div>
  )
}
