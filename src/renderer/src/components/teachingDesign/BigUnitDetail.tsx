import { useEffect, useMemo, useState } from 'react'
import { editionLabel, findContentCategory, findEdition, stageRuleForGrade } from '@shared/curriculum'
import {
  checkBigUnitCompliance,
  checkLessonCompliance,
  checkUnitCompliance,
  countIssues,
  parseTeachingDesign,
  type BigUnitDesign,
  type CompetencyObjectives,
  type LessonDesign,
  type UnitDesign
} from '@shared/teachingDesign'
import CompliancePanel from './CompliancePanel'

interface Props {
  bigUnit: BigUnitDesign
  units: UnitDesign[]
  lessons: LessonDesign[]
  busy: boolean
  onBack: () => void
  onSave: (bigUnit: BigUnitDesign) => Promise<void>
  onSaveUnit: (unit: UnitDesign) => Promise<void>
  onGenerateBigUnit: () => Promise<void>
  onGenerateUnits: () => Promise<void>
  onGenerateLessons: (lessonNos: number[], counts: { maleCount: number | null; femaleCount: number | null }) => Promise<void>
  onOpenLesson: (lessonId: string) => void
  onExport: () => Promise<void>
}

function ObjectiveFields({ value, onChange }: { value: CompetencyObjectives; onChange: (value: CompetencyObjectives) => void }): React.JSX.Element {
  return (
    <>
      <label className="plan-meta-span">
        学习目标 · 运动能力
        <textarea rows={2} value={value.sportAbility} onChange={(event) => onChange({ ...value, sportAbility: event.target.value })} />
      </label>
      <label className="plan-meta-span">
        学习目标 · 健康行为
        <textarea rows={2} value={value.healthBehavior} onChange={(event) => onChange({ ...value, healthBehavior: event.target.value })} />
      </label>
      <label className="plan-meta-span">
        学习目标 · 体育品德
        <textarea rows={2} value={value.sportsMorality} onChange={(event) => onChange({ ...value, sportsMorality: event.target.value })} />
      </label>
    </>
  )
}

function countValue(value: string): number | null {
  const num = Number(value)
  return value.trim() !== '' && Number.isInteger(num) && num >= 0 ? num : null
}

