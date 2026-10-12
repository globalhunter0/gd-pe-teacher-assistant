import { findContentCategory, GRADE_LEVEL, LESSON_PART_LABELS, LEVEL_LABELS, stageOfGrade, stageRuleForGrade } from '../curriculum/standards'
import type { LessonPartId } from '../curriculum/types'
import type { BigUnitDesign, CompetencyObjectives, ComplianceIssue, LessonDesign, UnitDesign } from './types'

const PART_ORDER: LessonPartId[] = ['opening', 'warmup', 'main', 'closing']
const COMPETITION_PATTERN = /赛|比拼|对抗|挑战|展示/
export const FITNESS_MINUTES_TOLERANCE = 2

function error(field: string, message: string): ComplianceIssue {
  return { severity: 'error', field, message }
}

function warning(field: string, message: string): ComplianceIssue {
  return { severity: 'warning', field, message }
}

function checkObjectives(objectives: CompetencyObjectives, severity: ComplianceIssue['severity']): ComplianceIssue[] {
  const issues: ComplianceIssue[] = []
  const labels: Array<[keyof CompetencyObjectives, string]> = [
    ['sportAbility', '运动能力'],
    ['healthBehavior', '健康行为'],
    ['sportsMorality', '体育品德']
  ]
  for (const [key, label] of labels) {
    if (!objectives[key].trim()) {
      issues.push({ severity, field: `objectives.${key}`, message: `学习目标缺少“${label}”维度，课标要求核心素养三方面目标完整。` })
    }
  }
  return issues
}

export function checkLessonCompliance(lesson: LessonDesign): ComplianceIssue[] {
  const issues: ComplianceIssue[] = []
  const rule = stageRuleForGrade(lesson.grade)
  const load = rule.load

  issues.push(...checkObjectives(lesson.objectives, 'error'))

  for (const part of PART_ORDER) {
    if (!lesson.segments.some((segment) => segment.part === part)) {
      issues.push(error('segments', `课的结构缺少“${LESSON_PART_LABELS[part]}”。`))
    }
  }
  let lastIndex = 0
  for (const segment of lesson.segments) {
    const index = PART_ORDER.indexOf(segment.part)
    if (index < lastIndex) {
      issues.push(error('segments', '课的结构顺序应为开始部分、准备部分、基本部分、结束部分。'))
      break
    }
    lastIndex = index
  }
  const totalMinutes = lesson.segments.reduce((sum, segment) => sum + segment.minutes, 0)
  if (totalMinutes !== lesson.lessonMinutes) {
    issues.push(error('segments', `各部分时间合计 ${totalMinutes} 分钟，与课时长度 ${lesson.lessonMinutes} 分钟不一致。`))
  }
  const mainSegments = lesson.segments.filter((segment) => segment.part === 'main')
  const mainMinutes = mainSegments.reduce((sum, segment) => sum + segment.minutes, 0)
  if (mainSegments.length > 0 && mainMinutes * 2 < lesson.lessonMinutes) {
    issues.push(warning('segments', '基本部分不足课时一半，学练时间偏少，课标要求让所有学生充分动起来。'))
  }
  if (
    mainSegments.length > 0 &&
    !mainSegments.some((segment) =>
      COMPETITION_PATTERN.test(`${segment.content}${segment.organization}${segment.requirements}${segment.studentActivities}`)
    )
  ) {
    issues.push(warning('segments', '基本部分未体现“赛”（比赛、对抗、挑战或展示），课标要求“学、练、赛”有机结合。'))
  }
  for (const segment of lesson.segments) {
    if (!segment.content.trim()) {
      issues.push(warning('segments', `“${LESSON_PART_LABELS[segment.part]}”的教学内容为空。`))
    }
  }

  if (lesson.load.groupDensityPct === null) {
    issues.push(warning('load.groupDensityPct', `未填写预计群体运动密度（课标要求不低于 ${load.groupDensityMinPct}%）。`))
  } else if (lesson.load.groupDensityPct < load.groupDensityMinPct) {
    issues.push(error('load.groupDensityPct', `群体运动密度 ${lesson.load.groupDensityPct}% 低于课标要求的 ${load.groupDensityMinPct}%。`))
  }
  if (lesson.load.individualDensityPct === null) {
    issues.push(warning('load.individualDensityPct', `未填写预计个体运动密度（课标要求不低于 ${load.individualDensityMinPct}%）。`))
  } else if (lesson.load.individualDensityPct < load.individualDensityMinPct) {
    issues.push(error('load.individualDensityPct', `个体运动密度 ${lesson.load.individualDensityPct}% 低于课标要求的 ${load.individualDensityMinPct}%。`))
  }
  const heartRate = lesson.load.avgHeartRate
  if (heartRate === null) {
    issues.push(warning('load.avgHeartRate', `未填写预计平均心率（课标要求 ${load.heartRateMin}～${load.heartRateMax} 次/分）。`))
  } else if (heartRate < load.heartRateMin || heartRate > load.heartRateMax) {
    issues.push(error('load.avgHeartRate', `预计平均心率 ${heartRate} 次/分，不在课标要求的 ${load.heartRateMin}～${load.heartRateMax} 次/分。`))
  }
  if (lesson.load.peakHeartRate !== null && heartRate !== null && lesson.load.peakHeartRate < heartRate) {
    issues.push(warning('load.peakHeartRate', '最高心率低于平均心率，请核对。'))
  }
  const fitness = lesson.load.fitnessMinutes
  if (fitness === null) {
    issues.push(warning('load.fitnessMinutes', `未填写体能练习时间（课标要求每节课 ${load.fitnessMinutesTarget} 分钟左右）。`))
  } else if (Math.abs(fitness - load.fitnessMinutesTarget) > FITNESS_MINUTES_TOLERANCE) {
    issues.push(warning('load.fitnessMinutes', `体能练习 ${fitness} 分钟，课标要求每节课 ${load.fitnessMinutesTarget} 分钟左右。`))
  }

  const required: Array<[keyof LessonDesign, string]> = [
    ['content', '教学内容'],
    ['safetyPlan', rule.stage === 'senior' ? '安全防范措施' : '安全预案'],
    ['keyPoint', '重点'],
    ['difficulty', '难点'],
    ['venueEquipment', '场地器材']
  ]
  for (const [key, label] of required) {
    const value = lesson[key]
    if (typeof value === 'string' && !value.trim()) {
      issues.push(warning(key, `“${label}”未填写。`))
    }
  }
  return issues
}

