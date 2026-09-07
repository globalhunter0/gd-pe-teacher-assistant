import { useEffect, useId, useState } from 'react'
import {
  TRAINING_SPORTS,
  TRAINING_SPORT_LABELS,
  createTrainingTeamId,
  type TrainingSport,
  type TrainingTeam
} from '@shared/trainingTeam'

interface TrainingTeamDialogProps {
  record: TrainingTeam | null
  parentTeam: TrainingTeam | null
  parentOptions: TrainingTeam[]
  onClose: () => void
  onSave: (record: TrainingTeam) => Promise<void>
}

export default function TrainingTeamDialog({
  record,
  parentTeam,
  parentOptions,
  onClose,
  onSave
}: TrainingTeamDialogProps): React.JSX.Element {
  const titleId = useId()
  const isEdit = record !== null
  const [name, setName] = useState(record?.name ?? '')
  const [sport, setSport] = useState<TrainingSport>(record?.sport ?? parentTeam?.sport ?? 'track')
  const [parentTeamId, setParentTeamId] = useState(record?.parentTeamId ?? parentTeam?.id ?? '')
  const [coach, setCoach] = useState(record?.coach ?? '')
  const [notes, setNotes] = useState(record?.notes ?? '')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSave(): Promise<void> {
    const trimmed = name.trim()
    if (trimmed === '') {
      setFormError('名称不能为空')
      return
    }
    const now = new Date().toISOString()
    setSaving(true)
    setFormError(null)
    try {
      await onSave({
        id: record?.id ?? createTrainingTeamId(),
        parentTeamId: parentTeamId === '' ? null : parentTeamId,
        name: trimmed,
        sport,
        coach: coach.trim(),
        notes: notes.trim(),
        status: record?.status ?? 'active',
        createdAt: record?.createdAt ?? now,
        updatedAt: now
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存失败')
      setSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="dialog dialog--class"
        role="dialog"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>{isEdit ? '编辑训练队/组' : parentTeam ? '新建训练组' : '新建训练队'}</h3>
        {formError ? <p className="dialog-error">{formError}</p> : null}
        <div className="dialog-grid">
          <label>
            名称
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="校田径队 / 短跑组" />
          </label>
          <label>
            项目
            <select value={sport} onChange={(event) => setSport(event.target.value as TrainingSport)}>
              {TRAINING_SPORTS.map((item) => (
                <option key={item} value={item}>
                  {TRAINING_SPORT_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <label className="dialog-span">
            上级队伍（训练组才需要）
            <select value={parentTeamId} onChange={(event) => setParentTeamId(event.target.value)} disabled={Boolean(parentTeam) && !isEdit}>
              <option value="">无（这是一支独立队伍）</option>
              {parentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            教练
            <input value={coach} onChange={(event) => setCoach(event.target.value)} />
          </label>
          <label className="dialog-span">
            备注
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </label>
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose} disabled={saving}>
            取消
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
