import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ClassRecord } from '../class/types'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { calculateExamScore } from '../examStandard/score'
import { NATIONAL_FITNESS_2014_ID } from '../nationalFitness/catalog'
import { calculateNationalFitnessScore } from '../nationalFitness/scoring/engine'
import { buildStudentItemHistory, scoreBandRangeLabel, summarizeSingleTest } from '../statistics/analytics'
import type { StudentRecord } from '../student/types'
import { BUILTIN_TEST_ITEMS } from './builtinItems'
import { buildPeTestClosure } from './detail'
import { MIDDLE_LONG_RUN_GROUP_ID, linkedGenderScoreStats } from './groupedItems'
import { applyQuickEntry, QUICK_ENTRY_NO_SCORE_HINT, scoreQuickEntryRaw } from './quickEntry'
import {
  CLASSROOM_NATIONAL_FITNESS_STANDARD_ID,
  classroomScoringLabel,
  classroomScoringSnapshots,
  formatPeTestItemScoreText,
  listClassroomScoringOptions
} from './scoringBasis'
import { createPeTestId, createPeTestRecordId, parsePeTestSessions } from './validate'
import type { PETestSession, TestItem } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

const NOW = '2026-09-14T06:00:00.000Z'
const CLASS_ID = 'class-f215d4a4-bbe5-4aaa-8aaa-aaaaaaaa0f10'
const DATE = '2026-09-14'
const DATE2 = '2026-09-21'

function student(seq: string, no: string, name: string, gender: StudentRecord['gender']): StudentRecord {
  return {
    id: `student-f215d4a4-bbe5-4aaa-8aaa-aaaaaaaa0f${seq}`,
    classId: CLASS_ID,
    studentNo: no,
    name,
    gender,
    status: 'active',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW
  }
}

const CLASS: ClassRecord = {
  id: CLASS_ID,
  className: '初一闭环班',
  grade: '初一',
  academicYear: '2025-2026',
  semester: '第一学期',
  studentCount: 2,
  notes: 'pe-test business closure fixture',
  status: 'active',
  createdAt: NOW,
  updatedAt: NOW
}

const BOY = student('01', '1', '男生', 'male')
const GIRL = student('02', '2', '女生', 'female')

function item(key: string): TestItem {
  const found = BUILTIN_TEST_ITEMS.find((entry) => entry.builtinKey === key)
  assert(found, `缺少内置项目 ${key}`)
  return found
}

function makeSession(options: {
  testItem: TestItem
  students: StudentRecord[]
  examStandardId: string | null
  date?: string
  id?: string
}): PETestSession {
  const id = options.id ?? createPeTestId()
  const snaps = classroomScoringSnapshots(options.examStandardId)
  const session: PETestSession = {
    id,
    classId: CLASS_ID,
    testItemId: options.testItem.id,
    date: options.date ?? DATE,
    title: `${CLASS.className} · ${options.testItem.name} · ${options.date ?? DATE}`,
    notes: '',
    classNameSnapshot: CLASS.className,
    gradeSnapshot: CLASS.grade,
    testItemNameSnapshot: options.testItem.name,
    unitSnapshot: options.testItem.unit,
    customUnitLabelSnapshot: options.testItem.customUnitLabel,
    directionSnapshot: options.testItem.direction,
    valueTypeSnapshot: options.testItem.valueType,
    timeInputModeSnapshot: options.testItem.timeInputMode,
    createdAt: NOW,
    updatedAt: NOW,
    records: options.students.map((entry) => ({
      id: createPeTestRecordId(),
      testSessionId: id,
      studentId: entry.id,
      nameSnapshot: entry.name,
      studentNoSnapshot: entry.studentNo,
      genderSnapshot: entry.gender,
      rawValue: null,
      status: 'pending',
      note: '',
      createdAt: NOW,
      updatedAt: NOW,
      examScore: null,
      rawOriginal: '',
      examItemId: null,
      resolvedTestItemId: null,
      baseScore: null,
      bonusScore: null,
      scoreOutcome: null,
      officialMinimumScore: null
    })),
    importSource: 'manual',
    examStandardId: options.examStandardId,
    scoringCitySnapshot: snaps.scoringCitySnapshot,
    scoringVersionSnapshot: snaps.scoringVersionSnapshot,
    testGroupId: null,
    status: 'in_progress',
    completedAt: null
  }
  return session
}

