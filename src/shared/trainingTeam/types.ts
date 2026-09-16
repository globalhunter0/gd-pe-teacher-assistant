import type { StudentGender } from '../student/types'
import type { TestDirection, TestUnit, TestValueType, TimeInputMode } from '../peTest/types'

export type TrainingSport = 'track' | 'basketball' | 'football' | 'other'

export type TrainingTeamStatus = 'active' | 'archived' | 'deleted'

export type TrainingMemberStatus = 'active' | 'left'

export type TrainingParticipation = 'normal' | 'fatigued' | 'mild_discomfort' | 'limited' | 'absent'

export type TrainingCompletion = 'completed' | 'partial' | 'not_done'

export type TrainingExerciseKind = 'warmup' | 'drill' | 'repeat' | 'strength' | 'recovery' | 'other'

export type TrainingResultKind = 'training' | 'competition'

export type TrainingResultStatus = 'valid' | 'invalid'

export interface TrainingTeam {
  id: string
  parentTeamId: string | null
  name: string
  sport: TrainingSport
  coach: string
  notes: string
  status: TrainingTeamStatus
  createdAt: string
  updatedAt: string
}

export interface TrainingTeamMember {
  id: string
  teamId: string
  studentId: string
  joinedAt: string
  leftAt: string | null
  status: TrainingMemberStatus
  nameSnapshot: string
  studentNoSnapshot: string
  classNameSnapshot: string
  genderSnapshot: StudentGender
  /** 专项/主项，如 100米、后卫；旧数据可缺省为空串 */
  specialty: string
  /** 场上位置（球类等）；不适用时留空 */
  position: string
  /** 队内训练分组标签，如「短跑一组」；可与 parentTeamId 子组并存 */
  trainingGroup: string
  /** 训练备注（非医疗诊断）；旧数据可缺省为空串 */
  trainingNotes: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface TrainingExercise {
  id: string
  sortOrder: number
  name: string
  kind: TrainingExerciseKind
  sets: number | null
  reps: number | null
  distanceM: number | null
  durationSec: number | null
  notes: string
}

export interface TrainingAttendance {
  id: string
  studentId: string
  nameSnapshot: string
  studentNoSnapshot: string
  classNameSnapshot: string
  participation: TrainingParticipation
  rpe: number | null
  completion: TrainingCompletion
  note: string
}

export interface TrainingSession {
  id: string
  teamId: string
  date: string
  startTime: string
  title: string
  place: string
  durationMinutes: number | null
  notes: string
  teamNameSnapshot: string
  createdAt: string
  updatedAt: string
  exercises: TrainingExercise[]
  attendance: TrainingAttendance[]
}

export interface TrainingItem {
  id: string
  builtinKey: string | null
  name: string
  valueType: TestValueType
  timeInputMode: TimeInputMode
  unit: TestUnit
  customUnitLabel: string
  direction: TestDirection
  decimalPlaces: number
  isBuiltin: boolean
  isActive: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

export interface TrainingResult {
  id: string
  teamId: string
  studentId: string
  studentNameSnapshot: string
  studentNoSnapshot: string
  classNameSnapshot: string
  genderSnapshot: StudentGender
  date: string
  itemId: string
  itemNameSnapshot: string
  unitSnapshot: TestUnit
  customUnitLabelSnapshot: string
  directionSnapshot: TestDirection
  valueTypeSnapshot: TestValueType
  timeInputModeSnapshot: TimeInputMode
  decimalPlacesSnapshot: number
  rawInput: string
  rawValue: number
  kind: TrainingResultKind
  sessionId: string | null
  status: TrainingResultStatus
  note: string
  createdAt: string
  updatedAt: string
}

export const TRAINING_SPORTS: TrainingSport[] = ['track', 'basketball', 'football', 'other']
export const TRAINING_TEAM_STATUSES: TrainingTeamStatus[] = ['active', 'archived', 'deleted']
export const TRAINING_MEMBER_STATUSES: TrainingMemberStatus[] = ['active', 'left']
export const TRAINING_PARTICIPATIONS: TrainingParticipation[] = [
  'normal',
  'fatigued',
  'mild_discomfort',
  'limited',
  'absent'
]
export const TRAINING_COMPLETIONS: TrainingCompletion[] = ['completed', 'partial', 'not_done']
export const TRAINING_EXERCISE_KINDS: TrainingExerciseKind[] = [
  'warmup',
  'drill',
  'repeat',
  'strength',
  'recovery',
  'other'
]
export const TRAINING_RESULT_KINDS: TrainingResultKind[] = ['training', 'competition']
export const TRAINING_RESULT_STATUSES: TrainingResultStatus[] = ['valid', 'invalid']

export const TRAINING_SPORT_LABELS: Record<TrainingSport, string> = {
  track: '田径',
  basketball: '篮球',
  football: '足球',
  other: '其他'
}

export const TRAINING_TEAM_STATUS_LABELS: Record<TrainingTeamStatus, string> = {
  active: '启用',
  archived: '停用',
  deleted: '已删除'
}

export const TRAINING_MEMBER_STATUS_LABELS: Record<TrainingMemberStatus, string> = {
  active: '在队',
  left: '已退出'
}

export const TRAINING_PARTICIPATION_LABELS: Record<TrainingParticipation, string> = {
  normal: '正常',
  fatigued: '疲劳',
  mild_discomfort: '轻微不适',
  limited: '限制训练',
  absent: '缺席'
}

export const TRAINING_COMPLETION_LABELS: Record<TrainingCompletion, string> = {
  completed: '完成',
  partial: '部分完成',
  not_done: '未完成'
}

export const TRAINING_EXERCISE_KIND_LABELS: Record<TrainingExerciseKind, string> = {
  warmup: '热身',
  drill: '专项练习',
  repeat: '重复跑/组次',
  strength: '力量',
  recovery: '放松',
  other: '其他'
}

export const TRAINING_RESULT_KIND_LABELS: Record<TrainingResultKind, string> = {
  training: '训练测试',
  competition: '比赛'
}
