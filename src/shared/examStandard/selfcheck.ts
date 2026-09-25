import { listBuiltinExamStandards } from './catalog'
import { calculateExamScore, findApplicableStandard, findExamItemMapping, parseExamPerformanceInput, OFFICIAL_SCORE_PARTIAL, OFFICIAL_SCORE_SCHEME_ONLY } from './score'
import type { ExamStandard } from './types'
import { parseExamStandards } from './validate'

function fixtureStandard(id: string, yearFrom: number, yearTo: number, status: ExamStandard['status'], extra?: Partial<ExamStandard>): ExamStandard {
  const [parsed] = parseExamStandards([
    {
      id,
      examType: 'middle_school_exam',
      regionCode: 'CN-GD',
      cityCode: '440100',
      citySlug: 'guangzhou',
      cityName: '广州',
      yearFrom,
      yearTo,
      policyLabel: yearFrom === yearTo ? String(yearFrom) : `${yearFrom}–${yearTo}`,
      title: `测试用标准 ${id}`,
      sourceAuthority: status === 'verified' || status === 'partial' ? '测试机关' : '',
      sourceTitle: status === 'verified' || status === 'partial' ? '测试来源' : '',
      sourceUrl: status === 'verified' || status === 'partial' ? 'https://jyj.gz.gov.cn/selfcheck' : null,
      policySourceTitle: '',
      policySourceUrl: null,
      policyPeriod: `${yearFrom}-${yearTo}`,
      publishedAt: null,
      effectiveFrom: null,
      effectiveTo: null,
      status,
      notes: status === 'partial' ? '当前仅录入已公开核验项目，完整评分表待官方附件核验。' : '仅用于引擎自检，不是官方标准。',
      totalMaxScore: 100,
      scoring: { rounding: 'none' },
      items: [
        {
          id: 'male-1000m',
          itemKey: 'run-1000m',
          name: '1000米',
          gender: 'male',
          requirement: 'required',
          category: 'endurance',
          valueType: 'time',
          timeInputMode: 'minutesSeconds',
          unit: 's',
          customUnitLabel: '',
          direction: 'lowerBetter',
          decimalPlaces: 0,
          maxScore: 10,
          testItemBuiltinKey: 'run-1000m',
          testItemId: 'test-item-builtin-run-1000m',
          scoreRule: {
            kind: 'thresholdTable',
            scoreMode: 'step',
            maxScore: 10,
            minScore: 0,
            entries: [
              { score: 10, threshold: 220 },
              { score: 8, threshold: 240 },
              { score: 6, threshold: 260 }
            ]
          }
        },
        {
          id: 'standing-long-jump',
          itemKey: 'standing-long-jump',
          name: '立定跳远',
          gender: 'all',
          requirement: 'required',
          category: 'strength',
          valueType: 'number',
          timeInputMode: 'seconds',
          unit: 'cm',
          customUnitLabel: '',
          direction: 'higherBetter',
          decimalPlaces: 0,
          maxScore: 10,
          testItemBuiltinKey: 'standing-long-jump',
          testItemId: 'test-item-builtin-standing-long-jump',
          scoreRule: {
            kind: 'thresholdTable',
            scoreMode: 'step',
            maxScore: 10,
            minScore: 0,
            entries: [
              { score: 10, threshold: 250 },
              { score: 8, threshold: 230 },
              { score: 6, threshold: 210 }
            ]
          }
        }
      ],
      groups: [],
      components: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ...extra
    }
  ])
  return parsed
}

