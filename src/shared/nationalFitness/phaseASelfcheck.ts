import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { EXAM_TYPES } from '../examStandard/types'
import { calculateExamScore } from '../examStandard/score'
import { GENDER_LINKED_TEST_GROUPS, MIDDLE_LONG_RUN_GROUP_ID, resolveActualTestItem } from '../peTest/groupedItems'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import {
  NATIONAL_FITNESS_2014_ID,
  getNationalFitness2014,
  isNationalFitnessStandardId,
  listNationalFitnessCatalog,
  nationalFitnessAllowsOfficialConvert
} from './catalog'
import { NATIONAL_FITNESS_FAMILY_LABEL, NATIONAL_STUDENT_FITNESS_FAMILY } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

function stringifyCatalog(): string {
  return JSON.stringify(listNationalFitnessCatalog())
}

export function runNationalFitnessPhaseASelfCheck(): string {
  const catalog = listNationalFitnessCatalog()
  assert(catalog.length === 1 && catalog[0] === getNationalFitness2014(), 'A. 国标 catalog 仅一份 2014 元数据')
  const meta = catalog[0]
  assert(meta.id === NATIONAL_FITNESS_2014_ID, 'A. catalog id')
  assert(meta.family === NATIONAL_STUDENT_FITNESS_FAMILY, 'A. family 独立于 ExamType')
  assert(meta.standardName === '国家学生体质健康标准（2014年修订）', 'A. 标准名称')
  assert(meta.authority === '教育部', 'A. 发布机关')
  assert(meta.version === '2014年修订', 'A. 版本')
  assert(meta.sourceDocument.includes('教体艺〔2014〕5号'), 'A. 来源文件')
  assert(meta.status === 'not_catalogued' && meta.scoreTableStatus === 'missing', 'A. 未收录评分表')
  assert(meta.scoreTables.length === 0 && meta.bonusTables.length === 0 && meta.weights.length === 0, 'A. 无评分/加分/权重数字')
  assert(nationalFitnessAllowsOfficialConvert(meta.id) === false, 'A. 禁止官方换算')
  assert(isNationalFitnessStandardId(meta.id), 'A. id 识别')

  const catalogJson = stringifyCatalog()
  assert(!/"score"\s*:/.test(catalogJson), 'E. catalog JSON 不含 score 字段')
  assert(!/"threshold"\s*:/.test(catalogJson), 'E. catalog JSON 不含 threshold 字段')
  assert(!/"entries"\s*:/.test(catalogJson), 'E. catalog JSON 不含 entries 字段')
  assert(!/"maxScore"\s*:/.test(catalogJson), 'E. catalog JSON 不含 maxScore 字段')

  assert(meta.intendedGrades.join(',') === '一年级,二年级,三年级,四年级,五年级,六年级,初一,初二,初三,高一,高二,高三', 'A. 12年级范围')
  const itemKeys = meta.intendedItems.map((item) => item.itemKey)
  assert(
    itemKeys.join(',') ===
      'height,weight,bmi,vital-capacity,50m,sit-and-reach,skip-1min,sit-up-1min,shuttle-50m-8,standing-long-jump,pull-up,run-1000m,run-800m',
    'A. 拟收录项目清单'
  )
  for (const item of meta.intendedItems) {
    if (item.testItemBuiltinKey) {
      assert(
        BUILTIN_TEST_ITEMS.some((entry) => entry.builtinKey === item.testItemBuiltinKey),
        `A. 映射日常项目存在：${item.testItemBuiltinKey}`
      )
    }
  }

  const examStandards = listBuiltinExamStandards()
  assert(
    examStandards.every((item) => item.id !== NATIONAL_FITNESS_2014_ID),
    'F. 国标 2014 未写入 BUILTIN_EXAM_STANDARDS'
  )
  assert(
    examStandards.every((item) => item.examType === 'middle_school_exam' || item.examType === 'gaokao_sports'),
    'F. ExamType 仍只有中考/高考'
  )
  assert(EXAM_TYPES.length === 2 && EXAM_TYPES[0] === 'middle_school_exam' && EXAM_TYPES[1] === 'gaokao_sports', 'F. EXAM_TYPES 未扩第三套')

  const zhongkaoProcess = examStandards.flatMap((standard) =>
    standard.examType === 'middle_school_exam'
      ? standard.items.filter((item) => item.itemKey === 'national-fitness' || item.id === 'national-fitness')
      : []
  )
  assert(zhongkaoProcess.length > 0, 'F. 中考过程项 national-fitness 仍存在')
  assert(
    zhongkaoProcess.every((item) => item.scoreRule.kind === 'unsupported'),
    'F. 中考过程项不得变成 2014 评分表'
  )

  const guangzhou = examStandards.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  const male1000 = guangzhou?.items.find((item) => item.id === 'male-1000m')
  assert(guangzhou && male1000 && male1000.scoreRule.kind === 'thresholdTable', 'A/B. 广州中考表仍在')
  if (male1000.scoreRule.kind === 'thresholdTable') {
    const scored = calculateExamScore({
      standard: guangzhou,
      itemId: 'male-1000m',
      rawValue: 217,
      gender: 'male',
      officialOnly: true
    })
    assert(scored.ok && scored.score === 100, 'A. 广州男1000米满分档未串国标')
  }

  const gaokao = examStandards.find((item) => item.id === 'cn-gd-gaokao-sports-2026')
  assert(gaokao?.examType === 'gaokao_sports', 'B. 高考标准仍在 catalog')

  const run1000 = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === 'run-1000m')
  const run800 = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === 'run-800m')
  assert(run1000 && run800, 'G. 日常 800/1000 项目存在')
  const group = GENDER_LINKED_TEST_GROUPS.find((item) => item.id === MIDDLE_LONG_RUN_GROUP_ID)
  assert(group?.displayName === '800米 / 1000米', 'G. 组合项目名称未改')
  const maleResolved = resolveActualTestItem(
    { testGroupId: MIDDLE_LONG_RUN_GROUP_ID, testItemId: run1000.id },
    { genderSnapshot: 'male', resolvedTestItemId: null }
  )
  const femaleResolved = resolveActualTestItem(
    { testGroupId: MIDDLE_LONG_RUN_GROUP_ID, testItemId: run1000.id },
    { genderSnapshot: 'female', resolvedTestItemId: null }
  )
  assert(maleResolved.ok && maleResolved.item.id === run1000.id, 'G. 男→1000米')
  assert(femaleResolved.ok && femaleResolved.item.id === run800.id, 'G. 女→800米')

  const standardsPage = readSrc('src/renderer/src/pages/ExamStandardsPage.tsx')
  assert(standardsPage.includes('NATIONAL_STUDENT_FITNESS_FAMILY'), 'IA. 评分标准页接入国标入口')
  assert(standardsPage.includes(NATIONAL_FITNESS_FAMILY_LABEL) || standardsPage.includes('NATIONAL_FITNESS_FAMILY_LABEL'), 'IA. 国标页签文案')
  assert(standardsPage.includes("browseTab === NATIONAL_STUDENT_FITNESS_FAMILY"), 'IA. 国标页与中考/高考分支隔离')
  assert(!standardsPage.includes('calculateExamScore({') || standardsPage.includes('browseTab === NATIONAL_STUDENT_FITNESS_FAMILY'), 'IA. 换算器不在国标空态误用')
  const nationalPanel = standardsPage.slice(
    standardsPage.indexOf('browseTab === NATIONAL_STUDENT_FITNESS_FAMILY'),
    standardsPage.indexOf('browseTab === NATIONAL_STUDENT_FITNESS_FAMILY') + 1800
  )
  assert(!nationalPanel.includes('calculateExamScore('), 'IA. 国标分支不调用 calculateExamScore')

  const batchPage = readSrc('src/renderer/src/pages/ExamBatchPage.tsx')
  assert(batchPage.includes('EXAM_TYPES.map'), 'F. 评分工具仍用 EXAM_TYPES')
  assert(!batchPage.includes('NATIONAL_STUDENT_FITNESS_FAMILY'), 'F. 评分工具未挂国标换算')

  const quickEntry = readSrc('src/renderer/src/components/PeQuickEntryPanel.tsx')
  assert(quickEntry.includes('listClassroomScoringOptions'), 'F. 课堂录入评分依据走共享选项')
  assert(!quickEntry.includes('listNationalFitnessCatalog'), 'F. 快速录入未直接绑国标 catalog 列表')
  assert(!quickEntry.includes('calculateNationalFitnessScore'), 'F. 快速录入面板不直接调用国标引擎')

  const examTypesSource = readSrc('src/shared/examStandard/types.ts')
  assert(
    examTypesSource.includes("export type ExamType = 'middle_school_exam' | 'gaokao_sports'"),
    'D. 未修改 ExamType schema'
  )

  const catalogModule = readSrc('src/shared/examStandard/catalog.ts')
  assert(!catalogModule.includes('NATIONAL_STUDENT_FITNESS') && !catalogModule.includes('nationalFitness'), 'F. 考试 catalog 未混入国标模块')

  return 'national-fitness Phase A self-check passed'
}

export function runNationalFitnessPhaseASelfCheckOrThrow(): string {
  return runNationalFitnessPhaseASelfCheck()
}
