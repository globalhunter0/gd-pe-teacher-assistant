import { useId, useState } from 'react'
import {
  createTrainingPlanId,
  formatTrainingDate,
  type TrainingPlan
} from '@shared/trainingTeam'

interface TrainingPlanDialogProps {
  trainingTeamId: string
  record: TrainingPlan | null
  onClose: () => void
  onSave: (plan: TrainingPlan) => Promise<void>
}

export default function TrainingPlanDialog({
  trainingTeamId,
  record,
  onClose,
  onSave
}: TrainingPlanDialogProps): React.JSX.Element {
  const titleId = useId()
  const [date, setDate] = useState(record?.date ?? formatTrainingDate(new Date()))
  const [title, setTitle] = useState(record?.title ?? '')
  const [goal, setGoal] = useState(record?.goal ?? '')
  const [content, setContent] = useState(record?.content ?? '')
  const [notes, setNotes] = useState(record?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave(): Promise<void> {
    if (!title.trim()) {
      setError('请填写训练主题')
      return
    }
    if (!content.trim()) {
      setError('请填写训练内容')
      return
    }
    setSaving(true)
    setError(null)
    const now = new Date().toISOString()
    try {
      await onSave({
        id: record?.id ?? createTrainingPlanId(),
        trainingTeamId,
        date,
        title: title.trim(),
        goal: goal.trim(),
        content: content.trim(),
        notes: notes.trim(),
        status: record?.status ?? 'planned',
        createdAt: record?.createdAt ?? now,
        updatedAt: now
      })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存训练计划失败')
      setSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div
        className="dialog dialog--class"
        role="dialog"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>{record ? '编辑训练计划' : '新建训练计划'}</h3>
        <div className="dialog-grid">
          <label>
            训练日期
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="dialog-span">
            训练主题
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：篮球基础进攻"
              autoFocus
            />
          </label>
          <label className="dialog-span">
            训练目标
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={2}
              placeholder="例如：提高行进间传接球稳定性"
            />
          </label>
          <label className="dialog-span">
            训练内容
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={7}
              placeholder={'1. 动态热身\n2. 两人移动传接球\n3. 半场 3v3\n4. 放松'}
            />
          </label>
          <label className="dialog-span">
            训练备注
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="重点观察或组织提醒"
            />
          </label>
        </div>
        {error ? <p className="dialog-error">{error}</p> : null}
        <div className="dialog-actions">
          <span />
          <div className="dialog-actions-right">
            <button type="button" className="btn" onClick={onClose} disabled={saving}>
              取消
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
              保存计划
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