function linearFixture(): ExamStandard {
  const [parsed] = parseExamStandards([
    {
      id: 'cn-gd-linear-engine-fixture',
      examType: 'middle_school_exam',
      regionCode: 'CN-GD',
      cityCode: '440100',
      citySlug: 'guangzhou',
      cityName: '广州',
      yearFrom: 2024,
      yearTo: 2026,
      policyLabel: '线性插值自检',
      title: '线性插值引擎夹具',
      sourceAuthority: '测试机关',
      sourceTitle: '测试来源',
      sourceUrl: 'https://example.invalid/linear',
      policySourceTitle: '',
      policySourceUrl: null,
      policyPeriod: '2024-2026',
      publishedAt: null,
      effectiveFrom: null,
      effectiveTo: null,
      status: 'verified',
      notes: '仅用于引擎自检，不是官方完整评分表。',
      totalMaxScore: 100,
      scoring: { rounding: 'none' },
      items: [
        {
          id: 'male-1000m-linear',
          itemKey: 'run-1000m',
          name: '1000米线性插值',
          gender: 'male',
          requirement: 'required',
          category: 'endurance',
          valueType: 'time',
          timeInputMode: 'minutesSeconds',
          unit: 's',
          customUnitLabel: '',
          direction: 'lowerBetter',
          decimalPlaces: 0,
          maxScore: 100,
          testItemBuiltinKey: null,
          testItemId: null,
          scoreRule: {
            kind: 'thresholdTable',
            scoreMode: 'linear',
            maxScore: 100,
            minScore: 0,
            entries: [
              { score: 85, threshold: 242 },
              { score: 90, threshold: 235 }
            ]
          }
        },
        {
          id: 'standing-long-jump-linear',
          itemKey: 'standing-long-jump',
          name: '立定跳远线性插值',
          gender: 'all',
          requirement: 'required',
          category: 'strength',
          valueType: 'number',
          timeInputMode: 'seconds',
          unit: 'cm',
          customUnitLabel: '',
          direction: 'higherBetter',
          decimalPlaces: 0,
          maxScore: 100,
          testItemBuiltinKey: null,
          testItemId: null,
          scoreRule: {
            kind: 'thresholdTable',
            scoreMode: 'linear',
            maxScore: 100,
            minScore: 0,
            entries: [
              { score: 85, threshold: 220 },
              { score: 90, threshold: 228 }
            ]
          }
        }
      ],
      groups: [],
      components: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  ])
  return parsed
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function assertScore(itemId: string, rawValue: number, expected: number, gender: 'male' | 'female', standard: ExamStandard, message: string): void {
  const result = calculateExamScore({
    standard,
    itemId,
    rawValue,
    gender,
    officialOnly: true
  })
  assert(result.ok && result.score === expected, `${message}（得到 ${result.ok ? result.score : result.code}）`)
}

export function runExamScoreEngineSelfCheck(): void {
  const verified2026 = fixtureStandard('cn-gd-guangzhou-middle-2026', 2026, 2026, 'verified')
  const verified2027 = fixtureStandard('cn-gd-guangzhou-middle-2027-2029', 2027, 2029, 'verified', {
    items: verified2026.items.map((item) =>
      item.id === 'male-1000m'
        ? {
            ...item,
            scoreRule: {
              ...item.scoreRule,
              entries: [
                { score: 10, threshold: 210 },
                { score: 8, threshold: 230 },
                { score: 6, threshold: 250 }
              ]
            }
          }
        : item
    )
  })
  const draft = fixtureStandard('cn-gd-guangzhou-middle-draft', 2026, 2026, 'draft')
  const partial = fixtureStandard('cn-gd-guangzhou-middle-partial', 2026, 2026, 'partial')
  const deprecated = fixtureStandard('cn-gd-guangzhou-middle-old', 2024, 2024, 'deprecated')

  const jumpMax = calculateExamScore({
    standard: verified2026,
    itemId: 'standing-long-jump',
    rawValue: 250,
    gender: 'male'
  })
  assert(jumpMax.ok && jumpMax.score === 10, 'higherBetter 最高分失败')

  const jumpMid = calculateExamScore({
    standard: verified2026,
    itemId: 'standing-long-jump',
    rawValue: 230,
    gender: 'female'
  })
  assert(jumpMid.ok && jumpMid.score === 8, 'higherBetter 边界档失败')

  const jumpLow = calculateExamScore({
    standard: verified2026,
    itemId: 'standing-long-jump',
    rawValue: 209,
    gender: 'male'
  })
  assert(jumpLow.ok && jumpLow.score === 0, 'higherBetter 低于最低档失败')

  const runBest = calculateExamScore({
    standard: verified2026,
    itemId: 'male-1000m',
    rawValue: 220,
    gender: 'male'
  })
  assert(runBest.ok && runBest.score === 10, 'lowerBetter 最高分失败')

  const runBoundary = calculateExamScore({
    standard: verified2026,
    itemId: 'male-1000m',
    rawValue: 240,
    gender: 'male'
  })
  assert(runBoundary.ok && runBoundary.score === 8, 'lowerBetter 边界失败')

  const runBelow = calculateExamScore({
    standard: verified2026,
    itemId: 'male-1000m',
    rawValue: 261,
    gender: 'male'
  })
  assert(runBelow.ok && runBelow.score === 0, 'lowerBetter 低于最低档失败')

  const parsed = parseExamPerformanceInput("3:40", verified2026.items[0])
  assert(parsed === 220, '时间 3:40 解析失败')
  const parsedAlt = parseExamPerformanceInput("3'40", verified2026.items[0])
  assert(parsedAlt === 220, "时间 3'40 解析失败")
  const parsedSeconds = parseExamPerformanceInput('220秒', verified2026.items[0])
  assert(parsedSeconds === 220, '总秒数解析失败')

  const genderFail = calculateExamScore({
    standard: verified2026,
    itemId: 'male-1000m',
    rawValue: 220,
    gender: 'female'
  })
  assert(!genderFail.ok && genderFail.code === 'GENDER_MISMATCH', '性别不适用未拦截')

  const invalid = calculateExamScore({
    standard: verified2026,
    itemId: 'male-1000m',
    rawValue: Number.NaN,
    gender: 'male'
  })
  assert(!invalid.ok && invalid.code === 'INVALID_VALUE', '非法 rawValue 未拦截')

  const draftOfficial = calculateExamScore({
    standard: draft,
    itemId: 'male-1000m',
    rawValue: 220,
    gender: 'male',
    officialOnly: true
  })
  assert(!draftOfficial.ok && draftOfficial.code === 'NOT_VERIFIED', 'draft 被当成正式标准')

  const partialOfficial = calculateExamScore({
    standard: partial,
    itemId: 'male-1000m',
    rawValue: 220,
    gender: 'male',
    officialOnly: true
  })
  assert(!partialOfficial.ok && (partialOfficial.message === OFFICIAL_SCORE_PARTIAL || partialOfficial.message === OFFICIAL_SCORE_SCHEME_ONLY), 'partial 被当成完整标准')

  const deprecatedOfficial = calculateExamScore({
    standard: deprecated,
    itemId: 'male-1000m',
    rawValue: 220,
    gender: 'male',
    officialOnly: true
  })
  assert(!deprecatedOfficial.ok, 'deprecated 被当成默认正式标准')

  const catalog = [verified2026, verified2027, draft, deprecated]
  const for2026 = findApplicableStandard(catalog, { examType: 'middle_school_exam', citySlug: 'guangzhou', year: 2026 })
  const for2028 = findApplicableStandard(catalog, { examType: 'middle_school_exam', citySlug: 'guangzhou', year: 2028 })
  assert(for2026?.id === 'cn-gd-guangzhou-middle-2026', '2026 标准被覆盖')
  assert(for2028?.id === 'cn-gd-guangzhou-middle-2027-2029', '2027-2029 标准查找失败')
  assert(for2026 && for2028 && for2026.id !== for2028.id, '两个年份标准未能并存')

  const mapped = findExamItemMapping(verified2026, { testItemBuiltinKey: 'run-1000m', gender: 'male' })
  assert(mapped?.id === 'male-1000m', 'TestItem 映射失败')

  const defaultPick = findApplicableStandard(catalog, { examType: 'middle_school_exam', citySlug: 'guangzhou' })
  assert(defaultPick?.status === 'verified', '默认查找用到了非 verified 标准')

  const linear = linearFixture()
  assertScore('male-1000m-linear', 242, 85, 'male', linear, '242秒应命中85分档')
  assertScore('male-1000m-linear', 240, 86.42, 'male', linear, '240秒线性插值应为86.42')
  assertScore('male-1000m-linear', 235, 90, 'male', linear, '235秒应命中90分档')
  assertScore('male-1000m-linear', 230, 90, 'male', linear, '优于最高档应封顶')
  assertScore('male-1000m-linear', 243, 0, 'male', linear, '差于最低档应按最低分处理')

  assertScore('standing-long-jump-linear', 220, 85, 'female', linear, 'higherBetter 应命中85分档')
  assertScore('standing-long-jump-linear', 223, 86.87, 'male', linear, 'higherBetter 线性插值截断失败')
  assertScore('standing-long-jump-linear', 228, 90, 'male', linear, 'higherBetter 应命中90分档')
  assertScore('standing-long-jump-linear', 240, 90, 'female', linear, 'higherBetter 优于最高档应封顶')
  assertScore('standing-long-jump-linear', 219, 0, 'male', linear, 'higherBetter 差于最低档应按最低分处理')

  const builtins = listBuiltinExamStandards()
  const guangzhou = builtins.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(guangzhou?.status === 'verified', '广州2024-2026标准未建立')
  assert(guangzhou?.yearFrom === 2024 && guangzhou.yearTo === 2026, '广州标准适用年份不正确')
  assert(guangzhou?.sourceUrl === 'https://gzzk.gz.gov.cn/zwgk/zwdt/content/post_10742716.html', '广州标准来源链接不正确')
  assert(guangzhou?.sourceTitle === '2026年广州市中考体育考试问答', '广州标准来源标题不正确')
  assert(guangzhou?.sourceAuthority.includes('广州市招生考试委员会办公室'), '广州标准发布机关不正确')
  assert(guangzhou?.policyPeriod === '2024-2026', '广州标准适用周期不正确')
  assert(guangzhou?.policySourceUrl, '广州标准缺少政策文件链接')
  assert(guangzhou?.totalMaxScore === 70, '广州标准总分不是70')

  function entryCount(itemId: string): number {
    const found = guangzhou?.items.find((item) => item.id === itemId)
    return found && found.scoreRule.kind === 'thresholdTable' ? found.scoreRule.entries.length : 0
  }

  assert(entryCount('male-1000m') === 21, '男1000米档位数不正确')
  assert(entryCount('female-800m') === 21, '女800米档位数不正确')
  assert(entryCount('male-100m-swim') === 21, '男100米游泳档位数不正确')
  assert(entryCount('female-100m-swim') === 21, '女100米游泳档位数不正确')
  assert(entryCount('male-pull-up') === 11, '引体向上不得补录空单元格')
  assert(entryCount('female-parallel-ladder') === 13, '平行梯不得补录空单元格')

  assertScore('male-1000m', 217, 100, 'male', guangzhou!, '男1000米 217秒应为100')
  assertScore('male-1000m', 225, 95, 'male', guangzhou!, '男1000米 225秒应为95')
  assertScore('male-1000m', 235, 90, 'male', guangzhou!, '男1000米 235秒应为90')
  assertScore('male-1000m', 240, 86.42, 'male', guangzhou!, '男1000米 240秒应为86.42')
  assertScore('male-1000m', 242, 85, 'male', guangzhou!, '男1000米 242秒应为85')
  assertScore('male-1000m', 319, 0, 'male', guangzhou!, '男1000米 319秒应为0')

  assertScore('female-800m', 202, 100, 'female', guangzhou!, '女800米 202秒应为100')
  assertScore('female-800m', 220, 90, 'female', guangzhou!, '女800米 220秒应为90')
  assertScore('female-800m', 304, 0, 'female', guangzhou!, '女800米 304秒应为0')

  assertScore('male-100m-swim', 98, 100, 'male', guangzhou!, '男100米游泳 98秒应为100')
  assertScore('male-100m-swim', 120, 90, 'male', guangzhou!, '男100米游泳 120秒应为90')
  assertScore('male-100m-swim', 260, 0, 'male', guangzhou!, '男100米游泳 260秒应为0')

  assertScore('female-100m-swim', 105, 100, 'female', guangzhou!, '女100米游泳 105秒应为100')
  assertScore('female-100m-swim', 127, 90, 'female', guangzhou!, '女100米游泳 127秒应为90')
  assertScore('female-100m-swim', 267, 0, 'female', guangzhou!, '女100米游泳 267秒应为0')

  assertScore('male-standing-long-jump', 2.55, 100, 'male', guangzhou!, '立定跳远 2.55米应为100')
  assertScore('male-standing-long-jump', 2.5, 97.5, 'male', guangzhou!, '立定跳远 2.50米应为97.5')
  assertScore('male-standing-long-jump', 1.81, 0, 'male', guangzhou!, '立定跳远 1.81米应为0')
  assertScore('male-standing-long-jump', 1.8, 0, 'male',  guangzhou!, '立定跳远低于最低档应为0')

  assertScore('male-football', 47.3, 100, 'male', guangzhou!, '足球 47.3秒应为100')
  assertScore('male-football', 48, 97.08, 'male',  guangzhou!, '足球 48.0秒插值不正确')
  assertScore('male-football', 68.6, 0, 'male', guangzhou!, '足球 68.6秒应为0')
  assertScore('male-football', 70, 0, 'male',  guangzhou!, '足球差于最低档应为0')

  const quality = calculateExamScore({
    standard:  guangzhou!,
    itemId: 'quality-evaluation',
    rawValue: 20,
    gender: 'male',
    officialOnly: true
  })
  assert(!quality.ok && quality.code === 'UNSUPPORTED_MODEL', '综合评价不得给出错误分数')

  const gaokao = builtins.find((item) => item.id === 'cn-gd-gaokao-sports-2026')
  assert(gaokao?.status === 'verified', '2026体育高考标准未建立')
  assert(gaokao?.examType === 'gaokao_sports' && gaokao.yearFrom === 2026 && gaokao.yearTo === 2026, '2026体育高考年份不正确')
  assert(!builtins.some((item) => item.id === 'cn-gd-gaokao-sports-pending'), '旧占位标准仍在目录中')
  const gaokaoPick = findApplicableStandard(builtins, { examType: 'gaokao_sports', year: 2026 })
  assert(gaokaoPick?.id === 'cn-gd-gaokao-sports-2026', '2026体育高考查找失败')
  const gzStill = builtins.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  if (!gzStill) {
    throw new Error('广州标准被体育高考覆盖')
  }
  assertScore('male-1000m', 240, 86.42, 'male', gzStill, '广州1000米在体育高考数据加入后被改坏')

  const volleyball = calculateExamScore({
    standard: gaokao!,
    itemId: 'special-volleyball',
    rawValue: 30,
    gender: 'male',
    officialOnly: true
  })
  assert(!volleyball.ok && volleyball.code === 'UNSUPPORTED_MODEL', '排球专项被静默换算')
  const swim = calculateExamScore({
    standard: gaokao!,
    itemId: 'special-swim',
    rawValue: 60,
    gender: 'female',
    officialOnly: true
  })
  assert(!swim.ok && swim.code === 'UNSUPPORTED_MODEL', '游泳专项被静默换算')
  const unsupportedSpecials = ['special-volleyball', 'special-swim', 'special-aerobics', 'special-cheerleading']
  assert(
    unsupportedSpecials.every((id) => gaokao?.items.find((item) => item.id === id)?.verification === 'verified_unsupported'),
    '复合专项核验状态不正确'
  )

  const male100 = gaokao?.items.find((item) => item.id === 'male-100m')
  const female100 = gaokao?.items.find((item) => item.id === 'female-100m')
  if (!male100 || male100.verification !== 'verified_supported' || male100.scoreRule.kind !== 'thresholdTable') {
    throw new Error('男100米未核验')
  }
  if (!female100 || female100.verification !== 'verified_supported' || female100.scoreRule.kind !== 'thresholdTable') {
    throw new Error('女100米未核验')
  }
  assert(male100.scoreRule.scoreMode === 'step', '男100米不得使用线性插值')
  assert(female100.scoreRule.scoreMode === 'step', '女100米不得使用线性插值')
  assert(male100.scoreRule.entries.length === 75, '男100米档位数不是75')
  assert(female100.scoreRule.entries.length === 75, '女100米档位数不是75')
  assert(male100.sourcePage === 7 && female100.sourcePage === 8, '100米官方页码不正确')

  assertScore('male-100m', 11.48, 75, 'male', gaokao!, '男100米 11.48秒应为75')
  assertScore('male-100m', 12.22, 50, 'male', gaokao!, '男100米 12.22秒应为50')
  assertScore('male-100m', 13.87, 25, 'male', gaokao!, '男100米 13.87秒应为25')
  assertScore('male-100m', 16.65, 1, 'male', gaokao!, '男100米 16.65秒应为1')
  assertScore('male-100m', 11.5, 74, 'male', gaokao!, '男100米介于75/74档应取较低分74')
  assertScore('male-100m', 16.66, 0, 'male', gaokao!, '男100米差于1分档应为0')

  assertScore('female-100m', 13, 75, 'female', gaokao!, '女100米 13.00秒应为75')
  assertScore('female-100m', 14.01, 50, 'female', gaokao!, '女100米 14.01秒应为50')
  assertScore('female-100m', 15.89, 25, 'female', gaokao!, '女100米 15.89秒应为25')
  assertScore('female-100m', 18.05, 1, 'female', gaokao!, '女100米 18.05秒应为1')
  assertScore('female-100m', 13.02, 74, 'female', gaokao!, '女100米介于75/74档应取较低分74')
  assertScore('female-100m', 18.06, 0, 'female', gaokao!, '女100米差于1分档应为0')

  assertScore('male-standing-triple-jump', 9.5, 75, 'male', gaokao!, '男三级跳远 9.50米应为75')
  assertScore('male-standing-triple-jump', 8.75, 50, 'male', gaokao!, '男三级跳远 8.75米应为50')
  assertScore('male-standing-triple-jump', 7.7, 25, 'male', gaokao!, '男三级跳远 7.70米应为25')
  assertScore('male-standing-triple-jump', 6.5, 1, 'male', gaokao!, '男三级跳远 6.50米应为1')
  assertScore('male-standing-triple-jump', 9.49, 74, 'male', gaokao!, '男三级跳远介于75/74档应取较低分')

  assertScore('female-standing-triple-jump', 7.9, 75, 'female', gaokao!, '女三级跳远 7.90米应为75')
  assertScore('female-standing-triple-jump', 7.2, 50, 'female', gaokao!, '女三级跳远 7.20米应为50')
  assertScore('female-standing-triple-jump', 6.2, 25, 'female', gaokao!, '女三级跳远 6.20米应为25')
  assertScore('female-standing-triple-jump', 5, 1, 'female', gaokao!, '女三级跳远 5.00米应为1')

  assertScore('male-shot-put', 12.3, 75, 'male', gaokao!, '男铅球 12.30米应为75')
  assertScore('male-shot-put', 10.38, 50, 'male', gaokao!, '男铅球 10.38米应为50')
  assertScore('male-shot-put', 8.06, 25, 'male', gaokao!, '男铅球 8.06米应为25')
  assertScore('male-shot-put', 5.24, 1, 'male', gaokao!, '男铅球 5.24米应为1')

  assertScore('female-shot-put', 9.5, 75, 'female', gaokao!, '女铅球 9.50米应为75')
  assertScore('female-shot-put', 8.33, 50, 'female', gaokao!, '女铅球 8.33米应为50')
  assertScore('female-shot-put', 6.76, 25, 'female', gaokao!, '女铅球 6.76米应为25')
  assertScore('female-shot-put', 4.68, 1, 'female', gaokao!, '女铅球 4.68米应为1')

  assertScore('special-football-male', 15, 75, 'male', gaokao!, '男足球 15.0秒应为75')
  assertScore('special-football-male', 21.5, 50, 'male', gaokao!, '男足球 21.5秒应为50')
  assertScore('special-football-male', 29.8, 1, 'male', gaokao!, '男足球 29.8秒应为1')
  assertScore('special-football-male', 15.3, 74, 'male', gaokao!, '男足球介于75/74档不得插值')

  assertScore('special-basketball-male', 29.5, 75, 'male', gaokao!, '男篮球 29.5秒应为75')
  assertScore('special-basketball-male', 36, 50, 'male', gaokao!, '男篮球 36.0秒应为50')
  assertScore('special-basketball-male', 50.7, 1, 'male', gaokao!, '男篮球 50.7秒应为1')
  assertScore('special-basketball-male', 29.6, 74, 'male', gaokao!, '男篮球介于75/74档不得插值')

  assertScore('special-table-tennis', 60, 75, 'male', gaokao!, '乒乓球 60板应为75')
  assertScore('special-table-tennis', 51, 50, 'female', gaokao!, '乒乓球 51板应为50')
  assertScore('special-table-tennis', 6, 1, 'male', gaokao!, '乒乓球 6板应为1')
  assertScore('special-table-tennis', 59, 73, 'female', gaokao!, '乒乓球 59板应为73，不得补不存在的74分档插值')
}

export function runExamScoreEngineSelfCheckOrThrow(): string {
  runExamScoreEngineSelfCheck()
  return 'exam score engine self-check passed'
}
