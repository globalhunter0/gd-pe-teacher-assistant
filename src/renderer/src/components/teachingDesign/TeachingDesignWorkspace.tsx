import { useMemo, useState } from 'react'
import { findContentCategory } from '@shared/curriculum'
import {
  checkBigUnitCompliance,
  countIssues,
  lessonsOfBigUnit,
  removeUnitKeepLessons,
  unitsOfBigUnit,
  type BigUnitDesign,
  type LessonDesign,
  type TeachingDesign,
  type UnitDesign
} from '@shared/teachingDesign'
import { useTeachingDesigns } from '../../context/TeachingDesignContext'
import { getAppApi } from '../../platform/appApi'
import TechEmptyState from '../workspace/TechEmptyState'
import BigUnitCreateDialog from './BigUnitCreateDialog'
import BigUnitDetail from './BigUnitDetail'
import { GenerationBanner } from './CompliancePanel'
import LessonDesignEditor from './LessonDesignEditor'
import { errorText, useGenerationRunner } from './useGenerationRunner'

export default function TeachingDesignWorkspace(): React.JSX.Element {
  const { designs, loading, error, saveDesigns, upsertDesigns, deleteDesign } = useTeachingDesigns()
  const runner = useGenerationRunner()
  const [openBigUnitId, setOpenBigUnitId] = useState<string | null>(null)
  const [openLessonId, setOpenLessonId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<BigUnitDesign | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const bigUnits = useMemo(() => designs.filter((item): item is BigUnitDesign => item.kind === 'bigUnit'), [designs])
  const openBigUnit = bigUnits.find((item) => item.id === openBigUnitId) ?? null
  const openLesson = designs.find((item): item is LessonDesign => item.kind === 'lesson' && item.id === openLessonId) ?? null
  const busy = runner.busyLabel !== null

  async function act(action: () => Promise<void>): Promise<void> {
    setActionError(null)
    setMessage(null)
    try {
      await action()
    } catch (actionErr) {
      setActionError(errorText(actionErr))
    } finally {
      runner.end()
    }
  }

  async function generateBigUnit(bigUnit: BigUnitDesign): Promise<void> {
    const result = await runner.run(`正在生成“${bigUnit.title}”大单元教学计划…`, { kind: 'bigUnit', bigUnit })
    if (result.kind === 'bigUnit') {
      await upsertDesigns([result.bigUnit])
      setMessage('大单元教学计划已生成并保存，可继续生成单元计划。')
    }
  }

  /** 新单元覆盖旧单元：同序号保留 ID；多出的旧单元删除，其课时教案解除单元归属。 */
  async function generateUnits(bigUnit: BigUnitDesign): Promise<void> {
    const existing = unitsOfBigUnit(designs, bigUnit.id)
    const result = await runner.run(`正在生成 ${bigUnit.unitOutline.length} 个单元教学计划…`, { kind: 'units', bigUnit, existingUnits: existing })
    if (result.kind !== 'units') return
    let next: TeachingDesign[] = [...designs]
    const now = new Date().toISOString()
    for (const stale of existing.filter((unit) => !result.units.some((item) => item.id === unit.id))) {
      next = removeUnitKeepLessons(next, stale.id, now)
    }
    const ids = new Set(result.units.map((unit) => unit.id))
    next = next.filter((item) => !ids.has(item.id)).concat(result.units)
    next = next.map((item) => {
      if (item.kind !== 'lesson' || item.bigUnitId !== bigUnit.id || item.lessonNo === null) return item
      const unit = result.units.find((entry) => item.lessonNo! >= entry.lessonFrom && item.lessonNo! <= entry.lessonTo)
      return unit && item.unitId !== unit.id ? { ...item, unitId: unit.id, updatedAt: now } : item
    })
    await saveDesigns(next)
    setMessage(`已生成并保存 ${result.units.length} 个单元教学计划。`)
  }

  async function generateLessons(bigUnit: BigUnitDesign, lessonNos: number[], counts: { maleCount: number | null; femaleCount: number | null }): Promise<void> {
    runner.begin('准备生成课时教案…')
    const units = unitsOfBigUnit(designs, bigUnit.id)
    let done = 0
    const failures: string[] = []
    for (const lessonNo of lessonNos) {
      if (runner.canceled()) break
      const unit = units.find((item) => lessonNo >= item.lessonFrom && lessonNo <= item.lessonTo) ?? null
      const existing = lessonsOfBigUnit(designs, bigUnit.id).find((item) => item.lessonNo === lessonNo) ?? null
      const progress = lessonNos.length > 1 ? `（${done + 1}/${lessonNos.length}）` : ''
      try {
        const result = await runner.run(`正在生成第 ${lessonNo} 课时教案${progress}…`, {
          kind: 'lesson',
          bigUnit,
          unit,
          lessonNo,
          maleCount: counts.maleCount ?? existing?.maleCount ?? null,
          femaleCount: counts.femaleCount ?? existing?.femaleCount ?? null,
          existingLessonId: existing?.id ?? null
        })
        if (result.kind === 'lesson') {
          await upsertDesigns([result.lesson])
          done += 1
        }
      } catch (lessonError) {
        if (runner.canceled()) break
        failures.push(`第${lessonNo}课时：${errorText(lessonError)}`)
        if (failures.length >= 2 && done === 0) break
      }
    }
    const canceled = runner.canceled() ? '（已取消剩余课时）' : ''
    if (failures.length > 0) {
      throw new Error(`已生成 ${done} 节${canceled}；${failures.length} 节失败：${failures.join('；')}`)
    }
    setMessage(`已生成并保存 ${done} 节课时教案${canceled}。`)
  }

  async function exportDesign(id: string): Promise<void> {
    const result = await (await getAppApi()).teachingDesigns.exportDocx(id)
    if (!result.canceled) setMessage(`已导出：${result.filePath}`)
  }

  async function createBigUnit(bigUnit: BigUnitDesign, generate: boolean): Promise<void> {
    await upsertDesigns([bigUnit])
    setCreateOpen(false)
    setOpenBigUnitId(bigUnit.id)
    if (generate) {
      await act(() => generateBigUnit(bigUnit))
    }
  }

  const banner = <GenerationBanner label={runner.busyLabel} onCancel={() => void runner.cancel()} />
  const feedback = (
    <>
      {error ? <p className="page-error">{error}</p> : null}
      {actionError ? <p className="page-error">{actionError}</p> : null}
      {message ? <p className="page-ok">{message}</p> : null}
    </>
  )

  if (loading) {
    return <p className="td-hint">正在读取教学设计…</p>
  }

  if (openLesson && openBigUnit) {
    const unit = openLesson.unitId ? (designs.find((item): item is UnitDesign => item.kind === 'unit' && item.id === openLesson.unitId) ?? null) : null
    return (
      <>
        {banner}
        {feedback}
        <LessonDesignEditor
          key={`${openLesson.id}-${openLesson.updatedAt}`}
          lesson={openLesson}
          busy={busy}
          onClose={() => setOpenLessonId(null)}
          onSave={async (lesson) => {
            await upsertDesigns([lesson])
            setMessage('课时教案已保存。')
          }}
          onExport={() => act(() => exportDesign(openLesson.id))}
          onRegenerate={
            openLesson.lessonNo !== null
              ? () =>
                  act(async () => {
                    if (!window.confirm('重新生成会覆盖本课时教案（教学反思保留），确定继续？')) return
                    await generateLessons(openBigUnit, [openLesson.lessonNo!], { maleCount: openLesson.maleCount, femaleCount: openLesson.femaleCount })
                  })
              : null
          }
        />
      </>
    )
  }

  if (openBigUnit) {
    return (
      <>
        {banner}
        {feedback}
        <BigUnitDetail
          bigUnit={openBigUnit}
          units={unitsOfBigUnit(designs, openBigUnit.id)}
          lessons={lessonsOfBigUnit(designs, openBigUnit.id)}
          busy={busy}
          onBack={() => {
            setOpenBigUnitId(null)
            setMessage(null)
            setActionError(null)
          }}
          onSave={async (bigUnit) => {
            await upsertDesigns([bigUnit])
            setMessage('大单元已保存。')
          }}
          onSaveUnit={async (unit) => {
            await upsertDesigns([unit])
            setMessage('单元教学计划已保存。')
          }}
          onGenerateBigUnit={() => act(() => generateBigUnit(openBigUnit))}
          onGenerateUnits={() => act(() => generateUnits(openBigUnit))}
          onGenerateLessons={(lessonNos, counts) => act(() => generateLessons(openBigUnit, lessonNos, counts))}
          onOpenLesson={(id) => setOpenLessonId(id)}
          onExport={() => act(() => exportDesign(openBigUnit.id))}
        />
      </>
    )
  }

  return (
    <>
      {banner}
      {feedback}
      <div className="td-section-head">
        <p className="td-hint">
          按课标要求生成大单元教学计划 → 单元教学计划 → 课时教案（广州市统一课时教案模板）。生成内容需教师审核修改后使用。
        </p>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => setCreateOpen(true)}>
          + 新建大单元
        </button>
      </div>
      {bigUnits.length === 0 ? (
        <TechEmptyState
          kind="plans"
          title="还没有大单元教学设计"
          description="选择年级、教材版本和运动项目，AI 会按课标要求生成大单元、单元与课时教案。"
          actionLabel="新建大单元"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>年级</th>
                <th>学期</th>
                <th>内容</th>
                <th>课时</th>
                <th>单元 / 教案</th>
                <th>课标检查</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {bigUnits.map((item) => {
                const issues = countIssues(checkBigUnitCompliance(item))
                return (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.grade}</td>
                    <td>
                      {item.academicYear} {item.semester}
                    </td>
                    <td>
                      {findContentCategory(item.categoryId)?.name} · {item.sportItem}
                    </td>
                    <td>{item.totalLessons}</td>
                    <td>
                      {unitsOfBigUnit(designs, item.id).length} / {lessonsOfBigUnit(designs, item.id).length}
                    </td>
                    <td>
                      {issues.errors > 0 ? (
                        <span className="status-badge status-badge--danger">{issues.errors} 项不符合</span>
                      ) : issues.warnings > 0 ? (
                        <span className="status-badge status-badge--warn">{issues.warnings} 项提醒</span>
                      ) : (
                        <span className="status-badge status-badge--ok">符合</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn btn-small" onClick={() => setOpenBigUnitId(item.id)}>
                          打开
                        </button>
                        <button type="button" className="btn btn-small" disabled={busy} onClick={() => void act(() => exportDesign(item.id))}>
                          导出 Word
                        </button>
                        <button type="button" className="btn btn-small btn-danger" disabled={busy} onClick={() => setPendingDelete(item)}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {createOpen ? <BigUnitCreateDialog onClose={() => setCreateOpen(false)} onCreate={createBigUnit} /> : null}

      {pendingDelete ? (
        <div className="dialog-backdrop" onMouseDown={() => setPendingDelete(null)}>
          <div className="dialog dialog--plan" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <h3>删除大单元？</h3>
            <p className="dialog-slot">
              将删除「{pendingDelete.title}」及其 {unitsOfBigUnit(designs, pendingDelete.id).length} 个单元计划、
              {lessonsOfBigUnit(designs, pendingDelete.id).length} 节课时教案。删除后只能通过备份恢复。
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
                  onClick={() =>
                    void act(async () => {
                      await deleteDesign(pendingDelete.id)
                      setPendingDelete(null)
                    })
                  }
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
