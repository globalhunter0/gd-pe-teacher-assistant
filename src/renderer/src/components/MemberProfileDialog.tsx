import { useId, useState } from 'react'
import type { TrainingTeamMember } from '@shared/trainingTeam'

interface MemberProfileDialogProps {
  member: TrainingTeamMember
  displayName: string
  studentNo: string
  classLabel: string
  genderLabel: string
  readOnly?: boolean
  onClose: () => void
  onSave: (member: TrainingTeamMember) => Promise<void>
}

export default function MemberProfileDialog({
  member,
  displayName,
  studentNo,
  classLabel,
  genderLabel,
  readOnly = false,
  onClose,
  onSave
}: MemberProfileDialogProps): React.JSX.Element {
  const titleId = useId()
  const [joinedAt, setJoinedAt] = useState(member.joinedAt.slice(0, 10))
  const [specialty, setSpecialty] = useState(member.specialty)
  const [position, setPosition] = useState(member.position)
  const [trainingGroup, setTrainingGroup] = useState(member.trainingGroup)
  const [trainingNotes, setTrainingNotes] = useState(member.trainingNotes)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave(): Promise<void> {
    if (joinedAt.trim() === '') {
      setFormError('请填写入队日期')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      await onSave({
        ...member,
        joinedAt: `${joinedAt}T00:00:00.000Z`,
        specialty: specialty.trim(),
        position: position.trim(),
        trainingGroup: trainingGroup.trim(),
        trainingNotes: trainingNotes.trim(),
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存失败')
      setSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog dialog--class" role="dialog" aria-labelledby={titleId} onClick={(event) => event.stopPropagation()}>
        <h3 id={titleId}>{readOnly ? '运动员档案' : '编辑运动员档案'}</h3>
        <p className="dialog-slot">
          {displayName} · {studentNo || '无学号'} · {classLabel || '无班级'} · {genderLabel}
        </p>
        <label className="toolbar-field" style={{ display: 'block', marginBottom: 8 }}>
          入队日期
          <input type="date" value={joinedAt} disabled={readOnly} onChange={(event) => setJoinedAt(event.target.value)} />
        </label>
        <label className="toolbar-field" style={{ display: 'block', marginBottom: 8 }}>
          专项 / 主项
          <input
            value={specialty}
            disabled={readOnly}
            onChange={(event) => setSpecialty(event.target.value)}
            placeholder="例如：100米、后卫"
          />
        </label>
        <label className="toolbar-field" style={{ display: 'block', marginBottom: 8 }}>
          位置
          <input
            value={position}
            disabled={readOnly}
            onChange={(event) => setPosition(event.target.value)}
            placeholder="球类等可用；田径可留空"
          />
        </label>
        <label className="toolbar-field" style={{ display: 'block', marginBottom: 8 }}>
          训练分组
          <input
            value={trainingGroup}
            disabled={readOnly}
            onChange={(event) => setTrainingGroup(event.target.value)}
            placeholder="例如：短跑一组"
          />
        </label>
        <label className="toolbar-field" style={{ display: 'block', marginBottom: 8 }}>
          训练备注
          <textarea
            value={trainingNotes}
            disabled={readOnly}
            onChange={(event) => setTrainingNotes(event.target.value)}
            rows={3}
            placeholder="训练限制、注意事项等普通文本；不记录医疗诊断"
          />
        </label>
        {formError ? <p className="page-error">{formError}</p> : null}
        <div className="dialog-actions">
          <span />
          <div className="dialog-actions-right">
            <button type="button" className="btn" onClick={onClose} disabled={saving}>
              {readOnly ? '关闭' : '取消'}
            </button>
            {readOnly ? null : (
              <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
                保存
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
