import { GRADES } from '../class/types'
import {
  CATEGORY_TEACHER_BOOK_KEYWORDS,
  CONTENT_CATEGORIES,
  GRADE_LEVEL,
  STAGE_RULES,
  TEXTBOOK_EDITIONS,
  categoriesForLevel,
  defaultPartMinutes,
  editionsForStage,
  findEdition,
  matchTeacherBook,
  stageOfGrade
} from './index'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export function runCurriculumCatalogSelfCheckOrThrow(): string {
  const ids = new Set(TEXTBOOK_EDITIONS.map((item) => item.id))
  assert(ids.size === TEXTBOOK_EDITIONS.length, '教材版本 ID 不得重复')
  assert(editionsForStage('compulsory').length === 10, '义务教育审定目录应有 10 个版本')
  assert(editionsForStage('senior').length === 7, '普通高中审定目录应有 7 个版本')
  for (const edition of TEXTBOOK_EDITIONS) {
    assert(edition.source.url.startsWith('https://'), `${edition.id} 必须记录来源`)
    assert(edition.chiefEditors.length > 0 && edition.publisher, `${edition.id} 主编与出版社必填`)
    assert(new Set(edition.teacherBooks).size === edition.teacherBooks.length, `${edition.id} 教师用书分册重复`)
    if (edition.stage === 'compulsory') {
      assert(edition.studentBooks.length === 9, `${edition.id} 学生用书应为一至九年级各一册`)
      assert(edition.teacherBooks[0] === '基本运动技能' && edition.teacherBooks.includes('体能'), `${edition.id} 必有基本运动技能与体能分册`)
    }
  }
  assert(findEdition('shep-54-2024')?.schoolSystem === '五四学制', '沪教版为五四学制')
  assert(findEdition('missing') === null && findEdition(null) === null, '未知版本返回 null')

  const pep = findEdition('pep-2024')!
  assert(matchTeacherBook(pep, '篮球') === '篮球运动', '人教篮球分册')
  assert(matchTeacherBook(pep, '长拳', CATEGORY_TEACHER_BOOK_KEYWORDS.traditional) === '中华传统体育类运动', '按类别回退')
  assert(matchTeacherBook(pep, '橄榄球') === null, '找不到不猜测')
  const weilai = findEdition('weilai-2024')!
  assert(matchTeacherBook(weilai, '乒乓球') === '篮球·乒乓球·羽毛球', '合册分册按项目匹配')
  const esph = findEdition('esph-2024')!
  assert(matchTeacherBook(esph, '跳远', CATEGORY_TEACHER_BOOK_KEYWORDS['track-field']) === '田径', '田径回退')

  for (const grade of GRADES) {
    assert(GRADE_LEVEL[grade], `${grade} 必须映射水平`)
  }
  assert(stageOfGrade('初三') === 'compulsory' && stageOfGrade('高一') === 'senior', '学段映射')
  assert(GRADE_LEVEL['二年级'] === 'level1' && GRADE_LEVEL['四年级'] === 'level2' && GRADE_LEVEL['六年级'] === 'level3', '小学水平')

  const level1 = categoriesForLevel('level1').map((item) => item.id)
  assert(level1.includes('basic-motor') && !level1.includes('ball') && !level1.includes('fitness'), '水平一只设基本运动技能，不设专项与体能')
  const level4 = categoriesForLevel('level4').map((item) => item.id)
  assert(level4.includes('traditional') && !level4.includes('basic-motor'), '水平四含中华传统体育类')
  assert(CONTENT_CATEGORIES.filter((item) => item.specialized).length === 6, '专项运动技能六类')
  assert(!categoriesForLevel('senior').some((item) => item.id === 'interdisciplinary'), '高中无跨学科主题学习板块')

  for (const rule of Object.values(STAGE_RULES)) {
    assert(rule.load.groupDensityMinPct === 75 && rule.load.individualDensityMinPct === 50, '运动密度要求 75% / 50%')
    assert(rule.load.heartRateMin === 140 && rule.load.heartRateMax === 160, '平均心率 140～160')
    assert(rule.load.fitnessMinutesTarget === 10, '体能练习 10 分钟左右')
    assert(rule.minUnitLessons === 18, '大单元 / 模块 18 课时')
    assert(rule.standard.title.includes('2025年修订'), '必须依据 2025 年修订版课标')
  }

  const forty = defaultPartMinutes(40)
  assert(forty.opening === 2 && forty.warmup === 4 && forty.main === 30 && forty.closing === 4, '40 分钟模板分配')
  const fortyFive = defaultPartMinutes(45)
  assert(Object.values(fortyFive).reduce((a, b) => a + b, 0) === 45, '45 分钟分配合计')
  let rejected = false
  try {
    defaultPartMinutes(10)
  } catch {
    rejected = true
  }
  assert(rejected, '过短课时被拒绝')

  return `curriculum catalog self-check passed (${TEXTBOOK_EDITIONS.length} editions)`
}
