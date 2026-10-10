import { parsePeSessions } from '../shared/peSession/validate'
import type { PEClassSession } from '../shared/peSession/types'
import { loadUserJsonItems, saveUserJsonItems, userJsonPath } from './userJsonFile'
import { loadClasses } from './classStore'
import { loadStudents } from './studentStore'
import { loadSchedule } from './scheduleStore'
import { loadPeTests } from './peTestStore'
import { loadTeachingPlans } from './teachingPlanStore'
import { findExistingPeSession } from '../shared/peSession/workbenchToday'
import { isPeSessionCompleted } from '../shared/peSession/sessionStatus'
import { resolveScheduleClassroomEligibility } from '../shared/schedule/classroomEligibility'

export function getPeSessionFilePath(): string {
  return userJsonPath('pe-sessions.json')
}

export async function loadPeSessions(): Promise<PEClassSession[]> {
  return loadUserJsonItems('pe-sessions.json', parsePeSessions)
}

export async function savePeSessions(
  input: unknown,
  knownClassIds: ReadonlySet<string>
): Promise<PEClassSession[]> {
  const items = parsePeSessions(input, { knownClassIds })
  const current = await loadPeSessions()
  const [classes, students, schedule, tests] = await Promise.all([
    loadClasses(), loadStudents(), loadSchedule(), loadPeTests()
  ])
  for (const old of current) {
    if (!items.some(item => item.id === old.id) && tests.some(test => test.peSessionId === old.id)) {
      throw new Error('CLASSROOM_HAS_TESTS：本课堂有关联测评，已保留课堂与成绩，请勿删除。')
    }
  }
  for (const item of items) {
    const old = current.find(entry => entry.id === item.id)
    if (old) {
      if (old.classId !== item.classId || old.date !== item.date || old.period !== item.period ||
          old.scheduleLessonId !== item.scheduleLessonId || old.lessonType !== item.lessonType ||
          old.classNameSnapshot !== item.classNameSnapshot || old.gradeSnapshot !== item.gradeSnapshot ||
          old.teachingPlanId !== item.teachingPlanId || old.teachingPlanWeekId !== item.teachingPlanWeekId ||
          old.objectivesSnapshot !== item.objectivesSnapshot) {
        throw new Error('课堂身份不可修改，请保留原历史记录')
      }
      for (const record of old.records) {
        const next = item.records.find(entry => entry.id === record.id)
        if (!next || next.studentId !== record.studentId || next.nameSnapshot !== record.nameSnapshot ||
            next.studentNoSnapshot !== record.studentNoSnapshot) throw new Error('不能删除或改写历史课堂名单快照')
      }
      if (isPeSessionCompleted(old)) {
        const content = (value: PEClassSession) => ({ ...value, status: undefined, completedAt: undefined, updatedAt: undefined })
        if (JSON.stringify(content(old)) !== JSON.stringify(content(item))) {
          throw new Error('本节已完成，请先重新打开并保存后再编辑')
        }
      }
      for (const record of item.records.filter(entry => !old.records.some(previous => previous.id === entry.id))) {
        if (!students.some(student => student.id === record.studentId && student.classId === item.classId &&
            student.status === 'active' && student.name === record.nameSnapshot && student.studentNo === record.studentNoSnapshot)) {
          throw new Error('补充名单已变更，请重新加载后明确选择补充学生')
        }
      }
      continue
    }
    if (findExistingPeSession([...current, ...items.filter(entry => entry.id !== item.id)], { ...item, excludeId: item.id })) {
      throw new Error('CLASSROOM_DUPLICATE：该班级同日同节已有课堂，请打开原记录')
    }
    const targetClass = classes.find(entry => entry.id === item.classId && entry.status === 'active')
    if (!targetClass) {
      throw new Error('已删除或不存在的班级不能创建课堂')
    }
    if (item.classNameSnapshot !== targetClass.className || item.gradeSnapshot !== targetClass.grade) {
      throw new Error('班级信息已变更，请重新加载后开始课堂')
    }
    if (item.scheduleLessonId) {
      const lesson = schedule.find(entry => entry.id === item.scheduleLessonId)
      if (!lesson || lesson.classId !== item.classId || lesson.period !== item.period ||
          !resolveScheduleClassroomEligibility(lesson, { cellWeekday: lesson.weekday, todayWeekday: lesson.weekday, classes }).eligible) {
        throw new Error('课表已变更或不符合普通课堂条件，请重新加载')
      }
    }
    if (item.teachingPlanId || item.teachingPlanWeekId) {
      const plans = await loadTeachingPlans()
      const plan = plans.find(entry => entry.id === item.teachingPlanId)
      if (!plan || !plan.weeks.some(week => week.id === item.teachingPlanWeekId) ||
          plan.grade !== targetClass.grade || plan.academicYear !== targetClass.academicYear || plan.semester !== targetClass.semester) {
        throw new Error('教学计划关联已变更，请重新加载后开始课堂')
      }
    }
    const active = students.filter(student => student.classId === item.classId && student.status === 'active')
    if (!active.length || active.length !== item.records.length || active.some(student =>
      !item.records.some(record => record.studentId === student.id && record.nameSnapshot === student.name && record.studentNoSnapshot === student.studentNo))) {
      throw new Error('CLASSROOM_ROSTER_CHANGED：班级名单未就绪或已变更，请重新加载后开始课堂')
    }
  }
  return saveUserJsonItems('pe-sessions.json', items)
}
