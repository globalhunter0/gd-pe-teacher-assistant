import { buildPeSession } from '../src/renderer/src/data/peSession/buildSession'
import { buildClassroomPeTestSession } from '../src/shared/peTest/classroomQuiz'
import { BUILTIN_TEST_ITEMS } from '../src/shared/peTest/builtinItems'
import { createEmptyWeeks } from '../src/shared/teachingPlan/validate'
import { BUILTIN_TRAINING_ITEMS } from '../src/shared/trainingTeam/builtinItems'
export { parseZip } from '../src/shared/backup/zip'

const now = '2026-09-25T00:00:00.000Z'
export const klass = { id: 'class-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', className: '1班', grade: '初一' as const, academicYear: '2026-2027', semester: '第一学期' as const, studentCount: 1, status: 'active' as const, notes: '', createdAt: now, updatedAt: now }
export const pupil = { id: 'student-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', classId: klass.id, name: '测试学生', studentNo: '01', gender: 'male' as const, status: 'active' as const, notes: '', createdAt: now, updatedAt: now }
export const lesson = { id: 'w5-p1', weekday: 5, period: 1, startTime: '08:00', endTime: '08:40', team: '初一1班', courseType: 'regular' as const, classId: klass.id }
export const session = buildPeSession({ classRecord: klass, activeStudents: [pupil], date: '2026-09-25', period: 1, lessonType: 'regular', topic: '', scheduleLessonId: lesson.id, teamSnapshot: lesson.team, startTimeSnapshot: lesson.startTime, endTimeSnapshot: lesson.endTime })
export const test = buildClassroomPeTestSession({ peSession: session, testItem: BUILTIN_TEST_ITEMS.find(t => t.builtinKey === '50m')!, genderByStudentId: new Map([[pupil.id, 'male']]), nowIso: now })
test.records[0].rawValue = 8.1
test.records[0].status = 'valid'
export const plan = { ...klass, id: 'teaching-plan-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', name: '旧版教学计划', totalWeeks: 1, weeks: createEmptyWeeks(1), startDate: null, endDate: null }
export const team = { id: 'training-team-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', parentTeamId: null, name: '旧版训练队', sport: 'track', coach: '测试老师', notes: '', status: 'active', createdAt: now, updatedAt: now }
const trainingId = (kind: string) => `training-${kind}-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee`
export const trainingMember = { id: trainingId('member'), teamId: team.id, studentId: pupil.id, joinedAt: now, leftAt: null, status: 'active', nameSnapshot: pupil.name, studentNoSnapshot: pupil.studentNo, classNameSnapshot: klass.className, genderSnapshot: pupil.gender, specialty: '长跑', position: '', trainingGroup: '', trainingNotes: '', notes: '', createdAt: now, updatedAt: now }
export const trainingPlan = { id: trainingId('plan'), trainingTeamId: team.id, date: '2026-09-25', title: '历史长跑计划', goal: '', content: '长跑', notes: '', status: 'completed', createdAt: now, updatedAt: now }
export const trainingSession = { id: trainingId('session'), teamId: team.id, date: '2026-09-25', startTime: '16:00', title: '历史训练', place: '操场', durationMinutes: 40, notes: '', teamNameSnapshot: team.name, createdAt: now, updatedAt: now, planId: trainingPlan.id, exercises: [], attendance: [{ id: trainingId('attendance'), studentId: pupil.id, nameSnapshot: pupil.name, studentNoSnapshot: pupil.studentNo, classNameSnapshot: klass.className, participation: 'normal', rpe: 5, completion: 'completed', note: '' }] }
const trainingItem = BUILTIN_TRAINING_ITEMS.find(item => item.builtinKey === 'run-1000m')!
export const trainingResult = { id: trainingId('result'), teamId: team.id, studentId: pupil.id, studentNameSnapshot: pupil.name, studentNoSnapshot: pupil.studentNo, classNameSnapshot: klass.className, genderSnapshot: pupil.gender, date: '2026-09-25', itemId: trainingItem.id, itemNameSnapshot: trainingItem.name, unitSnapshot: trainingItem.unit, customUnitLabelSnapshot: '', directionSnapshot: trainingItem.direction, valueTypeSnapshot: trainingItem.valueType, timeInputModeSnapshot: trainingItem.timeInputMode, decimalPlacesSnapshot: trainingItem.decimalPlaces, rawInput: '4:05', rawValue: 245, kind: 'training', sessionId: trainingSession.id, status: 'valid', note: '历史训练成绩', createdAt: now, updatedAt: now }
export const legacy = {
  'classes.json': [klass], 'students.json': [pupil], 'schedule.json': [lesson], 'pe-sessions.json': [session],
  'pe-tests.json': [{ ...test, records: test.records.map(r => ({ ...r, examScore: 71, baseScore: 71, bonusScore: 0, scoreOutcome: 'official' })) }], 'teaching-plans.json': [plan], 'training-teams.json': [team],
  'settings.json': { teacherDisplayName: '旧版老师' },
  'training-members.json': [trainingMember], 'training-plans.json': [trainingPlan], 'training-sessions.json': [trainingSession], 'training-results.json': [trainingResult],
  'resources.json': [{ id: 'resource-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', title: '旧版附件', type: 'file', category: '其他', tags: [], description: '', notes: '', body: '', url: null, originalFileName: '历史.txt', storedFileName: 'resource-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.txt', createdAt: now, updatedAt: now }]
}
