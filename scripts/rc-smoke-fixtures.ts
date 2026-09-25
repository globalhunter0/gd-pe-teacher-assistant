import { buildPeSession } from '../src/renderer/src/data/peSession/buildSession'
import { buildClassroomPeTestSession } from '../src/shared/peTest/classroomQuiz'
import { BUILTIN_TEST_ITEMS } from '../src/shared/peTest/builtinItems'
import { createEmptyWeeks } from '../src/shared/teachingPlan/validate'

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
export const legacy = {
  'classes.json': [klass], 'students.json': [pupil], 'schedule.json': [lesson], 'pe-sessions.json': [session],
  'pe-tests.json': [{ ...test, records: test.records.map(r => ({ ...r, examScore: 71, baseScore: 71, bonusScore: 0, scoreOutcome: 'official' })) }], 'teaching-plans.json': [plan], 'training-teams.json': [team],
  'settings.json': { teacherDisplayName: '旧版老师' },
  'resources.json': [{ id: 'resource-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', title: '旧版附件', type: 'file', category: '其他', tags: [], description: '', notes: '', body: '', url: null, originalFileName: '历史.txt', storedFileName: 'resource-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.txt', createdAt: now, updatedAt: now }]
}
