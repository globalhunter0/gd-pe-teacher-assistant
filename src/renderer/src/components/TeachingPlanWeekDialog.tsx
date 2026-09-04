import { useEffect, useId, useState } from 'react'
import type { TeachingPlanWeek } from '@shared/teachingPlan'

interface TeachingPlanWeekDialogProps {
  week: TeachingPlanWeek
  onClose: () => void
  onSave: (week: TeachingPlanWeek) => void
}

export default function TeachingPlanWeekDialog({
  week,
  onClose,
  onSave
}: TeachingPlanWeekDialogProps): React.JSX.Element {
  const titleId = useId()
  const [title, setTitle] = useState(week.title)
  const [contents, setContents] = useState(week.contents)
  const [objectives, setObjectives] = useState(week.objectives)
  const [notes, setNotes] = useState(week.notes)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleSave(): void {
    onSave({
      ...week,
      title: title.trim(),
      contents: contents.trim(),
      objectives: objectives.trim(),
      notes: notes.trim()
    })
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div
        className="dialog dialog--plan-week"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>第 {week.weekNumber} 周安排</h3>
        <p className="dialog-slot">填写本周计划教什么。这里不是实际上课记录，也不会标记完成。</p>

        <div className="dialog-grid">
          <label className="dialog-span">
            主题 / 标题
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：耐久跑与准备活动" autoFocus />
          </label>
          <label className="dialog-span">
            教学内容
            <textarea rows={5} value={contents} onChange={(event) => setContents(event.target.value)} />
          </label>
          <label className="dialog-span">
            教学目标
            <textarea rows={4} value={objectives} onChange={(event) => setObjectives(event.target.value)} />
          </label>
          <label className="dialog-span">
            备注
            <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </div>

        <div className="dialog-actions">
          <span />
          <div className="dialog-actions-right">
            <button type="button" className="btn" onClick={onClose}>
              取消
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
