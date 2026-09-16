import { useMemo, useState } from 'react'
import { PageHeader } from './PageLayout'
import { parseScoreInput } from '@shared/peTest'
import {
  TRAINING_COMPLETIONS,
  TRAINING_COMPLETION_LABELS,
  TRAINING_EXERCISE_KINDS,
  TRAINING_EXERCISE_KIND_LABELS,
  TRAINING_PARTICIPATIONS,
  TRAINING_PARTICIPATION_LABELS,
  TRAINING_RESULT_KIND_LABELS,
  classNameOf,
  createTrainingAttendanceId,
  createTrainingExerciseId,
  createTrainingResultId,
  createTrainingSessionId,
  formatTrainingDate,
  formatTrainingScoreWithUnit,
  type TrainingAttendance,
  type TrainingCompletion,
  type TrainingExercise,
  type TrainingExerciseKind,
  type TrainingItem,
  type TrainingParticipation,
  type TrainingResult,
  type TrainingResultKind,
  type TrainingSession,
  type TrainingTeam
} from '@shared/trainingTeam'
import type { StudentRecord } from '@shared/student'
import type { ClassRecord } from '@shared/class'

interface DraftSessionResult {
  localId: string
  studentId: string
  itemId: string
  rawInput: string
  kind: TrainingResultKind
  note: string
}

interface TrainingSessionEditorProps {
  team: TrainingTeam
  roster: StudentRecord[]
  classes: ClassRecord[]
  items: TrainingItem[]
  /** 编辑既有课次时，已绑定本 sessionId 的成绩（独立成绩不在此列） */
  existingSessionResults?: TrainingResult[]
  record: TrainingSession | null
  onCancel: () => void
  onSave: (session: TrainingSession, sessionResults: TrainingResult[]) => Promise<void>
}

function emptyExercise(sortOrder: number): TrainingExercise {
  return {
    id: createTrainingExerciseId(),
    sortOrder,
    name: '',
    kind: 'other',
    sets: null,
    reps: null,
    distanceM: null,
    durationSec: null,
    notes: ''
  }
}

