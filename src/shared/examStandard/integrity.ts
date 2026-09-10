import type { ExamItemDefinition, ExamStandard } from './types'

const PLACEHOLDER_MARKERS = ['pending', 'placeholder', 'example.invalid', '待核验']

function finiteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label}不能是 NaN 或 Infinity`)
  }
}

function assertItemUnits(item: ExamItemDefinition): void {
  if (item.valueType === 'time' && item.unit !== 's') {
    throw new Error(`${item.name}时间项目单位必须是秒`)
  }
  if (item.itemKey === 'run-1000m' && item.gender !== 'male') {
    throw new Error('1000米跑必须限定男生')
  }
  if (item.itemKey === 'run-800m' && item.gender !== 'female') {
    throw new Error('800米跑必须限定女生')
  }
  if (item.itemKey === 'pull-up' && item.gender !== 'male') {
    throw new Error('引体向上必须限定男生')
  }
  if (item.itemKey === 'parallel-ladder' && item.gender !== 'female') {
    throw new Error('平行梯悬垂攀移必须限定女生')
  }
}

function assertThresholdTable(item: ExamItemDefinition, standard: ExamStandard): void {
  if (item.scoreRule.kind !== 'thresholdTable') {
    return
  }
  if (item.verification === 'verified_supported' && item.scoreRule.entries.length === 0) {
    throw new Error(`${standard.id} / ${item.id} 已核验可换算项目的评分表不能为空`)
  }
  if (item.verification === 'unverified' && item.scoreRule.entries.length > 0) {
    throw new Error(`${standard.id} / ${item.id} 未核验项目不得写入评分档`)
  }

  const scores = new Set<number>()
  for (const entry of item.scoreRule.entries) {
    finiteNumber(entry.score, `${item.name}分数`)
    finiteNumber(entry.threshold, `${item.name}阈值`)
    if (scores.has(entry.score)) {
      throw new Error(`${item.name}评分档分数重复：${entry.score}`)
    }
    scores.add(entry.score)
  }

  const ordered = [...item.scoreRule.entries].sort((a, b) => a.score - b.score)
  for (let index = 1; index < ordered.length; index += 1) {
    const prev = ordered[index - 1]
    const current = ordered[index]
    if (current.score <= prev.score) {
      throw new Error(`${item.name}分数必须严格单调递增`)
    }
    if (item.direction === 'lowerBetter' && current.threshold >= prev.threshold) {
      throw new Error(`${item.name}越低越好时，更高分档的阈值必须更小`)
    }
    if (item.direction === 'higherBetter' && current.threshold <= prev.threshold) {
      throw new Error(`${item.name}越高越好时，更高分档的阈值必须更大`)
    }
  }
}

function looksLikePlaceholder(text: string): boolean {
  const lower = text.toLowerCase()
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker.toLowerCase()))
}

export function assertExamStandardIntegrity(standard: ExamStandard): void {
  finiteNumber(standard.totalMaxScore, `${standard.id}总分`)
  finiteNumber(standard.yearFrom, `${standard.id}起始年份`)
  finiteNumber(standard.yearTo, `${standard.id}结束年份`)

  if (standard.status === 'verified' || standard.status === 'partial') {
    if (!standard.sourceUrl) {
      throw new Error(`${standard.id} ${standard.status === 'partial' ? '部分核验' : '已核验'}标准必须有官方来源链接`)
    }
    if (looksLikePlaceholder(standard.id) || looksLikePlaceholder(standard.sourceUrl) || looksLikePlaceholder(standard.title)) {
      throw new Error(`${standard.id} 不能依赖占位数据`)
    }
  }
  if (standard.status === 'partial') {
    const supported = standard.items.filter((item) => item.verification === 'verified_supported')
    if (supported.length > 0) {
      throw new Error(`${standard.id} 部分核验标准不得带可自动换算评分表`)
    }
    if (!standard.notes.includes('完整评分表待官方附件核验') && !standard.notes.includes('尚未完整核验')) {
      throw new Error(`${standard.id} 部分核验标准必须标明评分表未完整核验`)
    }
  }

  for (const item of standard.items) {
    if (item.gender !== 'male' && item.gender !== 'female' && item.gender !== 'all') {
      throw new Error(`${item.name}性别限定不正确`)
    }
    finiteNumber(item.maxScore, `${item.name}满分`)
    finiteNumber(item.decimalPlaces, `${item.name}小数位`)
    finiteNumber(item.scoreRule.maxScore, `${item.name}规则满分`)
    finiteNumber(item.scoreRule.minScore, `${item.name}规则最低分`)
    assertItemUnits(item)
    if (standard.status === 'verified' && !standard.sourceUrl) {
      throw new Error(`${item.id} 已核验项目必须有官方来源链接`)
    }
    if (item.scoreRule.kind === 'unsupported') {
      if (item.verification === 'verified_supported') {
        throw new Error(`${item.name} 不支持换算的项目不能标记为可自动评分`)
      }
      if (!item.scoreRule.reason.trim()) {
        throw new Error(`${item.name}未说明为何暂不支持换算`)
      }
      continue
    }
    if (item.verification === 'verified_unsupported') {
      throw new Error(`${item.name} 已核验但不支持换算时必须使用 unsupported 规则`)
    }
    assertThresholdTable(item, standard)
  }
}

export function assertExamCatalogIntegrity(standards: readonly ExamStandard[]): void {
  const ids = new Set<string>()
  for (const standard of standards) {
    if (ids.has(standard.id)) {
      throw new Error(`标准编号重复：${standard.id}`)
    }
    ids.add(standard.id)
    assertExamStandardIntegrity(standard)
  }

  const guangzhou = standards.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  const male1000 = guangzhou?.items.find((item) => item.id === 'male-1000m')
  if (!guangzhou || guangzhou.examType !== 'middle_school_exam') {
    throw new Error('广州中考标准缺失或被覆盖')
  }
  if (!male1000 || male1000.scoreRule.kind !== 'thresholdTable' || male1000.scoreRule.entries.length !== 21) {
    throw new Error('广州男1000米评分表被体育高考数据影响')
  }

  const gaokao = standards.find((item) => item.id === 'cn-gd-gaokao-sports-2026')
  if (!gaokao) {
    throw new Error('缺少广东省2026年体育类专业省统考标准')
  }
  if (gaokao.examType !== 'gaokao_sports' || gaokao.yearFrom !== 2026 || gaokao.yearTo !== 2026) {
    throw new Error('广东省2026年体育高考标准年份或类型不正确')
  }
  if (gaokao.sourceUrl !== 'https://eea.gd.gov.cn/ptgk/content/post_4789588.html') {
    throw new Error('体育高考官方来源链接不正确')
  }
  if (gaokao.items.some((item) => item.verification === 'verified_supported' && item.scoreRule.kind === 'unsupported')) {
    throw new Error('体育高考 unsupported 项目误入可换算状态')
  }

  const jiangmen = standards.find((item) => item.id === 'cn-gd-jiangmen-middle-2026')
  if (!jiangmen || jiangmen.status !== 'verified' || jiangmen.citySlug !== 'jiangmen') {
    throw new Error('江门2026中考标准缺失')
  }
  const jiangmen1000 = jiangmen.items.find((item) => item.id === 'male-1000m')
  if (!jiangmen1000 || jiangmen1000.scoreRule.kind !== 'thresholdTable' || jiangmen1000.scoreRule.entries.length !== 21) {
    throw new Error('江门男1000米评分表不完整')
  }
  if (male1000.scoreRule.kind === 'thresholdTable' && jiangmen1000.scoreRule.kind === 'thresholdTable') {
    const gzFull = male1000.scoreRule.entries.find((entry) => entry.score === 100)?.threshold
    const jmFull = jiangmen1000.scoreRule.entries.find((entry) => entry.score === 100)?.threshold
    if (gzFull === jmFull) {
      throw new Error('江门与广州1000米满分标准被互相覆盖')
    }
  }

  const shaoguan = standards.find((item) => item.id === 'cn-gd-shaoguan-middle-2026')
  if (!shaoguan || shaoguan.status !== 'verified' || shaoguan.scoreTableStatus !== 'verified' || shaoguan.citySlug !== 'shaoguan') {
    throw new Error('韶关2026中考标准缺失或状态不正确')
  }
  const shaoguan1000 = shaoguan.items.find((item) => item.id === 'male-1000m')
  if (
    !shaoguan1000 ||
    shaoguan1000.scoreRule.kind !== 'thresholdTable' ||
    shaoguan1000.scoreRule.scoreMode !== 'step' ||
    shaoguan1000.scoreRule.entries.length !== 121
  ) {
    throw new Error('韶关男1000米评分表不完整')
  }
  if (male1000.scoreRule.kind === 'thresholdTable') {
    const gzFull = male1000.scoreRule.entries.find((entry) => entry.score === 100)?.threshold
    const sgFull = shaoguan1000.scoreRule.entries.find((entry) => entry.score === 100)?.threshold
    if (gzFull === sgFull) {
      throw new Error('韶关与广州1000米满分标准被互相覆盖')
    }
  }

  for (const id of [
    'cn-gd-shenzhen-middle-2026',
    'cn-gd-dongguan-middle-2026-2027',
    'cn-gd-zhanjiang-middle-2026',
    'cn-gd-heyuan-middle-2026',
    'cn-gd-meizhou-middle-2026',
    'cn-gd-huizhou-middle-2026',
    'cn-gd-shanwei-middle-2026',
    'cn-gd-yangjiang-middle-2026',
    'cn-gd-maoming-middle-2026',
    'cn-gd-qingyuan-middle-2026',
    'cn-gd-chaozhou-middle-2026',
    'cn-gd-jieyang-middle-2026',
    'cn-gd-yunfu-middle-2026'
  ]) {
    const standard = standards.find((item) => item.id === id)
    if (!standard || standard.status !== 'partial') {
      throw new Error(`${id} 必须保持 partial，不得假装完整`)
    }
  }
  const heyuan = standards.find((item) => item.id === 'cn-gd-heyuan-middle-2026')
  if (!heyuan || heyuan.scoreTableStatus !== 'missing' || heyuan.totalMaxScore !== 70) {
    throw new Error('河源2026必须保持评分表未完整且体育科70分')
  }
  if (heyuan.items.some((item) => item.scoreRule.kind === 'thresholdTable')) {
    throw new Error('河源不得写入未核验评分档')
  }
  const meizhou = standards.find((item) => item.id === 'cn-gd-meizhou-middle-2026')
  if (!meizhou || meizhou.scoreTableStatus !== 'missing' || meizhou.totalMaxScore !== 90) {
    throw new Error('梅州2026必须保持评分表未完整且体育科90分')
  }
  if (meizhou.items.some((item) => item.scoreRule.kind === 'thresholdTable')) {
    throw new Error('梅州不得写入未核验评分档')
  }
  const huizhou = standards.find((item) => item.id === 'cn-gd-huizhou-middle-2026')
  if (!huizhou || huizhou.scoreTableStatus !== 'missing' || huizhou.totalMaxScore !== 64) {
    throw new Error('惠州2026必须保持评分表未完整且体育科按最近官方方案记载为64分')
  }
  if (huizhou.items.some((item) => item.scoreRule.kind === 'thresholdTable')) {
    throw new Error('惠州不得写入未核验评分档')
  }
  const shanwei = standards.find((item) => item.id === 'cn-gd-shanwei-middle-2026')
  if (!shanwei || shanwei.scoreTableStatus !== 'missing' || shanwei.status !== 'partial') {
    throw new Error('汕尾2026必须保持评分表未完整')
  }
  if (shanwei.items.some((item) => item.scoreRule.kind === 'thresholdTable')) {
    throw new Error('汕尾不得写入未核验评分档')
  }

  const zhongshan2023 = standards.find((item) => item.id === 'cn-gd-zhongshan-middle-cohort-2023')
  const zhongshan2022 = standards.find((item) => item.id === 'cn-gd-zhongshan-middle-cohort-2022')
  const zhongshanReturning = standards.find((item) => item.id === 'cn-gd-zhongshan-middle-returning')
  if (!zhongshan2023 || zhongshan2023.ruleStatus !== 'verified' || zhongshan2023.scoreTableStatus !== 'missing') {
    throw new Error('中山2023入学版本必须方案已核验且评分表未完整')
  }
  if (zhongshan2023.totalMaxScore !== 80) {
    throw new Error('中山普通应届总分必须是80')
  }
  if (!zhongshan2022 || zhongshan2022.totalMaxScore !== 50 || zhongshan2022.id === zhongshan2023.id) {
    throw new Error('中山2022入学过渡规则被覆盖')
  }
  if (!zhongshanReturning || zhongshanReturning.applicableGroups.includes('regular')) {
    throw new Error('返中山生规则不得标成普通应届生')
  }
  const yangjiang = standards.find((item) => item.id === 'cn-gd-yangjiang-middle-2026')
  if (!yangjiang || yangjiang.scoreTableStatus !== 'missing' || yangjiang.status !== 'partial' || yangjiang.totalMaxScore !== 80) {
    throw new Error('阳江2026必须保持评分表未完整且体育科按中招通知记载为80分')
  }
  if (yangjiang.items.some((item) => item.scoreRule.kind === 'thresholdTable')) {
    throw new Error('阳江不得写入未核验评分档')
  }
  const maoming = standards.find((item) => item.id === 'cn-gd-maoming-middle-2026')
  if (!maoming || maoming.ruleStatus !== 'verified' || maoming.scoreTableStatus !== 'missing' || maoming.totalMaxScore !== 70) {
    throw new Error('茂名2026必须方案已核验、评分表未完整且体育科70分')
  }
  if (maoming.items.some((item) => item.scoreRule.kind === 'thresholdTable')) {
    throw new Error('茂名不得写入未核验评分档')
  }
  const qingyuan = standards.find((item) => item.id === 'cn-gd-qingyuan-middle-2026')
  if (!qingyuan || qingyuan.scoreTableStatus !== 'missing' || qingyuan.status !== 'partial' || qingyuan.totalMaxScore !== 90) {
    throw new Error('清远2026必须保持评分表未完整且体育科按12号记载为90分')
  }
  if (qingyuan.ruleStatus !== 'partial') {
    throw new Error('清远2026实施方案原文未闭合，不得把ruleStatus升为verified')
  }
  if (qingyuan.items.some((item) => item.scoreRule.kind === 'thresholdTable')) {
    throw new Error('清远不得写入未核验评分档')
  }
  const chaozhou = standards.find((item) => item.id === 'cn-gd-chaozhou-middle-2026')
  if (!chaozhou || chaozhou.scoreTableStatus !== 'missing' || chaozhou.status !== 'partial' || chaozhou.totalMaxScore !== 70) {
    throw new Error('潮州2026必须保持评分表未完整且体育科按官方记载为70分')
  }
  if (chaozhou.ruleStatus !== 'partial') {
    throw new Error('潮州2026实施方案原文未闭合，不得把ruleStatus升为verified')
  }
  if (chaozhou.items.some((item) => item.scoreRule.kind === 'thresholdTable')) {
    throw new Error('潮州不得写入未核验评分档')
  }
  const jieyang = standards.find((item) => item.id === 'cn-gd-jieyang-middle-2026')
  if (!jieyang || jieyang.ruleStatus !== 'verified' || jieyang.scoreTableStatus !== 'missing' || jieyang.totalMaxScore !== 70) {
    throw new Error('揭阳2026必须方案已核验、评分表未完整且体育科70分')
  }
  if (jieyang.items.some((item) => item.scoreRule.kind === 'thresholdTable')) {
    throw new Error('揭阳不得写入未核验评分档')
  }
  const yunfu = standards.find((item) => item.id === 'cn-gd-yunfu-middle-2026')
  if (!yunfu || yunfu.scoreTableStatus !== 'missing' || yunfu.status !== 'partial' || yunfu.totalMaxScore !== 70) {
    throw new Error('云浮2026必须保持评分表未完整且体育科按70%计入为70分')
  }
  if (yunfu.ruleStatus !== 'partial') {
    throw new Error('云浮2026体育考试办法原文未闭合，不得把ruleStatus升为verified')
  }
  if (yunfu.items.some((item) => item.scoreRule.kind === 'thresholdTable')) {
    throw new Error('云浮不得写入未核验评分档')
  }
  const zhaoqing = standards.find((item) => item.id === 'cn-gd-zhaoqing-middle-2026')
  if (!zhaoqing || zhaoqing.ruleStatus !== 'verified' || zhaoqing.scoreTableStatus !== 'verified' || zhaoqing.totalMaxScore !== 70) {
    throw new Error('肇庆2026必须方案与评分表均已核验且体育科70分')
  }
  if (zhaoqing.status !== 'verified') {
    throw new Error('肇庆2026不得降为 partial')
  }
  const zhaoqing1000 = zhaoqing.items.find((item) => item.id === 'male-1000m')
  if (
    !zhaoqing1000 ||
    zhaoqing1000.scoreRule.kind !== 'thresholdTable' ||
    zhaoqing1000.scoreRule.scoreMode !== 'linear' ||
    zhaoqing1000.scoreRule.entries.length !== 21
  ) {
    throw new Error('肇庆男1000米评分表不完整')
  }
  for (const item of gaokao.items) {
    if (item.sourcePage == null || !Number.isInteger(item.sourcePage) || item.sourcePage < 1) {
      throw new Error(`${item.id} 缺少官方PDF页码`)
    }
  }

  assertGaokaoSupported(gaokao, 'male-100m', {
    entries: 75,
    direction: 'lowerBetter',
    unit: 's',
    gender: 'male',
    maxScore: 75,
    sourcePage: 7
  })
  assertGaokaoSupported(gaokao, 'female-100m', {
    entries: 75,
    direction: 'lowerBetter',
    unit: 's',
    gender: 'female',
    maxScore: 75,
    sourcePage: 8
  })
  assertGaokaoSupported(gaokao, 'male-standing-triple-jump', {
    entries: 75,
    direction: 'higherBetter',
    unit: 'm',
    gender: 'male',
    maxScore: 75,
    sourcePage: 11
  })
  assertGaokaoSupported(gaokao, 'female-standing-triple-jump', {
    entries: 75,
    direction: 'higherBetter',
    unit: 'm',
    gender: 'female',
    maxScore: 75,
    sourcePage: 12
  })
  assertGaokaoSupported(gaokao, 'male-shot-put', {
    entries: 75,
    direction: 'higherBetter',
    unit: 'm',
    gender: 'male',
    maxScore: 75,
    sourcePage: 15
  })
  assertGaokaoSupported(gaokao, 'female-shot-put', {
    entries: 75,
    direction: 'higherBetter',
    unit: 'm',
    gender: 'female',
    maxScore: 75,
    sourcePage: 16
  })
  assertGaokaoSupported(gaokao, 'male-push-up-20s', {
    entries: 24,
    direction: 'higherBetter',
    unit: 'times',
    gender: 'male',
    maxScore: 50,
    sourcePage: 19
  })
  assertGaokaoSupported(gaokao, 'female-push-up-15s', {
    entries: 16,
    direction: 'higherBetter',
    unit: 'times',
    gender: 'female',
    maxScore: 50,
    sourcePage: 19
  })
  assertGaokaoSupported(gaokao, 'male-v-up-20s', {
    entries: 24,
    direction: 'higherBetter',
    unit: 'times',
    gender: 'male',
    maxScore: 50,
    sourcePage: 22
  })
  assertGaokaoSupported(gaokao, 'female-v-up-20s', {
    entries: 21,
    direction: 'higherBetter',
    unit: 'times',
    gender: 'female',
    maxScore: 50,
    sourcePage: 22
  })
  assertGaokaoSupported(gaokao, 'male-figure8-run', {
    entries: 47,
    direction: 'lowerBetter',
    unit: 's',
    gender: 'male',
    maxScore: 50,
    sourcePage: 25
  })
  assertGaokaoSupported(gaokao, 'female-figure8-run', {
    entries: 47,
    direction: 'lowerBetter',
    unit: 's',
    gender: 'female',
    maxScore: 50,
    sourcePage: 26
  })
  assertGaokaoSupported(gaokao, 'special-football-male', {
    entries: 75,
    direction: 'lowerBetter',
    unit: 's',
    gender: 'male',
    maxScore: 75,
    sourcePage: 30
  })
  assertGaokaoSupported(gaokao, 'special-football-female', {
    entries: 75,
    direction: 'lowerBetter',
    unit: 's',
    gender: 'female',
    maxScore: 75,
    sourcePage: 31
  })
  assertGaokaoSupported(gaokao, 'special-basketball-male', {
    entries: 75,
    direction: 'lowerBetter',
    unit: 's',
    gender: 'male',
    maxScore: 75,
    sourcePage: 36
  })
  assertGaokaoSupported(gaokao, 'special-basketball-female', {
    entries: 75,
    direction: 'lowerBetter',
    unit: 's',
    gender: 'female',
    maxScore: 75,
    sourcePage: 37
  })
  assertGaokaoSupported(gaokao, 'special-table-tennis', {
    entries: 56,
    direction: 'higherBetter',
    unit: 'other',
    gender: 'all',
    maxScore: 75,
    sourcePage: 43
  })

  for (const id of ['special-volleyball', 'special-swim', 'special-aerobics', 'special-cheerleading']) {
    const item = gaokao.items.find((entry) => entry.id === id)
    if (!item || item.verification !== 'verified_unsupported' || item.scoreRule.kind !== 'unsupported') {
      throw new Error(`体育高考 ${id} 必须保持 verified_unsupported`)
    }
  }
}

function assertGaokaoSupported(
  standard: ExamStandard,
  itemId: string,
  expected: {
    entries: number
    direction: ExamItemDefinition['direction']
    unit: ExamItemDefinition['unit']
    gender: ExamItemDefinition['gender']
    maxScore: number
    sourcePage: number
  }
): void {
  const item = standard.items.find((entry) => entry.id === itemId)
  if (!item) {
    throw new Error(`缺少体育高考项目 ${itemId}`)
  }
  if (item.verification !== 'verified_supported' || item.scoreRule.kind !== 'thresholdTable') {
    throw new Error(`${itemId} 核验状态或规则不正确`)
  }
  if (item.scoreRule.scoreMode !== 'step') {
    throw new Error(`${itemId} 必须使用 step，不得套用中考 linear`)
  }
  if (item.scoreRule.entries.length !== expected.entries) {
    throw new Error(`${itemId} 档位数应为 ${expected.entries}，实际 ${item.scoreRule.entries.length}`)
  }
  if (item.direction !== expected.direction || item.unit !== expected.unit || item.gender !== expected.gender) {
    throw new Error(`${itemId} 方向、单位或性别不正确`)
  }
  if (item.maxScore !== expected.maxScore || item.scoreRule.maxScore !== expected.maxScore) {
    throw new Error(`${itemId} 满分不正确`)
  }
  if (item.sourcePage !== expected.sourcePage) {
    throw new Error(`${itemId} 官方PDF页码应为 ${expected.sourcePage}`)
  }
}

export function runExamTableIntegritySelfCheck(standards: readonly ExamStandard[]): void {
  assertExamCatalogIntegrity(standards)
}

export function runExamTableIntegritySelfCheckOrThrow(standards: readonly ExamStandard[]): string {
  runExamTableIntegritySelfCheck(standards)
  return 'exam table integrity self-check passed'
}