export default function BigUnitDetail(props: Props): React.JSX.Element {
  const { bigUnit, units, lessons, busy } = props
  const [draft, setDraft] = useState<BigUnitDesign>(bigUnit)
  const [error, setError] = useState<string | null>(null)
  const [maleCount, setMaleCount] = useState('')
  const [femaleCount, setFemaleCount] = useState('')
  const [editingUnit, setEditingUnit] = useState<UnitDesign | null>(null)

  useEffect(() => {
    setDraft(bigUnit)
  }, [bigUnit])

  const dirty = JSON.stringify(draft) !== JSON.stringify(bigUnit)
  const rule = stageRuleForGrade(draft.grade)
  const issues = useMemo(() => checkBigUnitCompliance(draft), [draft])
  const edition = findEdition(draft.editionId)
  const category = findContentCategory(draft.categoryId)
  const lessonByNo = new Map(lessons.map((lesson) => [lesson.lessonNo, lesson]))
  const missing = Array.from({ length: bigUnit.totalLessons }, (_, index) => index + 1).filter((no) => !lessonByNo.has(no))
  const counts = { maleCount: countValue(maleCount), femaleCount: countValue(femaleCount) }

  function set<K extends keyof BigUnitDesign>(key: K, value: BigUnitDesign[K]): void {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function guarded(action: () => Promise<void>): Promise<void> {
    setError(null)
    try {
      await action()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '操作失败')
    }
  }

  async function save(): Promise<void> {
    await guarded(async () => {
      const parsed = parseTeachingDesign({ ...draft, updatedAt: new Date().toISOString() }) as BigUnitDesign
      await props.onSave(parsed)
    })
  }

  function unitForLesson(no: number): UnitDesign | null {
    return units.find((unit) => no >= unit.lessonFrom && no <= unit.lessonTo) ?? null
  }

  function back(): void {
    if (dirty && !window.confirm('大单元有未保存修改，确定返回？')) return
    props.onBack()
  }

  return (
    <div className="td-detail">
      <div className="td-toolbar">
        <button type="button" className="btn" onClick={back} disabled={busy}>
          返回列表
        </button>
        <span className="td-toolbar-title">
          {draft.grade} · {category?.name} · {draft.sportItem} · {draft.totalLessons} 课时
          {edition ? ` · ${editionLabel(edition)}` : ''}
        </span>
        <div className="table-actions">
          <button
            type="button"
            className="btn"
            disabled={busy || dirty}
            title={dirty ? '请先保存' : ''}
            onClick={() => void guarded(async () => {
              if (bigUnit.generation || bigUnit.guidingIdeas) {
                if (!window.confirm('重新生成会覆盖当前大单元内容（单元与教案保留），确定继续？')) return
              }
              await props.onGenerateBigUnit()
            })}
          >
            AI 生成大单元计划
          </button>
          <button type="button" className="btn" disabled={busy || dirty} onClick={() => void guarded(props.onExport)}>
            导出 Word
          </button>
          <button type="button" className="btn btn-primary" disabled={busy || !dirty} onClick={() => void save()}>
            保存大单元
          </button>
        </div>
      </div>
      {error ? <p className="page-error">{error}</p> : null}

      <section className="plan-meta">
        <label className="plan-meta-span">
          名称
          <input value={draft.title} onChange={(event) => set('title', event.target.value)} />
        </label>
        <label className="plan-meta-span">
          学情、场地器材与补充要求
          <textarea rows={2} value={draft.notes} onChange={(event) => set('notes', event.target.value)} />
        </label>
        <label className="plan-meta-span">
          指导思想
          <textarea rows={3} value={draft.guidingIdeas} onChange={(event) => set('guidingIdeas', event.target.value)} />
        </label>
        <label className="plan-meta-span">
          学情分析
          <textarea rows={3} value={draft.learnerAnalysis} onChange={(event) => set('learnerAnalysis', event.target.value)} />
        </label>
        <label className="plan-meta-span">
          教材分析
          <textarea rows={3} value={draft.contentAnalysis} onChange={(event) => set('contentAnalysis', event.target.value)} />
        </label>
        <ObjectiveFields value={draft.objectives} onChange={(value) => set('objectives', value)} />
        <label className="plan-meta-span">
          教学重点
          <textarea rows={2} value={draft.keyPoints} onChange={(event) => set('keyPoints', event.target.value)} />
        </label>
        <label className="plan-meta-span">
          教学难点
          <textarea rows={2} value={draft.difficulties} onChange={(event) => set('difficulties', event.target.value)} />
        </label>
        <label className="plan-meta-span">
          学习评价
          <textarea rows={3} value={draft.assessment} onChange={(event) => set('assessment', event.target.value)} />
        </label>
        <label className="plan-meta-span">
          安全保障
          <textarea rows={2} value={draft.safety} onChange={(event) => set('safety', event.target.value)} />
        </label>
        <div className="plan-meta-span td-outline">
          <span className="td-label">单元划分</span>
          {draft.unitOutline.map((item, index) => (
            <div key={index} className="td-outline-row">
              <input
                value={item.title}
                onChange={(event) => set('unitOutline', draft.unitOutline.map((entry, position) => (position === index ? { ...entry, title: event.target.value } : entry)))}
              />
              <span>第</span>
              <input
                className="td-minutes"
                inputMode="numeric"
                value={item.lessonFrom}
                onChange={(event) => set('unitOutline', draft.unitOutline.map((entry, position) => (position === index ? { ...entry, lessonFrom: Number(event.target.value) || 1 } : entry)))}
              />
              <span>～</span>
              <input
                className="td-minutes"
                inputMode="numeric"
                value={item.lessonTo}
                onChange={(event) => set('unitOutline', draft.unitOutline.map((entry, position) => (position === index ? { ...entry, lessonTo: Number(event.target.value) || 1 } : entry)))}
              />
              <span>课时</span>
              <input
                className="td-grow"
                value={item.focus}
                placeholder="单元重点"
                onChange={(event) => set('unitOutline', draft.unitOutline.map((entry, position) => (position === index ? { ...entry, focus: event.target.value } : entry)))}
              />
              <button type="button" className="td-link td-danger" onClick={() => set('unitOutline', draft.unitOutline.filter((_entry, position) => position !== index))}>
                删除
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-small"
            onClick={() => {
              const last = draft.unitOutline[draft.unitOutline.length - 1]
              const from = last ? Math.min(draft.totalLessons, last.lessonTo + 1) : 1
              set('unitOutline', [...draft.unitOutline, { title: `单元${draft.unitOutline.length + 1}`, lessonFrom: from, lessonTo: draft.totalLessons, focus: '' }])
            }}
          >
            + 添加单元
          </button>
        </div>
      </section>

      <CompliancePanel issues={issues} standardTitle={rule.standard.title} />

      <section className="td-section">
        <div className="td-section-head">
          <h3>单元教学计划（{units.length}/{bigUnit.unitOutline.length}）</h3>
          <button
            type="button"
            className="btn"
            disabled={busy || dirty || bigUnit.unitOutline.length === 0}
            title={bigUnit.unitOutline.length === 0 ? '请先生成或填写单元划分' : dirty ? '请先保存大单元' : ''}
            onClick={() => void guarded(async () => {
              if (units.length > 0 && !window.confirm('重新生成会覆盖已有单元计划（课时教案保留），确定继续？')) return
              await props.onGenerateUnits()
            })}
          >
            AI 生成单元计划
          </button>
        </div>
        {units.length === 0 ? <p className="td-hint">保存单元划分后，可一键生成各单元的教学计划和课次安排。</p> : null}
        {units.map((unit) => {
          const unitIssues = checkUnitCompliance(unit, bigUnit)
          const unitCount = countIssues(unitIssues)
          return (
            <article key={unit.id} className="td-unit">
              <div className="td-section-head">
                <h4>
                  {unit.title}（第{unit.lessonFrom}～{unit.lessonTo}课时）
                  {unitCount.errors > 0 ? <span className="status-badge status-badge--danger">{unitCount.errors} 项不符合</span> : null}
                </h4>
                <button type="button" className="btn btn-small" disabled={busy} onClick={() => setEditingUnit(unit)}>
                  编辑
                </button>
              </div>
              <p className="td-unit-meta">
                重点：{unit.keyPoints || '—'}；难点：{unit.difficulties || '—'}
              </p>
              <table className="data-table td-schedule">
                <thead>
                  <tr>
                    <th>课次</th>
                    <th>课题</th>
                    <th>主要学习内容</th>
                    <th>练习与比赛</th>
                    <th>评价要点</th>
                  </tr>
                </thead>
                <tbody>
                  {unit.lessonSchedule.map((item) => (
                    <tr key={item.lessonNo}>
                      <td>第{item.lessonNo}课时</td>
                      <td>{item.topic}</td>
                      <td>{item.content}</td>
                      <td>{item.practiceAndCompetition}</td>
                      <td>{item.assessment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          )
        })}
      </section>

      <section className="td-section">
        <div className="td-section-head">
          <h3>
            课时教案（{lessons.length}/{bigUnit.totalLessons}）
          </h3>
          <div className="table-actions">
            <label className="td-inline">
              男
              <input className="td-minutes" inputMode="numeric" value={maleCount} onChange={(event) => setMaleCount(event.target.value)} />
            </label>
            <label className="td-inline">
              女
              <input className="td-minutes" inputMode="numeric" value={femaleCount} onChange={(event) => setFemaleCount(event.target.value)} />
            </label>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || dirty || missing.length === 0}
              onClick={() => void guarded(() => props.onGenerateLessons(missing, counts))}
            >
              批量生成未完成的 {missing.length} 节教案
            </button>
          </div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>课次</th>
                <th>所属单元</th>
                <th>课题</th>
                <th>课标检查</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: bigUnit.totalLessons }, (_, index) => index + 1).map((no) => {
                const lesson = lessonByNo.get(no)
                const unit = unitForLesson(no)
                const lessonCount = lesson ? countIssues(checkLessonCompliance(lesson)) : null
                return (
                  <tr key={no}>
                    <td>第{no}课时</td>
                    <td>{unit?.title ?? '—'}</td>
                    <td>{lesson ? lesson.title : unit?.lessonSchedule.find((item) => item.lessonNo === no)?.topic ?? '未生成'}</td>
                    <td>
                      {lessonCount === null ? (
                        '—'
                      ) : lessonCount.errors > 0 ? (
                        <span className="status-badge status-badge--danger">{lessonCount.errors} 项不符合</span>
                      ) : lessonCount.warnings > 0 ? (
                        <span className="status-badge status-badge--warn">{lessonCount.warnings} 项提醒</span>
                      ) : (
                        <span className="status-badge status-badge--ok">符合</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        {lesson ? (
                          <button type="button" className="btn btn-small" disabled={busy} onClick={() => props.onOpenLesson(lesson.id)}>
                            打开
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="btn btn-small"
                          disabled={busy || dirty}
                          onClick={() => void guarded(async () => {
                            if (lesson && !window.confirm(`重新生成会覆盖第${no}课时教案，确定继续？`)) return
                            await props.onGenerateLessons([no], counts)
                          })}
                        >
                          {lesson ? '重新生成' : 'AI 生成'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {editingUnit ? (
        <UnitEditDialog
          unit={editingUnit}
          busy={busy}
          onClose={() => setEditingUnit(null)}
          onSave={async (unit) => {
            await props.onSaveUnit(unit)
            setEditingUnit(null)
          }}
        />
      ) : null}
    </div>
  )
}

function UnitEditDialog({
  unit,
  busy,
  onClose,
  onSave
}: {
  unit: UnitDesign
  busy: boolean
  onClose: () => void
  onSave: (unit: UnitDesign) => Promise<void>
}): React.JSX.Element {
  const [draft, setDraft] = useState<UnitDesign>(unit)
  const [error, setError] = useState<string | null>(null)

  async function save(): Promise<void> {
    setError(null)
    try {
      await onSave(parseTeachingDesign({ ...draft, updatedAt: new Date().toISOString() }) as UnitDesign)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败')
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div className="dialog dialog--td-unit" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <h3>编辑单元教学计划</h3>
        <div className="plan-meta td-unit-form">
          <label className="plan-meta-span">
            单元名称
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          </label>
          <ObjectiveFields value={draft.objectives} onChange={(value) => setDraft({ ...draft, objectives: value })} />
          <label className="plan-meta-span">
            重点
            <textarea rows={2} value={draft.keyPoints} onChange={(event) => setDraft({ ...draft, keyPoints: event.target.value })} />
          </label>
          <label className="plan-meta-span">
            难点
            <textarea rows={2} value={draft.difficulties} onChange={(event) => setDraft({ ...draft, difficulties: event.target.value })} />
          </label>
          <label className="plan-meta-span">
            评价
            <textarea rows={2} value={draft.assessment} onChange={(event) => setDraft({ ...draft, assessment: event.target.value })} />
          </label>
          {draft.lessonSchedule.map((item, index) => (
            <fieldset key={item.lessonNo} className="plan-meta-span td-schedule-edit">
              <legend>第{item.lessonNo}课时</legend>
              {(
                [
                  ['topic', '课题'],
                  ['content', '主要学习内容'],
                  ['practiceAndCompetition', '练习与比赛'],
                  ['assessment', '评价要点']
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <textarea
                    rows={key === 'topic' ? 1 : 2}
                    value={item[key]}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        lessonSchedule: draft.lessonSchedule.map((entry, position) => (position === index ? { ...entry, [key]: event.target.value } : entry))
                      })
                    }
                  />
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        {error ? <p className="dialog-error">{error}</p> : null}
        <div className="dialog-actions">
          <span />
          <div className="dialog-actions-right">
            <button type="button" className="btn" onClick={onClose} disabled={busy}>
              取消
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={busy}>
              保存单元
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