export default function TrainingSessionEditor({
  team,
  roster,
  classes,
  items,
  existingSessionResults = [],
  record,
  onCancel,
  onSave
}: TrainingSessionEditorProps): React.JSX.Element {
  const [date, setDate] = useState(record?.date ?? formatTrainingDate(new Date()))
  const [startTime, setStartTime] = useState(record?.startTime ?? '')
  const [title, setTitle] = useState(record?.title ?? '')
  const [place, setPlace] = useState(record?.place ?? '')
  const [duration, setDuration] = useState(record?.durationMinutes != null ? String(record.durationMinutes) : '90')
  const [notes, setNotes] = useState(record?.notes ?? '')
  const [exercises, setExercises] = useState<TrainingExercise[]>(
    record?.exercises.length
      ? record.exercises
      : [
          emptyExercise(0),
          { ...emptyExercise(1), name: '专项练习', kind: 'drill' },
          { ...emptyExercise(2), name: '放松', kind: 'recovery' }
        ]
  )
  const initialAttendance = useMemo(() => {
    if (record) {
      return record.attendance
    }
    return roster.map((student) => ({
      id: createTrainingAttendanceId(),
      studentId: student.id,
      nameSnapshot: student.name,
      studentNoSnapshot: student.studentNo,
      classNameSnapshot: classNameOf(classes, student.classId),
      participation: 'normal' as const,
      rpe: null,
      completion: 'completed' as const,
      note: ''
    }))
  }, [classes, record, roster])
  const [attendance, setAttendance] = useState<TrainingAttendance[]>(initialAttendance)
  const [draftResults, setDraftResults] = useState<DraftSessionResult[]>(() =>
    existingSessionResults.map((item) => ({
      localId: item.id,
      studentId: item.studentId,
      itemId: item.itemId,
      rawInput: item.rawInput,
      kind: item.kind,
      note: item.note
    }))
  )
  const [testStudentId, setTestStudentId] = useState('')
  const [testItemId, setTestItemId] = useState('')
  const [testInput, setTestInput] = useState('')
  const [testKind, setTestKind] = useState<TrainingResultKind>('training')
  const [testNote, setTestNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const activeItems = items.filter((item) => item.isActive)
  const presentRoster = attendance.filter((row) => row.participation !== 'absent')

  function updateAttendance(studentId: string, patch: Partial<TrainingAttendance>): void {
    setAttendance((current) => current.map((row) => (row.studentId === studentId ? { ...row, ...patch } : row)))
  }

  function moveExercise(index: number, direction: -1 | 1): void {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= exercises.length) {
      return
    }
    const next = [...exercises]
    const [item] = next.splice(index, 1)
    next.splice(nextIndex, 0, item)
    setExercises(next.map((row, sortOrder) => ({ ...row, sortOrder })))
  }

  function handleAddSessionTest(): void {
    if (testStudentId === '' || testItemId === '') {
      setError('请选择当堂测试的队员和项目')
      return
    }
    if (testInput.trim() === '') {
      setError('请填写当堂测试成绩')
      return
    }
    const item = items.find((entry) => entry.id === testItemId)
    if (!item) {
      setError('训练项目不存在')
      return
    }
    try {
      parseScoreInput(testInput, item.valueType, item.timeInputMode)
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : '成绩无法识别')
      return
    }
    setDraftResults((current) => [
      ...current,
      {
        localId: `draft-${createTrainingResultId()}`,
        studentId: testStudentId,
        itemId: testItemId,
        rawInput: testInput.trim(),
        kind: testKind,
        note: testNote.trim()
      }
    ])
    setTestInput('')
    setTestNote('')
    setError(null)
  }

  async function handleSave(): Promise<void> {
    if (title.trim() === '') {
      setError('请填写训练主题')
      return
    }
    const namedExercises = exercises.filter((item) => item.name.trim() !== '')
    if (namedExercises.length === 0) {
      setError('请至少填写一项训练内容')
      return
    }
    const durationMinutes = duration.trim() === '' ? null : Number(duration.trim())
    if (durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes < 0)) {
      setError('训练时长必须是整数分钟')
      return
    }
    setSaving(true)
    setError(null)
    const now = new Date().toISOString()
    const sessionId = record?.id ?? createTrainingSessionId()
    try {
      const session: TrainingSession = {
        id: sessionId,
        teamId: team.id,
        date,
        startTime: startTime.trim(),
        title: title.trim(),
        place: place.trim(),
        durationMinutes,
        notes: notes.trim(),
        teamNameSnapshot: team.name,
        createdAt: record?.createdAt ?? now,
        updatedAt: now,
        exercises: namedExercises.map((item, sortOrder) => ({ ...item, name: item.name.trim(), sortOrder })),
        attendance
      }

      const sessionResults: TrainingResult[] = []
      for (const draft of draftResults) {
        const student = roster.find((entry) => entry.id === draft.studentId)
        const attendanceRow = attendance.find((row) => row.studentId === draft.studentId)
        const item = items.find((entry) => entry.id === draft.itemId)
        if (!item) {
          throw new Error('当堂测试项目不存在')
        }
        const rawValue = parseScoreInput(draft.rawInput, item.valueType, item.timeInputMode)
        const existing = existingSessionResults.find((entry) => entry.id === draft.localId)
        sessionResults.push({
          id: existing?.id ?? createTrainingResultId(),
          teamId: team.id,
          studentId: draft.studentId,
          studentNameSnapshot: student?.name ?? attendanceRow?.nameSnapshot ?? '未知',
          studentNoSnapshot: student?.studentNo ?? attendanceRow?.studentNoSnapshot ?? '',
          classNameSnapshot:
            student != null ? classNameOf(classes, student.classId) : (attendanceRow?.classNameSnapshot ?? ''),
          genderSnapshot: student?.gender ?? 'male',
          date,
          itemId: item.id,
          itemNameSnapshot: item.name,
          unitSnapshot: item.unit,
          customUnitLabelSnapshot: item.customUnitLabel,
          directionSnapshot: item.direction,
          valueTypeSnapshot: item.valueType,
          timeInputModeSnapshot: item.timeInputMode,
          decimalPlacesSnapshot: item.decimalPlaces,
          rawInput: draft.rawInput,
          rawValue,
          kind: draft.kind,
          sessionId,
          status: 'valid',
          note: draft.note,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now
        })
      }

      await onSave(session, sessionResults)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败')
      setSaving(false)
    }
  }

  return (
    <div className="exam-detail">
      <PageHeader
        icon="training"
        title={record ? '编辑训练' : '开始训练'}
        description={`${team.name}。默认全员正常参加，只改异常人员。可在本课记录当堂测试，成绩会绑定本次训练。RPE 为 0–10 主观强度，不是体检指标。`}
        actions={
          <>
            <button type="button" className="btn" onClick={onCancel} disabled={saving}>
              返回
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
              保存训练
            </button>
          </>
        }
      />
      {error ? <p className="page-error">{error}</p> : null}
      <div className="toolbar">
        <label className="toolbar-field">
          日期
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label className="toolbar-field">
          开始时间
          <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
        </label>
        <label className="toolbar-field toolbar-field-grow">
          训练主题
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="速度耐力" />
        </label>
        <label className="toolbar-field">
          地点
          <input value={place} onChange={(event) => setPlace(event.target.value)} placeholder="田径场" />
        </label>
        <label className="toolbar-field">
          时长（分钟）
          <input value={duration} onChange={(event) => setDuration(event.target.value)} />
        </label>
      </div>
      <label className="toolbar-field" style={{ display: 'block', margin: '8px 0 16px' }}>
        备注
        <input value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>

      <h3>训练内容</h3>
      <div className="import-preview-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>类型</th>
              <th>组数</th>
              <th>次数</th>
              <th>距离(m)</th>
              <th>时间(秒)</th>
              <th>备注</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {exercises.map((item, index) => (
              <tr key={item.id}>
                <td>
                  <input
                    value={item.name}
                    onChange={(event) =>
                      setExercises((current) =>
                        current.map((row) => (row.id === item.id ? { ...row, name: event.target.value } : row))
                      )
                    }
                    placeholder="4×60m"
                  />
                </td>
                <td>
                  <select
                    value={item.kind}
                    onChange={(event) =>
                      setExercises((current) =>
                        current.map((row) =>
                          row.id === item.id ? { ...row, kind: event.target.value as TrainingExerciseKind } : row
                        )
                      )
                    }
                  >
                    {TRAINING_EXERCISE_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {TRAINING_EXERCISE_KIND_LABELS[kind]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    value={item.sets ?? ''}
                    onChange={(event) =>
                      setExercises((current) =>
                        current.map((row) =>
                          row.id === item.id ? { ...row, sets: event.target.value === '' ? null : Number(event.target.value) } : row
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    value={item.reps ?? ''}
                    onChange={(event) =>
                      setExercises((current) =>
                        current.map((row) =>
                          row.id === item.id ? { ...row, reps: event.target.value === '' ? null : Number(event.target.value) } : row
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    value={item.distanceM ?? ''}
                    onChange={(event) =>
                      setExercises((current) =>
                        current.map((row) =>
                          row.id === item.id
                            ? { ...row, distanceM: event.target.value === '' ? null : Number(event.target.value) }
                            : row
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    value={item.durationSec ?? ''}
                    onChange={(event) =>
                      setExercises((current) =>
                        current.map((row) =>
                          row.id === item.id
                            ? { ...row, durationSec: event.target.value === '' ? null : Number(event.target.value) }
                            : row
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    value={item.notes}
                    onChange={(event) =>
                      setExercises((current) =>
                        current.map((row) => (row.id === item.id ? { ...row, notes: event.target.value } : row))
                      )
                    }
                  />
                </td>
                <td>
                  <button type="button" className="btn" onClick={() => moveExercise(index, -1)}>
                    上移
                  </button>
                  <button type="button" className="btn" onClick={() => moveExercise(index, 1)}>
                    下移
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      setExercises((current) =>
                        current.filter((row) => row.id !== item.id).map((row, sortOrder) => ({ ...row, sortOrder }))
                      )
                    }
                  >
                    删
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        <button type="button" className="btn" onClick={() => setExercises((current) => [...current, emptyExercise(current.length)])}>
          新增训练内容
        </button>
      </p>

      <h3>队员状态</h3>
      {attendance.length === 0 ? (
        <p className="exam-notes">当前没有有效在读队员。请先在「队员」里从学生库加入。</p>
      ) : (
        <div className="import-preview-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>班级</th>
                <th>状态</th>
                <th>完成度</th>
                <th>RPE 0–10</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={row.id}>
                  <td>{row.nameSnapshot}</td>
                  <td>{row.classNameSnapshot}</td>
                  <td>
                    <select
                      value={row.participation}
                      onChange={(event) =>
                        updateAttendance(row.studentId, { participation: event.target.value as TrainingParticipation })
                      }
                    >
                      {TRAINING_PARTICIPATIONS.map((item) => (
                        <option key={item} value={item}>
                          {TRAINING_PARTICIPATION_LABELS[item]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.completion}
                      onChange={(event) =>
                        updateAttendance(row.studentId, { completion: event.target.value as TrainingCompletion })
                      }
                    >
                      {TRAINING_COMPLETIONS.map((item) => (
                        <option key={item} value={item}>
                          {TRAINING_COMPLETION_LABELS[item]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.rpe ?? ''}
                      onChange={(event) =>
                        updateAttendance(row.studentId, {
                          rpe: event.target.value === '' ? null : Number(event.target.value)
                        })
                      }
                    >
                      <option value="">未填</option>
                      {Array.from({ length: 11 }, (_item, value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input value={row.note} onChange={(event) => updateAttendance(row.studentId, { note: event.target.value })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>当堂测试</h3>
      <p className="exam-notes">在本课录入的成绩会绑定本次训练（sessionId）。独立成绩请到「成绩」页录入，不挂课次。</p>
      <div className="toolbar">
        <label className="toolbar-field">
          队员
          <select value={testStudentId} onChange={(event) => setTestStudentId(event.target.value)}>
            <option value="">选择队员</option>
            {(presentRoster.length > 0 ? presentRoster : attendance).map((row) => (
              <option key={row.studentId} value={row.studentId}>
                {row.nameSnapshot}
              </option>
            ))}
          </select>
        </label>
        <label className="toolbar-field">
          项目
          <select value={testItemId} onChange={(event) => setTestItemId(event.target.value)}>
            <option value="">选择项目</option>
            {activeItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="toolbar-field">
          成绩
          <input value={testInput} onChange={(event) => setTestInput(event.target.value)} placeholder="3.39 或 12.84" />
        </label>
        <label className="toolbar-field">
          类型
          <select value={testKind} onChange={(event) => setTestKind(event.target.value as TrainingResultKind)}>
            <option value="training">{TRAINING_RESULT_KIND_LABELS.training}</option>
            <option value="competition">{TRAINING_RESULT_KIND_LABELS.competition}</option>
          </select>
        </label>
        <button type="button" className="btn" onClick={handleAddSessionTest}>
          加入本课成绩
        </button>
      </div>
      {draftResults.length === 0 ? (
        <p className="exam-notes">本课尚未加入测试成绩。</p>
      ) : (
        <div className="import-preview-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>队员</th>
                <th>项目</th>
                <th>输入</th>
                <th>类型</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {draftResults.map((draft) => {
                const name =
                  attendance.find((row) => row.studentId === draft.studentId)?.nameSnapshot ??
                  roster.find((student) => student.id === draft.studentId)?.name ??
                  '—'
                const item = items.find((entry) => entry.id === draft.itemId)
                return (
                  <tr key={draft.localId}>
                    <td>{name}</td>
                    <td>{item?.name ?? '—'}</td>
                    <td>
                      {item
                        ? (() => {
                            try {
                              const rawValue = parseScoreInput(draft.rawInput, item.valueType, item.timeInputMode)
                              return formatTrainingScoreWithUnit({
                                rawValue,
                                valueTypeSnapshot: item.valueType,
                                timeInputModeSnapshot: item.timeInputMode,
                                decimalPlacesSnapshot: item.decimalPlaces,
                                unitSnapshot: item.unit,
                                customUnitLabelSnapshot: item.customUnitLabel
                              })
                            } catch {
                              return draft.rawInput
                            }
                          })()
                        : draft.rawInput}
                    </td>
                    <td>{TRAINING_RESULT_KIND_LABELS[draft.kind]}</td>
                    <td>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setDraftResults((current) => current.filter((row) => row.localId !== draft.localId))}
                      >
                        移除
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
