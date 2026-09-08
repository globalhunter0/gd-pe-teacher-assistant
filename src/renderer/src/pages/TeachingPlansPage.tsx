import { useEffect, useMemo, useRef, useState } from 'react'
import { GRADES, SEMESTERS, type Grade, type Semester } from '@shared/class'
import {
  MAX_PLAN_WEEKS,
  createTeachingPlanWeekId,
  parseTeachingPlans,
  plansMatchingClassContext,
  renumberWeeks,
  type TeachingPlan,
  type TeachingPlanWeek
} from '@shared/teachingPlan'
import type { PlanNavContext } from './DashboardPage'
import TeachingPlanCreateDialog from '../components/TeachingPlanCreateDialog'
import TeachingPlanWeekDialog from '../components/TeachingPlanWeekDialog'
import { useTeachingPlans } from '../context/TeachingPlanContext'

function clonePlan(plan: TeachingPlan): TeachingPlan {
  return {
    ...plan,
    weeks: plan.weeks.map((week) => ({ ...week }))
  }
}

function weekPreview(week: TeachingPlanWeek): string {
  const text = week.title || week.contents
  if (!text) {
    return '尚未填写'
  }
  return text.length > 36 ? `${text.slice(0, 36)}…` : text
}

export default function TeachingPlansPage({ context = null }: { context?: PlanNavContext | null }): React.JSX.Element {
  const { plans, loading, error, upsertPlan, deletePlan, duplicatePlan } = useTeachingPlans()
  const [createOpen, setCreateOpen] = useState(false)
  const [openedId, setOpenedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<TeachingPlan | null>(null)
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TeachingPlan | null>(null)
  const [pendingWeekDeleteId, setPendingWeekDeleteId] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const autoOpenedKey = useRef<string | null>(null)

  const opened = useMemo(() => plans.find((item) => item.id === openedId) ?? null, [plans, openedId])
  const editingWeek = draft?.weeks.find((week) => week.id === editingWeekId) ?? null
  const pendingWeekDelete = draft?.weeks.find((week) => week.id === pendingWeekDeleteId) ?? null

  const dirty = Boolean(draft && opened && JSON.stringify(draft) !== JSON.stringify(clonePlan(opened)))
  const matchedPlans = useMemo(
    () => (context ? plansMatchingClassContext(plans, context) : []),
    [plans, context]
  )

  useEffect(() => {
    if (!context || loading) {
      return
    }
    const key = `${context.grade}|${context.academicYear}|${context.semester}`
    if (autoOpenedKey.current === key) {
      return
    }
    if (matchedPlans.length === 1) {
      autoOpenedKey.current = key
      const plan = matchedPlans[0]
      setOpenedId(plan.id)
      setDraft(clonePlan(plan))
    }
  }, [context, loading, matchedPlans])

  function openPlan(plan: TeachingPlan): void {
    setActionError(null)
    setOpenedId(plan.id)
    setDraft(clonePlan(plan))
  }

  function closePlan(): void {
    if (dirty && !window.confirm('当前计划有未保存修改，确定返回列表？')) {
      return
    }
    setOpenedId(null)
    setDraft(null)
    setEditingWeekId(null)
    setPendingWeekDeleteId(null)
  }

  async function handleCreate(plan: TeachingPlan): Promise<void> {
    await upsertPlan(plan)
    setCreateOpen(false)
    openPlan(plan)
  }

  async function handleSaveDraft(): Promise<void> {
    if (!draft) {
      return
    }

    setWorking(true)
    setActionError(null)
    try {
      const now = new Date().toISOString()
      const weeks = renumberWeeks(draft.weeks)
      const next: TeachingPlan = {
        ...draft,
        name: draft.name.trim(),
        academicYear: draft.academicYear.trim(),
        startDate: draft.startDate && draft.startDate.trim() !== '' ? draft.startDate.trim() : null,
        endDate: draft.endDate && draft.endDate.trim() !== '' ? draft.endDate.trim() : null,
        notes: draft.notes.trim(),
        totalWeeks: weeks.length,
        weeks,
        updatedAt: now
      }
      const [parsed] = parseTeachingPlans([next])
      await upsertPlan(parsed)
      setDraft(clonePlan(parsed))
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : '保存失败')
    } finally {
      setWorking(false)
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!pendingDelete) {
      return
    }

    setWorking(true)
    setActionError(null)
    try {
      await deletePlan(pendingDelete.id)
      if (openedId === pendingDelete.id) {
        setOpenedId(null)
        setDraft(null)
      }
      setPendingDelete(null)
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : '删除失败')
    } finally {
      setWorking(false)
    }
  }

  async function handleCopy(plan: TeachingPlan): Promise<void> {
    setWorking(true)
    setActionError(null)
    try {
      const copied = await duplicatePlan(plan.id)
      openPlan(copied)
    } catch (copyError) {
      setActionError(copyError instanceof Error ? copyError.message : '复制失败')
    } finally {
      setWorking(false)
    }
  }

  function addWeek(): void {
    if (!draft) {
      return
    }
    if (draft.weeks.length >= MAX_PLAN_WEEKS) {
      setActionError(`最多 ${MAX_PLAN_WEEKS} 周`)
      return
    }

    setDraft((current) => {
      if (!current || current.weeks.length >= MAX_PLAN_WEEKS) {
        return current
      }

      const weeks = renumberWeeks([
        ...current.weeks,
        {
          id: createTeachingPlanWeekId(),
          weekNumber: current.weeks.length + 1,
          title: '',
          contents: '',
          objectives: '',
          notes: ''
        }
      ])

      return { ...current, weeks, totalWeeks: weeks.length }
    })
  }

  function moveWeek(weekId: string, direction: -1 | 1): void {
    setDraft((current) => {
      if (!current) {
        return current
      }

      const index = current.weeks.findIndex((item) => item.id === weekId)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.weeks.length) {
        return current
      }

      const weeks = current.weeks.map((item) => ({ ...item }))
      const [moved] = weeks.splice(index, 1)
      weeks.splice(nextIndex, 0, moved)
      const numbered = renumberWeeks(weeks)
      return { ...current, weeks: numbered, totalWeeks: numbered.length }
    })
  }

  function applyWeek(week: TeachingPlanWeek): void {
    setDraft((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        weeks: current.weeks.map((item) => (item.id === week.id ? { ...week } : item))
      }
    })
    setEditingWeekId(null)
  }

  function confirmDeleteWeek(): void {
    if (!pendingWeekDeleteId) {
      return
    }

    setDraft((current) => {
      if (!current) {
        return current
      }
      if (current.weeks.length <= 1) {
        setActionError('至少保留一周安排')
        return current
      }

      const weeks = renumberWeeks(current.weeks.filter((item) => item.id !== pendingWeekDeleteId))
      return { ...current, weeks, totalWeeks: weeks.length }
    })
    setPendingWeekDeleteId(null)
  }

  if (loading) {
    return (
      <section className="page">
        <div className="page-heading">
          <h2>教学计划</h2>
          <p>正在读取本地教学计划…</p>
        </div>
      </section>
    )
  }

  if (draft) {
    return (
      <section className="page page--plans">
        <div className="page-heading page-heading--split">
          <div className="page-heading-text">
            <h2>教学计划详情</h2>
            <p>
              第 1～{draft.weeks.length} 周安排。这是计划教什么，不是实际上课完成情况。
              {dirty ? ' 当前有未保存修改。' : ''}
            </p>
          </div>
          <div className="page-actions">
            <button type="button" className="btn" onClick={closePlan}>
              返回列表
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void handleSaveDraft()} disabled={working}>
              保存本计划
            </button>
          </div>
        </div>

        {actionError ? <p className="page-error">{actionError}</p> : null}

        <div className="plan-meta">
          <label>
            计划名称 *
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </label>
          <label>
            年级 *
            <select value={draft.grade} onChange={(event) => setDraft({ ...draft, grade: event.target.value as Grade })}>
              {GRADES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            学期 *
            <select
              value={draft.semester}
              onChange={(event) => setDraft({ ...draft, semester: event.target.value as Semester })}
            >
              {SEMESTERS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            学年 *
            <input value={draft.academicYear} onChange={(event) => setDraft({ ...draft, academicYear: event.target.value })} />
          </label>
          <label>
            开始日期（可选）
            <input
              type="date"
              value={draft.startDate ?? ''}
              onChange={(event) => setDraft({ ...draft, startDate: event.target.value || null })}
            />
          </label>
          <label>
            结束日期（可选）
            <input
              type="date"
              value={draft.endDate ?? ''}
              onChange={(event) => setDraft({ ...draft, endDate: event.target.value || null })}
            />
          </label>
          <label className="plan-meta-span">
            备注
            <textarea rows={2} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
          </label>
        </div>

        <div className="plan-week-toolbar">
          <p className="plan-week-count">共 {draft.weeks.length} 周</p>
          <button type="button" className="btn" onClick={addWeek} disabled={draft.weeks.length >= MAX_PLAN_WEEKS}>
            + 新增一周
          </button>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>周次</th>
                <th>主题 / 标题</th>
                <th>教学内容摘要</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {draft.weeks.map((week, index) => (
                <tr key={week.id}>
                  <td>第 {week.weekNumber} 周</td>
                  <td>{week.title || '—'}</td>
                  <td>{weekPreview(week)}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn btn-small" onClick={() => setEditingWeekId(week.id)}>
                        编辑
                      </button>
                      <button type="button" className="btn btn-small" disabled={index === 0} onClick={() => moveWeek(week.id, -1)}>
                        上移
                      </button>
                      <button
                        type="button"
                        className="btn btn-small"
                        disabled={index === draft.weeks.length - 1}
                        onClick={() => moveWeek(week.id, 1)}
                      >
                        下移
                      </button>
                      <button type="button" className="btn btn-small btn-danger" onClick={() => setPendingWeekDeleteId(week.id)}>
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingWeek ? (
          <TeachingPlanWeekDialog
            key={editingWeek.id}
            week={editingWeek}
            onClose={() => setEditingWeekId(null)}
            onSave={applyWeek}
          />
        ) : null}

        {pendingWeekDelete ? (
          <div className="dialog-backdrop" onMouseDown={() => setPendingWeekDeleteId(null)}>
            <div className="dialog dialog--plan" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
              <h3>删除第 {pendingWeekDelete.weekNumber} 周？</h3>
              <p className="dialog-slot">删除后其余周次会重新从 1 连续编号。未点“保存本计划”前不会写入磁盘。</p>
              <div className="dialog-actions">
                <span />
                <div className="dialog-actions-right">
                  <button type="button" className="btn" onClick={() => setPendingWeekDeleteId(null)}>
                    取消
                  </button>
                  <button type="button" className="btn btn-danger" onClick={confirmDeleteWeek}>
                    删除本周
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <section className="page page--plans">
      <div className="page-heading page-heading--split">
        <div className="page-heading-text">
          <h2>教学计划</h2>
          <p>按年级组织学期教学计划，不绑定单个班级。计划只说明准备教什么。</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            + 新建教学计划
          </button>
        </div>
      </div>

      {error ? <p className="page-error">{error}</p> : null}
      {actionError ? <p className="page-error">{actionError}</p> : null}
      {context ? (
        <p className="page-ok">
          来自工作台：{context.grade} {context.className}（{context.academicYear} {context.semester}）。
          {matchedPlans.length === 1
            ? '已打开唯一匹配的年级计划，未按名称猜测。'
            : matchedPlans.length === 0
              ? '没有学年/学期/年级都相同的计划，请选择或新建。未自动选中。'
              : `有 ${matchedPlans.length} 份同年级同学期计划，请手动选择。未自动选中。`}
        </p>
      ) : null}

      {plans.length === 0 ? (
        <div className="empty-panel">
          <p className="empty-title">还没有教学计划</p>
          <p className="empty-text">先按年级创建一份计划，再填写第 1～N 周安排。</p>
          <button type="button" className="btn btn-primary empty-action" onClick={() => setCreateOpen(true)}>
            新建教学计划
          </button>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>计划名称</th>
                <th>年级</th>
                <th>学年</th>
                <th>学期</th>
                <th>周数</th>
                <th>起止日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.grade}</td>
                  <td>{item.academicYear}</td>
                  <td>{item.semester}</td>
                  <td>{item.totalWeeks}</td>
                  <td>
                    {item.startDate || item.endDate ? `${item.startDate ?? '—'} ～ ${item.endDate ?? '—'}` : '未填写'}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn btn-small" onClick={() => openPlan(item)}>
                        打开
                      </button>
                      <button type="button" className="btn btn-small" onClick={() => openPlan(item)}>
                        编辑
                      </button>
                      <button type="button" className="btn btn-small" disabled={working} onClick={() => void handleCopy(item)}>
                        复制
                      </button>
                      <button type="button" className="btn btn-small btn-danger" onClick={() => setPendingDelete(item)}>
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {createOpen ? <TeachingPlanCreateDialog onClose={() => setCreateOpen(false)} onSave={handleCreate} /> : null}

      {pendingDelete ? (
        <div className="dialog-backdrop" onMouseDown={() => setPendingDelete(null)}>
          <div className="dialog dialog--plan" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <h3>删除教学计划？</h3>
            <p className="dialog-slot">
              将删除「{pendingDelete.name}」及其全部 {pendingDelete.totalWeeks} 周安排。本版课堂记录不绑定教学计划，删除后无法从软件内恢复。
            </p>
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={() => setPendingDelete(null)} disabled={working}>
                  取消
                </button>
                <button type="button" className="btn btn-danger" onClick={() => void handleConfirmDelete()} disabled={working}>
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
