import { useRef, useState } from 'react'
import { createTrainingMemberId, type TrainingTeam, type TrainingTeamMember } from '@shared/trainingTeam'
import { useTraining } from '../context/TrainingContext'

export default function ManualTrainingMembers({ team }: { team: TrainingTeam }): React.JSX.Element {
  const training = useTraining()
  const [names, setNames] = useState('')
  const [className, setClassName] = useState('')
  const [gender, setGender] = useState<TrainingTeamMember['genderSnapshot']>('unspecified')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const [feedback, setFeedback] = useState('')
  const [succeeded, setSucceeded] = useState(false)
  const nameCount = names.split(/[\n,，、;；]+/).filter((name) => name.trim()).length
  async function submit(): Promise<void> {
    if (pending.current) return
    setSucceeded(false)
    const entries = names.split(/[\n,，、;；]+/).map((name) => name.trim()).filter(Boolean)
    if (!entries.length) { setFeedback('请输入队员姓名，每行一人'); return }
    if (new Set(entries).size !== entries.length) { setFeedback('名单中有重复姓名，请逐个添加同名队员以确认身份'); return }
    if (entries.some((name) => name.length > 40)) { setFeedback('姓名不能超过40个字'); return }
    const now = new Date().toISOString()
    const additions: TrainingTeamMember[] = entries.map((name) => ({
      id: createTrainingMemberId(), source: 'manual', teamId: team.id, studentId: `student-${crypto.randomUUID()}`,
      nameSnapshot: name, studentNoSnapshot: '', classNameSnapshot: className.trim(), genderSnapshot: gender,
      joinedAt: now, leftAt: null, status: 'active', specialty: '', position: '', trainingGroup: '', trainingNotes: '', notes: '', createdAt: now, updatedAt: now
    }))
    pending.current = true
    setBusy(true)
    setFeedback('')
    try {
      await training.addMembers(additions)
      setNames('')
      setSucceeded(true)
      setFeedback(`已添加 ${additions.length} 名队员`)
    } catch (error) { setFeedback(error instanceof Error ? error.message : '添加失败，请重试') }
    finally { pending.current = false; setBusy(false) }
  }
  return (
    <fieldset disabled={busy || team.status !== 'active'} className="manual-members-form" aria-label="手动录入队员">
      <div className="manual-members-fields">
        <label className="manual-members-names">
          <span className="manual-members-label">队员姓名 <span className="manual-members-required">必填</span></span>
          <textarea value={names} onChange={(event) => setNames(event.target.value)} placeholder={'每行输入一个姓名，例如：\n张三\n李四'} rows={5} />
          <span className="manual-members-hint">支持粘贴多人名单，也可用逗号、顿号分隔。</span>
        </label>
        <div className="manual-members-options">
          <label>
            <span className="manual-members-label">所在班级 <span>选填</span></span>
            <input value={className} maxLength={40} onChange={(event) => setClassName(event.target.value)} placeholder="例如：八年级3班" />
          </label>
          <label>
            <span className="manual-members-label">性别 <span>选填</span></span>
            <select value={gender} onChange={(event) => setGender(event.target.value as typeof gender)}>
              <option value="unspecified">暂不填写</option><option value="male">男</option><option value="female">女</option>
            </select>
          </label>
          <p className="manual-members-hint">班级和性别适用于本次全部队员。不同班级或性别可分批添加。</p>
        </div>
      </div>
      {feedback ? <p className={succeeded ? 'manual-members-feedback is-success' : 'manual-members-feedback is-error'} role={succeeded ? 'status' : 'alert'}>{feedback}</p> : null}
      <div className="manual-members-footer">
        <span>{nameCount > 0 ? <>待添加 <strong>{nameCount}</strong> 名队员</> : '无需先在「班级与学生」中建档'}</span>
        <button type="button" className="btn btn-primary" disabled={nameCount === 0} onClick={() => void submit()}>{busy ? '正在添加…' : nameCount > 0 ? `添加 ${nameCount} 名队员` : '添加到本队'}</button>
      </div>
    </fieldset>
  )
}