export function checkBigUnitCompliance(bigUnit: BigUnitDesign): ComplianceIssue[] {
  const issues: ComplianceIssue[] = []
  const level = GRADE_LEVEL[bigUnit.grade]
  const stage = stageOfGrade(bigUnit.grade)
  const rule = stageRuleForGrade(bigUnit.grade)
  const category = findContentCategory(bigUnit.categoryId)

  if (!category) {
    issues.push(error('categoryId', '课程内容类别不存在。'))
  } else {
    if (!category.levels.includes(level)) {
      issues.push(
        error(
          'categoryId',
          level === 'level1' && category.specialized
            ? '水平一（1～2年级）不设专项运动技能，应以体育游戏发展基本运动技能。'
            : `“${category.name}”不属于${LEVEL_LABELS[level]}的课程内容。`
        )
      )
    }
    if (category.specialized && stage === 'compulsory' && bigUnit.totalLessons < rule.minUnitLessons) {
      issues.push(error('totalLessons', `专项运动技能大单元应为 ${rule.minUnitLessons} 课时及以上，当前 ${bigUnit.totalLessons} 课时。`))
    }
  }
  if (stage === 'senior' && bigUnit.totalLessons !== rule.minUnitLessons) {
    issues.push(warning('totalLessons', `高中 1 个模块一般为 ${rule.minUnitLessons} 课时，当前 ${bigUnit.totalLessons} 课时。`))
  }

  issues.push(...checkObjectives(bigUnit.objectives, 'error'))
  if (!bigUnit.keyPoints.trim()) {
    issues.push(warning('keyPoints', '教学重点未填写。'))
  }
  if (!bigUnit.difficulties.trim()) {
    issues.push(warning('difficulties', '教学难点未填写。'))
  }
  if (!bigUnit.assessment.trim()) {
    issues.push(warning('assessment', '学习评价未填写。'))
  }
  if (!bigUnit.safety.trim()) {
    issues.push(warning('safety', '安全保障措施未填写。'))
  }

  if (bigUnit.unitOutline.length === 0) {
    issues.push(warning('unitOutline', '尚未划分单元。'))
  } else {
    const sorted = [...bigUnit.unitOutline].sort((a, b) => a.lessonFrom - b.lessonFrom)
    let expected = 1
    for (const item of sorted) {
      if (item.lessonFrom > item.lessonTo || item.lessonFrom !== expected) {
        issues.push(error('unitOutline', `单元划分的课次不连续：应从第 ${expected} 课时开始，实际为“${item.title || '未命名单元'}”第 ${item.lessonFrom}～${item.lessonTo} 课时。`))
        expected = -1
        break
      }
      expected = item.lessonTo + 1
    }
    if (expected !== -1 && expected - 1 !== bigUnit.totalLessons) {
      issues.push(error('unitOutline', `单元划分覆盖到第 ${expected - 1} 课时，与总课时 ${bigUnit.totalLessons} 不一致。`))
    }
  }
  return issues
}

export function checkUnitCompliance(unit: UnitDesign, bigUnit: BigUnitDesign | null): ComplianceIssue[] {
  const issues: ComplianceIssue[] = []
  if (!bigUnit) {
    issues.push(error('bigUnitId', '所属大单元已不存在。'))
  } else if (unit.lessonTo > bigUnit.totalLessons) {
    issues.push(error('lessonTo', `单元课次（第 ${unit.lessonFrom}～${unit.lessonTo} 课时）超出大单元总课时 ${bigUnit.totalLessons}。`))
  }
  issues.push(...checkObjectives(unit.objectives, 'warning'))
  const expected = unit.lessonTo - unit.lessonFrom + 1
  const numbers = new Set(unit.lessonSchedule.map((item) => item.lessonNo))
  for (const item of unit.lessonSchedule) {
    if (item.lessonNo < unit.lessonFrom || item.lessonNo > unit.lessonTo) {
      issues.push(error('lessonSchedule', `课次安排中的第 ${item.lessonNo} 课时不在本单元范围内。`))
    }
  }
  if (numbers.size !== unit.lessonSchedule.length) {
    issues.push(error('lessonSchedule', '课次安排中有重复课次。'))
  }
  if (unit.lessonSchedule.length !== expected) {
    issues.push(warning('lessonSchedule', `本单元共 ${expected} 课时，课次安排有 ${unit.lessonSchedule.length} 条。`))
  }
  return issues
}

export function countIssues(issues: ReadonlyArray<ComplianceIssue>): { errors: number; warnings: number } {
  let errors = 0
  let warnings = 0
  for (const issue of issues) {
    if (issue.severity === 'error') {
      errors += 1
    } else {
      warnings += 1
    }
  }
  return { errors, warnings }
}
