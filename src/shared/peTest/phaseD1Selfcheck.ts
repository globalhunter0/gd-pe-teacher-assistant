import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ClassRecord } from '../class/types'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { calculateExamScore } from '../examStandard/score'
import { NATIONAL_FITNESS_2014_ID, nationalFitnessAllowsOfficialConvert } from '../nationalFitness/catalog'
import { calculateNationalFitnessScore } from '../nationalFitness/scoring/engine'
import { findOfficialNationalFitnessScoreTable } from '../nationalFitness/scoring/officialTables'
import { buildStudentItemHistory, summarizeSingleTest, summarizeStudentGrowth } from '../statistics/analytics'
import type { StudentRecord } from '../student/types'
import { BUILTIN_TEST_ITEMS } from './builtinItems'
import { buildPeTestClosure } from './detail'
import { MIDDLE_LONG_RUN_GROUP_ID, resolveActualTestItem } from './groupedItems'
import { applyQuickEntry, scoreQuickEntryRaw } from './quickEntry'
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

const NOW = '2026-09-14T02:00:00.000Z'
const CLASS_ID = 'class-d115d4a4-bbe5-4aaa-8aaa-aaaaaaaa0d10'
const DATE = '2026-09-14'

function student(seq: string, no: string, name: string, gender: StudentRecord['gender']): StudentRecord {
  return {
    id: `student-d115d4a4-bbe5-4aaa-8aaa-aaaaaaaa0d${seq}`,
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
  className: '初一D1班',
  grade: '初一',
  academicYear: '2025-2026',
  semester: '第一学期',
  studentCount: 4,
  notes: 'phase D1 temp fixture',
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

function threshold100(gender: 'male' | 'female', itemId: string): number {
  const table = findOfficialNationalFitnessScoreTable({
    grade: '初一',
    gender,
    itemId,
    standardId: NATIONAL_FITNESS_2014_ID
  })
  const band = table?.thresholdEntries.find((entry) => entry.score === 100)
  assert(band, `缺少 ${itemId} 100分档`)
  return band.threshold
}

function makeSession(options: {
  testItem: TestItem
  students: StudentRecord[]
  examStandardId: string | null
  testGroupId?: string | null
  testItemNameSnapshot?: string
  date?: string
  id?: string
}): PETestSession {
  const id = options.id ?? createPeTestId()
  const snaps = classroomScoringSnapshots(options.examStandardId)
  return {
    id,
    classId: CLASS_ID,
    testItemId: options.testItem.id,
    date: options.date ?? DATE,
    title: `${CLASS.className} · ${options.testItemNameSnapshot ?? options.testItem.name} · ${options.date ?? DATE}`,
    notes: '',
    classNameSnapshot: CLASS.className,
    gradeSnapshot: CLASS.grade,
    testItemNameSnapshot: options.testItemNameSnapshot ?? options.testItem.name,
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
    testGroupId: options.testGroupId ?? null
  }
}

function timeInputFromSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds - minutes * 60)
  if (seconds === 60) {
    return `${minutes + 1}:00`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function enterScore(session: PETestSession, studentId: string, rawSeconds: number, standard: ReturnType<typeof listBuiltinExamStandards>[number] | null) {
  const record = session.records.find((row) => row.studentId === studentId)
  assert(record, '找不到学生')
  const testItem = item(
    session.testGroupId === MIDDLE_LONG_RUN_GROUP_ID
      ? 'run-1000m'
      : (BUILTIN_TEST_ITEMS.find((entry) => entry.id === session.testItemId)?.builtinKey ?? 'run-1000m')
  )
  return applyQuickEntry({
    session,
    testItem,
    recordId: record.id,
    action: { type: 'score', input: timeInputFromSeconds(rawSeconds) },
    standard,
    nowIso: NOW,
    items: BUILTIN_TEST_ITEMS
  })
}

export function runNationalFitnessPhaseD1SelfCheck(): string {
  const options = listClassroomScoringOptions()
  assert(options[0]?.id === '' && options[0].label === '仅记录原始成绩', '评分依据含仅记录原始成绩')
  assert(options.some((item) => item.id === CLASSROOM_NATIONAL_FITNESS_STANDARD_ID && item.group === 'national-fitness'), '评分依据含国家体测')
  assert(options.some((item) => item.group === 'middle_school_exam'), '评分依据含体育中考')
  assert(options.some((item) => item.group === 'gaokao_sports'), '评分依据含体育高考')
  assert(CLASSROOM_NATIONAL_FITNESS_STANDARD_ID === NATIONAL_FITNESS_2014_ID, 'selectedStandard = cn-national-student-fitness-2014')
  const nfSnap = classroomScoringSnapshots(NATIONAL_FITNESS_2014_ID)
  assert(nfSnap.scoringCitySnapshot === '国家' && nfSnap.scoringVersionSnapshot.includes('国家学生体质健康标准'), '国家体测 snapshot')

  const run1000 = item('run-1000m')
  const run800 = item('run-800m')
  const guangzhou = listBuiltinExamStandards().find((entry) => entry.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(guangzhou, '广州中考标准')

  const nfBoySession = makeSession({ testItem: run1000, students: [BOY], examStandardId: NATIONAL_FITNESS_2014_ID })
  const boy100 = threshold100('male', 'run-1000m')
  const boyEnter = enterScore(nfBoySession, BOY.id, boy100, null)
  assert(boyEnter.ok, 'A. 初一男1000米录入')
  const boyRow = boyEnter.session.records[0]
  const boyEngine = calculateNationalFitnessScore({
    grade: '初一',
    gender: 'male',
    testItemId: run1000.id,
    testItemBuiltinKey: run1000.builtinKey,
    rawValue: boy100
  })
  assert(boyEngine.ok, 'A. 引擎可换算')
  assert(
    boyRow.rawValue === boy100 &&
      boyRow.examScore === boyEngine.finalItemScore &&
      boyRow.baseScore === boyEngine.baseScore &&
      boyRow.bonusScore === boyEngine.bonusScore &&
      boyRow.scoreOutcome === 'official' &&
      boyRow.examItemId === 'run-1000m',
    'A. 国家体测课堂保存单项分'
  )
  assert(boyEnter.session.examStandardId === NATIONAL_FITNESS_2014_ID, 'A. selectedStandard 为国家体测')

  const nfGirlSession = makeSession({ testItem: run800, students: [GIRL], examStandardId: NATIONAL_FITNESS_2014_ID })
  const girl100 = threshold100('female', 'run-800m')
  const girlEnter = enterScore(nfGirlSession, GIRL.id, girl100, null)
  assert(girlEnter.ok, 'B. 初一女800米录入')
  const girlRow = girlEnter.session.records[0]
  const girlEngine = calculateNationalFitnessScore({
    grade: '初一',
    gender: 'female',
    testItemId: run800.id,
    testItemBuiltinKey: run800.builtinKey,
    rawValue: girl100
  })
  assert(girlEngine.ok && girlRow.examScore === girlEngine.finalItemScore && girlRow.examItemId === 'run-800m', 'B. 女800米国家体测换算')

  const bonusRaw = boy100 - 4
  const bonusEnter = enterScore(
    makeSession({ testItem: run1000, students: [BOY], examStandardId: NATIONAL_FITNESS_2014_ID }),
    BOY.id,
    bonusRaw,
    null
  )
  const bonusRow = bonusEnter.ok ? bonusEnter.session.records[0] : null
  assert(
    bonusRow &&
      bonusRow.baseScore === 100 &&
      (bonusRow.bonusScore ?? 0) > 0 &&
      bonusRow.examScore === (bonusRow.baseScore ?? 0) + (bonusRow.bonusScore ?? 0),
    'C. 100分+附加分保存 base/bonus/final'
  )
  assert(formatPeTestItemScoreText(bonusRow).includes('+'), 'C. UI 展示基础+附加')

  const grouped = makeSession({
    testItem: run1000,
    students: [BOY, GIRL],
    examStandardId: NATIONAL_FITNESS_2014_ID,
    testGroupId: MIDDLE_LONG_RUN_GROUP_ID,
    testItemNameSnapshot: '800米 / 1000米'
  })
  const groupedBoy = enterScore(grouped, BOY.id, boy100, null)
  assert(groupedBoy.ok, 'D. 组合男录入')
  const groupedGirl = enterScore(groupedBoy.session, GIRL.id, girl100, null)
  assert(groupedGirl.ok, 'D. 组合女录入')
  const gb = groupedGirl.session.records.find((row) => row.studentId === BOY.id)!
  const gg = groupedGirl.session.records.find((row) => row.studentId === GIRL.id)!
  const actualBoy = resolveActualTestItem(groupedGirl.session, gb, BUILTIN_TEST_ITEMS)
  const actualGirl = resolveActualTestItem(groupedGirl.session, gg, BUILTIN_TEST_ITEMS)
  assert(actualBoy.ok && actualBoy.item.builtinKey === 'run-1000m' && gb.examItemId === 'run-1000m', 'D. 男→1000米国家体测表')
  assert(actualGirl.ok && actualGirl.item.builtinKey === 'run-800m' && gg.examItemId === 'run-800m', 'D. 女→800米国家体测表')
  assert(groupedGirl.session.testItemNameSnapshot.includes('800米') && groupedGirl.session.testItemNameSnapshot.includes('1000米'), 'D. 列表层仍显示组合名')

  const growthGirl = summarizeStudentGrowth(parsePeTestSessions([groupedGirl.session]), GIRL.id, BUILTIN_TEST_ITEMS, [GIRL], [CLASS])
  assert(growthGirl && growthGirl.items.length === 1 && growthGirl.items[0].name === '800米', 'A. 女生组合历史项目名称=800米')
  assert(growthGirl.items[0].testItemId === run800.id, 'A. resolvedActualTestItem=800米')
  assert(growthGirl.items[0].points.every((point) => point.actualItemName === '800米'), 'A. 明细实际项目=800米')
  const growthBoy = summarizeStudentGrowth(parsePeTestSessions([groupedGirl.session]), BOY.id, BUILTIN_TEST_ITEMS, [BOY], [CLASS])
  assert(growthBoy && growthBoy.items.length === 1 && growthBoy.items[0].name === '1000米', 'B. 男生组合历史项目名称=1000米')
  assert(growthBoy.items[0].testItemId === run1000.id, 'B. resolvedActualTestItem=1000米')

  const girl210 = enterScore(
    makeSession({
      testItem: run1000,
      students: [GIRL],
      examStandardId: NATIONAL_FITNESS_2014_ID,
      testGroupId: MIDDLE_LONG_RUN_GROUP_ID,
      testItemNameSnapshot: '800米 / 1000米'
    }),
    GIRL.id,
    210,
    null
  )
  assert(girl210.ok, 'C. 女生800米 3:30 录入')
  const girl210Row = girl210.session.records[0]
  assert(girl210Row.baseScore === 100 && girl210Row.bonusScore === 1 && girl210Row.examScore === 101, 'C. 100+1=101')
  const growth210 = summarizeStudentGrowth(parsePeTestSessions([girl210.session]), GIRL.id, BUILTIN_TEST_ITEMS, [GIRL], [CLASS])
  assert(growth210?.items[0]?.name === '800米' && growth210.items[0].recentScoreText.includes('100 + 1 = 101'), 'C. 历史仍显示800米')

  const girlSecond = enterScore(
    makeSession({
      testItem: run1000,
      students: [GIRL],
      examStandardId: NATIONAL_FITNESS_2014_ID,
      testGroupId: MIDDLE_LONG_RUN_GROUP_ID,
      testItemNameSnapshot: '800米 / 1000米',
      date: '2026-09-21',
      id: createPeTestId()
    }),
    GIRL.id,
    220,
    null
  )
  assert(girlSecond.ok, 'D. 第二次女生800米')
  const girlTwice = summarizeStudentGrowth(
    parsePeTestSessions([girl210.session, girlSecond.session]),
    GIRL.id,
    BUILTIN_TEST_ITEMS,
    [GIRL],
    [CLASS]
  )
  assert(girlTwice?.items.length === 1 && girlTwice.items[0].name === '800米' && girlTwice.items[0].testCount === 2, 'D. 同实际项目两次不覆盖')
  assert(girlTwice.items[0].points[0].rawValue === 210 && girlTwice.items[0].points[1].rawValue === 220, 'D. 第一次210秒仍在')

  const mixedGrowth = summarizeStudentGrowth(
    parsePeTestSessions([groupedGirl.session]),
    GIRL.id,
    BUILTIN_TEST_ITEMS,
    [GIRL],
    [CLASS]
  )
  assert(mixedGrowth && !mixedGrowth.items.some((item) => item.name === '1000米'), 'E. 女生800米不聚合到1000米')
  assert(buildStudentItemHistory(parsePeTestSessions([groupedGirl.session]), GIRL.id, run1000.id, BUILTIN_TEST_ITEMS) === null, 'E. 按1000米查女生历史为空')

  const oldGrouped = {
    ...makeSession({
      testItem: run1000,
      students: [GIRL],
      examStandardId: NATIONAL_FITNESS_2014_ID,
      testGroupId: MIDDLE_LONG_RUN_GROUP_ID,
      testItemNameSnapshot: '800米 / 1000米'
    }),
    records: [
      {
        id: createPeTestRecordId(),
        testSessionId: '',
        studentId: GIRL.id,
        nameSnapshot: GIRL.name,
        studentNoSnapshot: GIRL.studentNo,
        genderSnapshot: 'female' as const,
        rawValue: 210,
        status: 'valid' as const,
        note: '',
        createdAt: NOW,
        updatedAt: NOW,
        examScore: 101,
        rawOriginal: '3:30',
        examItemId: 'run-800m'
      }
    ]
  }
  oldGrouped.records[0].testSessionId = oldGrouped.id
  const parsedOldGroup = parsePeTestSessions([oldGrouped])
  assert(parsedOldGroup[0].records[0].resolvedTestItemId === null, 'G. 旧记录缺 resolvedTestItemId')
  const oldGrowth = summarizeStudentGrowth(parsedOldGroup, GIRL.id, BUILTIN_TEST_ITEMS, [GIRL], [CLASS])
  assert(oldGrowth?.items[0]?.name === '800米', 'G. 旧组合记录按性别确定性解析为800米')


  const belowEnter = enterScore(
    makeSession({ testItem: run1000, students: [BOY], examStandardId: NATIONAL_FITNESS_2014_ID }),
    BOY.id,
    421,
    null
  )
  const belowRow = belowEnter.ok ? belowEnter.session.records[0] : null
  assert(belowRow && belowRow.rawValue === 421 && belowRow.status === 'valid', 'E. BELOW 仍保存原始成绩')
  assert(
    belowRow.examScore === null &&
      belowRow.baseScore === null &&
      belowRow.bonusScore === null &&
      belowRow.scoreOutcome === 'below_official_minimum' &&
      belowRow.officialMinimumScore !== null,
    'E. 不生成官方 0 分'
  )
  assert(formatPeTestItemScoreText(belowRow).startsWith('低于官方评分表最低档'), 'E. UI 低于官方最低档')

  const statusSession = makeSession({ testItem: run1000, students: [BOY, GIRL, student('03', '3', '未测生', 'male')], examStandardId: NATIONAL_FITNESS_2014_ID })
  const absent = applyQuickEntry({
    session: statusSession,
    testItem: run1000,
    recordId: statusSession.records[0].id,
    action: { type: 'absent' },
    standard: null,
    nowIso: NOW
  })
  assert(absent.ok && absent.session.records[0].status === 'absent' && absent.session.records[0].examScore === null && absent.session.records[0].baseScore === null, 'F. 缺考不评分')
  const exempt = applyQuickEntry({
    session: absent.session,
    testItem: run1000,
    recordId: statusSession.records[1].id,
    action: { type: 'exempt' },
    standard: null,
    nowIso: NOW
  })
  assert(exempt.ok && exempt.session.records[1].status === 'exempt' && exempt.session.records[1].examScore === null, 'G. 免考不评分')
  const pending = applyQuickEntry({
    session: exempt.session,
    testItem: run1000,
    recordId: statusSession.records[2].id,
    action: { type: 'pending' },
    standard: null,
    nowIso: NOW
  })
  assert(pending.ok && pending.session.records[2].status === 'pending' && pending.session.records[2].examScore === null, 'H. 未测不评分')

  const rawOnly = scoreQuickEntryRaw({
    standard: null,
    examStandardId: null,
    grade: '初一',
    testItem: run1000,
    gender: 'male',
    rawValue: boy100
  })
  assert(rawOnly.examScore === null && rawOnly.baseScore === null && rawOnly.noScoreHint === null, 'I. 仅记录原始成绩不调用评分')
  const rawSession = enterScore(
    makeSession({ testItem: run1000, students: [BOY], examStandardId: null }),
    BOY.id,
    boy100,
    null
  )
  assert(rawSession.ok && rawSession.session.records[0].rawValue === boy100 && rawSession.session.records[0].examScore === null, 'I. 原始成绩入历史且 score=null')
  assert(classroomScoringLabel(rawSession.session) === '仅记录原始成绩', 'I. 评分依据为仅记录原始成绩')

  const firstHist = boyEnter.session
  const secondHist = enterScore(
    makeSession({
      testItem: run1000,
      students: [BOY],
      examStandardId: NATIONAL_FITNESS_2014_ID,
      date: '2026-09-21',
      id: createPeTestId()
    }),
    BOY.id,
    boy100 - 8,
    null
  )
  assert(secondHist.ok, 'J. 第二次测试保存')
  const parsedHist = parsePeTestSessions([firstHist, secondHist.session])
  const history = buildStudentItemHistory(parsedHist, BOY.id, run1000.id, BUILTIN_TEST_ITEMS)
  assert(history && history.points.length === 2, 'J. 同项目第二次测试新增历史，不覆盖')
  assert(history.points[0].rawValue === boy100 && history.points[1].rawValue === boy100 - 8, 'J. 第一次原始成绩仍在')
  assert(
    history.points.every((point) => point.standardLabel.includes('国家学生体质健康标准')),
    'L. 学生历史显示评分体系'
  )
  assert(history.points[0].gradeSnapshot === '初一' && history.points[0].baseScore !== null, '六. 历史含年级快照与基础分')

  const nfSameRaw = scoreQuickEntryRaw({
    standard: null,
    examStandardId: NATIONAL_FITNESS_2014_ID,
    grade: '初一',
    testItem: run1000,
    gender: 'male',
    rawValue: 222
  })
  const gzSameRaw = scoreQuickEntryRaw({
    standard: guangzhou,
    examStandardId: guangzhou.id,
    grade: '初一',
    testItem: run1000,
    gender: 'male',
    rawValue: 222
  })
  const gzEngine = calculateExamScore({
    standard: guangzhou,
    itemId: 'male-1000m',
    rawValue: 222,
    gender: 'male',
    officialOnly: true
  })
  assert(nfSameRaw.examItemId === 'run-1000m' && gzSameRaw.examItemId === 'male-1000m', 'K. 项目 ID 隔离')
  assert(gzEngine.ok && gzSameRaw.examScore === gzEngine.score, 'K. 广州中考走中考表')
  assert(nfSameRaw.examScore !== gzSameRaw.examScore, 'K. 同一原始成绩两套分值不得相同来源混淆')
  assert(nfSameRaw.scoreOutcome === 'official' && gzSameRaw.scoreOutcome === 'official', 'K. 两套都正式计分但来源不同')

  const mixedStatsSession: PETestSession = {
    ...pending.session,
    records: [
      { ...boyRow, id: createPeTestRecordId(), studentId: BOY.id, testSessionId: pending.session.id },
      {
        ...belowRow,
        id: createPeTestRecordId(),
        studentId: GIRL.id,
        testSessionId: pending.session.id,
        nameSnapshot: '低于档',
        genderSnapshot: 'male'
      },
      pending.session.records[0],
      pending.session.records[1],
      pending.session.records[2]
    ]
  }
  const summary = summarizeSingleTest(mixedStatsSession, [mixedStatsSession], run1000, [CLASS])
  assert(summary.scoredCount === 1, 'M/N. 官方分样本不含缺考/免考/未测/低于最低档')
  assert(summary.belowOfficialMinimumCount === 1, 'N. 低于最低档单独计数')
  assert(summary.averageScoreText === String(boyRow.examScore), 'M. 平均分不把缺考当 0')
  assert(summary.averageScoreText !== '0' || boyRow.examScore === 0, 'M. 缺考未拉低为 0')
  const closure = buildPeTestClosure({
    session: mixedStatsSession,
    allSessions: [mixedStatsSession],
    testItem: run1000,
    classes: [CLASS]
  })
  assert(closure.standardLabel.includes('国家学生体质健康标准'), '详情显示评分依据')
  assert(closure.rows.some((row) => row.statusLabel === '无官方分值'), 'N. UI 无官方分值')

  const legacy = makeSession({ testItem: run1000, students: [BOY], examStandardId: guangzhou.id })
  const oldJson = parsePeTestSessions([
    {
      ...legacy,
      records: [
        {
          id: createPeTestRecordId(),
          testSessionId: legacy.id,
          studentId: BOY.id,
          nameSnapshot: '男生',
          studentNoSnapshot: '1',
          genderSnapshot: 'male',
          rawValue: 222,
          status: 'valid',
          note: '',
          createdAt: NOW,
          updatedAt: NOW,
          examScore: 95,
          rawOriginal: '342',
          examItemId: 'male-1000m'
        }
      ]
    }
  ])
  assert(oldJson[0].records[0].baseScore === null && oldJson[0].records[0].scoreOutcome === null, '旧 PE Test JSON 缺省字段可读，无迁移')

  const testsPage = readSrc('src/renderer/src/pages/PeTestsPage.tsx')
  const editor = readSrc('src/renderer/src/components/PeTestEditor.tsx')
  const panel = readSrc('src/renderer/src/components/PeQuickEntryPanel.tsx')
  const scoreSrc = readSrc('src/shared/peTest/quickEntry/score.ts')
  const analyticsSrc = readSrc('src/shared/statistics/analytics.ts')
  const examScoreSrc = readSrc('src/shared/examStandard/score.ts')
  assert(testsPage.includes('listClassroomScoringOptions') && testsPage.includes('评分依据'), '新建测试评分依据')
  assert(panel.includes('listClassroomScoringOptions') && !panel.includes('calculateExamScore'), '课堂录入评分依据')
  assert(scoreSrc.includes('calculateNationalFitnessScore') && !scoreSrc.includes('calculateNationalFitnessItemScore'), '课堂调用 calculateNationalFitnessScore')
  assert(editor.includes('applyPeTestEdits') && readSrc('src/shared/peTest/editSession.ts').includes('applyQuickEntry') && editor.includes('评分体系'), '编辑保存走 session 评分依据')
  assert(analyticsSrc.includes('belowOfficialMinimumCount'), '统计口径含无官方分值')
  assert(nationalFitnessAllowsOfficialConvert() === false, 'Excel/考试入口仍不自动国标换算')
  assert(examScoreSrc.includes("code: 'NO_TABLE'"), '中考引擎仍 fail-close 国标 id')
  assert(!readSrc('src/shared/examBatch/convert.ts').includes('calculateNationalFitnessScore'), '未改 Excel 导入引擎')
  assert(!testsPage.includes('writeFileSync') && !panel.includes('app.getPath'), '未改真实 AppData')
  assert(GENDER_LINKED_TEST_GROUPS_STILL(), '未拆 800/1000 组合')

  return 'national-fitness Phase D1 self-check passed'
}

function GENDER_LINKED_TEST_GROUPS_STILL(): boolean {
  const grouped = readSrc('src/shared/peTest/groupedItems.ts')
  return grouped.includes('MIDDLE_LONG_RUN_GROUP_ID') && grouped.includes('800米') && grouped.includes('1000米')
}

export function runNationalFitnessPhaseD1SelfCheckOrThrow(): string {
  return runNationalFitnessPhaseD1SelfCheck()
}