function enterScore(
  session: PETestSession,
  studentId: string,
  input: string,
  standard: ReturnType<typeof listBuiltinExamStandards>[number] | null,
  testItem: TestItem
) {
  const record = session.records.find((row) => row.studentId === studentId)
  assert(record, '找不到学生')
  return applyQuickEntry({
    session,
    testItem,
    recordId: record.id,
    action: { type: 'score', input },
    standard,
    nowIso: NOW,
    items: BUILTIN_TEST_ITEMS
  })
}

function assertNoRescore(src: string, label: string): void {
  assert(!src.includes('calculateNationalFitnessScore'), `${label} 不得重算国家体测`)
  assert(!src.includes('calculateExamScore'), `${label} 不得重算中考分`)
  assert(src.includes('formatPeTestItemScoreText'), `${label} 应读取已存得分展示`)
}

export function runPeTestBusinessClosureSelfCheck(): string {
  const testsPage = readSrc('src/renderer/src/pages/PeTestsPage.tsx')
  const panel = readSrc('src/renderer/src/components/PeQuickEntryPanel.tsx')
  const editor = readSrc('src/renderer/src/components/PeTestEditor.tsx')
  const detail = readSrc('src/renderer/src/components/PeTestDetailPanel.tsx')
  const analyticsUi = readSrc('src/renderer/src/components/TestAnalyticsPanel.tsx')
  const growth = readSrc('src/renderer/src/components/StudentGrowthPanel.tsx')
  const scoreSrc = readSrc('src/shared/peTest/quickEntry/score.ts')
  const statsPanel = readSrc('src/renderer/src/components/StatsTestPanel.tsx')
  const classPage = readSrc('src/renderer/src/pages/ClassStudentsPage.tsx')
  const app = readSrc('src/renderer/src/App.tsx')

  assert(testsPage.includes('listClassroomScoringOptions') && testsPage.includes('评分依据'), '新建测试有评分依据')
  assert(testsPage.includes('创建并录入') && testsPage.includes('seed: created'), '创建后进入成绩录入')
  assert(testsPage.includes('classroomScoringLabel(item)'), '测试列表展示冻结评分依据')
  assert(panel.includes('listClassroomScoringOptions') && panel.includes('classroomScoringLabel(draft)'), '录入页展示本次评分依据')
  assert(editor.includes('readOnly') && editor.includes('classroomScoringLabel(draft)'), '编辑页评分依据只读冻结')
  assert(classPage.includes('体育成长') && app.includes('onOpenGrowth'), '班级学生有个人体育成长入口')
  assert(growth.includes('评分体系') && growth.includes('selected.points.map'), '学生历史保留同项目多次测试')
  assert(statsPanel.includes('selectPeTestSessionByActualItem'), '数据统计仍按实际项目筛选')
  assert(scoreSrc.includes('calculateNationalFitnessScore'), '课堂评分入口复用国家体测引擎')
  assert(!panel.includes('calculateNationalFitnessScore') && !editor.includes('calculateNationalFitnessScore'), '录入 UI 不内嵌分数表')
  assertNoRescore(readSrc('src/shared/peTest/detail.ts'), '测试详情')
  assertNoRescore(readSrc('src/shared/statistics/analytics.ts'), '测试分析/成长统计')
  assert(!detail.includes('calculateNationalFitnessScore') && !analyticsUi.includes('calculateExamScore'), '详情/分析 UI 不重算')
  assert(!growth.includes('calculateNationalFitnessScore'), '学生成长不重算')
  assert(analyticsUi.includes('averageRawText') && analyticsUi.includes('平均成绩'), '测试分析原始成绩读 raw')
  assert(!analyticsUi.includes('finalItemScore') && !analyticsUi.includes('examScore 非空'), '测试分析不展示内部字段名')
  assert(analyticsUi.includes('已有评分结果'), '已评分人数用自然语言')

  const options = listClassroomScoringOptions()
  const guangzhou = listBuiltinExamStandards().find((entry) => entry.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(guangzhou, '广州中考标准存在')
  assert(options[0]?.id === '' && options[0].label === '仅记录原始成绩', 'A. 仅记录原始成绩')
  assert(
    options.some((entry) => entry.id === CLASSROOM_NATIONAL_FITNESS_STANDARD_ID),
    'B. 国家体测评分依据'
  )
  assert(
    options.some((entry) => entry.id === guangzhou.id && entry.label.includes('广州')),
    'C. 广州中考评分依据'
  )

  const run1000 = item('run-1000m')
  const vital = item('vital-capacity')

  const rawOnly = makeSession({ testItem: run1000, students: [BOY], examStandardId: null })
  const rawEntered = enterScore(rawOnly, BOY.id, '4:00', null, run1000)
  assert(rawEntered.ok, '仅记录原始成绩可保存')
  const rawRow = rawEntered.session.records[0]
  assert(rawRow.status === 'valid' && rawRow.rawValue === 240, '原始成绩按项目解析')
  assert(rawRow.examScore === null && rawRow.baseScore === null && rawRow.bonusScore === null, '仅记录不得伪造评分')
  assert(rawRow.scoreOutcome === null, '仅记录无 scoreOutcome')
  assert(formatPeTestItemScoreText(rawRow) === '未评分', '有效无分显示未评分')
  assert(classroomScoringLabel(rawEntered.session) === '仅记录原始成绩', '仅记录评分依据冻结')

  const nfSession = makeSession({
    testItem: run1000,
    students: [BOY],
    examStandardId: NATIONAL_FITNESS_2014_ID
  })
  const nfEntered = enterScore(nfSession, BOY.id, '3:42', null, run1000)
  assert(nfEntered.ok, '国家体测可录入')
  const nfRow = nfEntered.session.records[0]
  const nfEngine = calculateNationalFitnessScore({
    grade: '初一',
    gender: 'male',
    testItemId: run1000.id,
    testItemBuiltinKey: run1000.builtinKey,
    rawValue: 222
  })
  assert(nfEngine.ok && nfRow.examScore === nfEngine.finalItemScore, '国家体测分来自统一引擎')
  assert(nfRow.baseScore === nfEngine.baseScore && nfRow.bonusScore === nfEngine.bonusScore, '基础分/附加分来自官方表')
  const nfDirect = scoreQuickEntryRaw({
    standard: null,
    examStandardId: NATIONAL_FITNESS_2014_ID,
    grade: '初一',
    testItem: run1000,
    gender: 'male',
    rawValue: 222
  })
  assert(nfDirect.examScore === nfRow.examScore, '课堂入口与 calculateNationalFitnessScore 一致')
  const groupedNf = {
    ...nfEntered.session,
    testGroupId: MIDDLE_LONG_RUN_GROUP_ID,
    testItemNameSnapshot: '800米 / 1000米'
  }
  const split = linkedGenderScoreStats(groupedNf, BUILTIN_TEST_ITEMS)
  const maleSplit = split.find((entry) => entry.gender === 'male')
  const femaleSplit = split.find((entry) => entry.gender === 'female')
  assert(maleSplit?.averageRawText === '3:42', '组合项目原始成绩按秒平均再格式化为分秒')
  assert(maleSplit?.averageRawText !== String(nfRow.examScore), '原始成绩不得用最终分冒充')
  assert(maleSplit?.averageScoreText === String(nfRow.examScore), '组合项目得分仍用最终单项分')
  assert(maleSplit?.valid === 1 && femaleSplit?.averageRawText === '—', '800/1000 分性别分项目统计')
  const groupedSummary = summarizeSingleTest(groupedNf, [groupedNf], run1000, [CLASS])
  assert(groupedSummary.averageScoreText === String(nfRow.examScore), '测试分析平均分仍为最终单项分')
  assert(groupedSummary.maxScoreText === String(nfRow.examScore) && groupedSummary.minScoreText === String(nfRow.examScore), '最高/最低分仍为最终单项分')
  assert(groupedSummary.bands?.counts.excellent === 1, '103 仍计入优秀')
  assert(scoreBandRangeLabel(100, 'excellent') === '≥90分', '优秀区间不截断附加分')
  assert(scoreBandRangeLabel(100, 'good').includes('80') && scoreBandRangeLabel(100, 'good').includes('90'), '良好区间文案不扩大修改')
  assert(formatPeTestItemScoreText(nfRow).includes('100') && formatPeTestItemScoreText(nfRow).includes('103'), '详情仍展示基础分+附加分=最终分')

  const gzSession = makeSession({ testItem: run1000, students: [BOY], examStandardId: guangzhou.id })
  const gzEntered = enterScore(gzSession, BOY.id, '3:42', guangzhou, run1000)
  assert(gzEntered.ok, '广州中考可录入')
  const gzRow = gzEntered.session.records[0]
  const gzEngine = calculateExamScore({
    standard: guangzhou,
    itemId: 'male-1000m',
    rawValue: 222,
    gender: 'male',
    officialOnly: true
  })
  assert(gzEngine.ok && gzRow.examScore === gzEngine.score, '广州中考走已有中考引擎')
  assert(gzRow.examScore !== nfRow.examScore, '广州中考不得被国家体测替代')

  const gzVital = scoreQuickEntryRaw({
    standard: guangzhou,
    examStandardId: guangzhou.id,
    grade: '初一',
    testItem: vital,
    gender: 'male',
    rawValue: 3000
  })
  assert(gzVital.examScore === null && gzVital.noScoreHint === QUICK_ENTRY_NO_SCORE_HINT, '广州中考无规则 fail-closed')
  const nfVital = scoreQuickEntryRaw({
    standard: null,
    examStandardId: NATIONAL_FITNESS_2014_ID,
    grade: '初一',
    testItem: vital,
    gender: 'male',
    rawValue: 3000
  })
  assert(nfVital.examItemId !== null && gzVital.examItemId === null, '同一肺活量项目国家体测仍可匹配，证明两套隔离')

  const pending = formatPeTestItemScoreText({
    status: 'pending',
    examScore: null,
    baseScore: null,
    bonusScore: null,
    scoreOutcome: null,
    officialMinimumScore: null
  })
  const absent = formatPeTestItemScoreText({
    status: 'absent',
    examScore: null,
    baseScore: null,
    bonusScore: null,
    scoreOutcome: null,
    officialMinimumScore: null
  })
  assert(pending === '—' && absent === '—', '未测/缺测得分仍为 —')

  const nfClosure = buildPeTestClosure({
    session: nfEntered.session,
    allSessions: [nfEntered.session],
    testItem: run1000,
    classes: [CLASS]
  })
  const nfSummary = summarizeSingleTest(nfEntered.session, [nfEntered.session], run1000, [CLASS])
  const nfHistory = buildStudentItemHistory([nfEntered.session], BOY.id, run1000.id, BUILTIN_TEST_ITEMS)
  assert(nfHistory, '学生历史可读本次测试')
  const storedText = formatPeTestItemScoreText(nfRow)
  assert(nfClosure.rows[0].scoreText === storedText, '详情读取已存得分')
  assert(nfHistory.points[0].scoreText === storedText, '学生历史读取已存得分')
  assert(nfSummary.scoredCount === 1 && nfSummary.averageScoreText !== '—', '分析读取已存得分')
  assert(nfClosure.summary.averageScoreText === nfSummary.averageScoreText, '详情与分析同一平均分')
  assert(
    nfClosure.rows[0].record.examScore === nfRow.examScore &&
      nfHistory.points[0].examScore === nfRow.examScore &&
      nfHistory.points[0].baseScore === nfRow.baseScore,
    '同一学生同一测试同一项目各页语义一致'
  )

  const firstHist = nfEntered.session
  const secondBase = makeSession({
    testItem: run1000,
    students: [BOY],
    examStandardId: NATIONAL_FITNESS_2014_ID,
    date: DATE2
  })
  const secondHist = enterScore(secondBase, BOY.id, '4:00', null, run1000)
  assert(secondHist.ok, '第二次测试可保存')
  const hist = buildStudentItemHistory(
    parsePeTestSessions([firstHist, secondHist.session]),
    BOY.id,
    run1000.id,
    BUILTIN_TEST_ITEMS
  )
  assert(hist && hist.points.length === 2, '同项目多次测试全部保留')
  assert(hist.points.some((point) => point.rawValue === 222) && hist.points.some((point) => point.rawValue === 240), '两次原始成绩都在')

  const legacyBase = makeSession({ testItem: run1000, students: [GIRL], examStandardId: null })
  const legacy = parsePeTestSessions([
    {
      ...legacyBase,
      records: [
        {
          id: createPeTestRecordId(),
          testSessionId: legacyBase.id,
          studentId: GIRL.id,
          nameSnapshot: '女生',
          studentNoSnapshot: '2',
          genderSnapshot: 'female',
          rawValue: 230,
          status: 'valid',
          note: '',
          createdAt: NOW,
          updatedAt: NOW,
          examScore: null,
          rawOriginal: '350'
        }
      ]
    }
  ])
  assert(legacy[0].records[0].baseScore === null && legacy[0].records[0].scoreOutcome === null, '旧 JSON 缺评分字段可读')
  assert(formatPeTestItemScoreText(legacy[0].records[0]) === '未评分', '旧有效成绩无分不伪造')
  assert(legacy[0].records[0].rawValue === 230, '旧记录仍显示原始成绩')

  return 'pe-test business closure self-check passed'
}

export function runPeTestBusinessClosureSelfCheckOrThrow(): string {
  return runPeTestBusinessClosureSelfCheck()
}
