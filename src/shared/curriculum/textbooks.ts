import type { SourceDocument, TextbookEdition, CurriculumStage } from './types'

const COMPULSORY_CATALOG: SourceDocument = {
  title: '教育部办公厅《2024年义务教育国家课程教学用书目录（根据2022年版课程标准修订）》',
  issuer: '教育部办公厅（北京市教育委员会信息公开转载）',
  url: 'https://jw.beijing.gov.cn/xxgk/2024zcwj/2024qtwj/202408/W020240905543232813376.pdf'
}

const SENIOR_CATALOG: SourceDocument = {
  title: '《2021年普通高中国家课程教学用书目录（根据2017年版课程标准修订）》',
  issuer: '教育部办公厅（北京高考在线转载）',
  url: 'https://www.gaokzx.com/c/202107/55133.html'
}

const PRIMARY_JUNIOR_BOOKS = [
  '一年级全一册',
  '二年级全一册',
  '三年级全一册',
  '四年级全一册',
  '五年级全一册',
  '六年级全一册',
  '七年级全一册',
  '八年级全一册',
  '九年级全一册'
]

function compulsory(
  id: string,
  shortName: string,
  publisher: string,
  compiler: string,
  chiefEditors: string[],
  teacherBooks: string[],
  schoolSystem: TextbookEdition['schoolSystem'] = '六三学制'
): TextbookEdition {
  return {
    id,
    stage: 'compulsory',
    shortName,
    publisher,
    compiler,
    chiefEditors,
    studentBooks: PRIMARY_JUNIOR_BOOKS,
    teacherBooks,
    schoolSystem,
    source: COMPULSORY_CATALOG
  }
}

function senior(id: string, shortName: string, publisher: string, compiler: string, chiefEditors: string[]): TextbookEdition {
  return {
    id,
    stage: 'senior',
    shortName,
    publisher,
    compiler,
    chiefEditors,
    studentBooks: ['必修全一册'],
    teacherBooks: ['必修全一册教师用书'],
    schoolSystem: '六三学制',
    source: SENIOR_CATALOG
  }
}

/**
 * 教育部审定目录中的体育与健康教材。各省不存在统一的“全省一个版本”，
 * 由地市/区县选用委员会从本目录中选用，因此由教师在创建教学设计时自选版本。
 * 只录入目录元数据（版本、主编、册次、教师用书分册），不收录教材正文。
 */
export const TEXTBOOK_EDITIONS: TextbookEdition[] = [
  compulsory('pep-2024', '人教版', '人民教育出版社', '人民教育出版社', ['马迎华', '耿培新'], [
    '基本运动技能',
    '体能',
    '足球运动',
    '篮球运动',
    '排球运动',
    '乒乓球运动',
    '羽毛球运动',
    '田径类运动',
    '体操类运动',
    '游泳运动',
    '冰雪类运动',
    '中华传统体育类运动',
    '新兴体育类运动'
  ]),
  compulsory('ecnu-2024', '华东师大版', '华东师范大学出版社', '华东师范大学', ['季浏'], [
    '基本运动技能',
    '体能',
    '篮球运动',
    '排球运动',
    '足球运动',
    '乒乓球运动',
    '羽毛球运动',
    '田径类运动',
    '体操类运动',
    '游泳运动',
    '冰雪类运动',
    '中华传统体育类运动',
    '新兴体育类运动'
  ]),
  compulsory('esph-2024', '教科版', '教育科学出版社', '教育科学出版社', ['毛振明', '于素梅'], [
    '基本运动技能',
    '体能',
    '足球',
    '篮球',
    '排球',
    '乒乓球·羽毛球·网球',
    '田径',
    '体操类运动',
    '游泳',
    '冰雪类运动',
    '武术类运动',
    '民族民间传统体育类运动',
    '新兴体育类运动'
  ]),
  compulsory('bph-2024', '北京版', '北京出版社', '北京教育科学研究院', ['罗希尧', '樊伟'], [
    '基本运动技能',
    '体能',
    '篮球运动',
    '排球运动',
    '足球运动',
    '乒乓球运动',
    '羽毛球运动',
    '游泳·滑冰·滑雪',
    '体操运动',
    '田径类运动',
    '中华传统体育项目',
    '新兴体育类运动'
  ]),
  compulsory('gph-2024', '地质版', '地质出版社', '地质出版社', ['唐炎'], [
    '基本运动技能',
    '体能',
    '足球',
    '篮球',
    '排球',
    '乒乓球',
    '羽毛球·网球',
    '田径',
    '体操',
    '游泳·滑冰·滑雪·冰球',
    '武术',
    '民族民间传统体育',
    '新兴体育类运动'
  ]),
  compulsory('ccnu-2024', '华中师大版', '华中师范大学出版社', '华中师范大学', ['王健'], [
    '基本运动技能',
    '体能',
    '足球',
    '篮球',
    '排球',
    '羽毛球',
    '乒乓球',
    '田径类运动',
    '体操类运动',
    '游泳',
    '中华传统体育类运动',
    '新兴体育类运动'
  ]),
  compulsory('hbep-2024', '冀教版', '河北教育出版社', '河北省教育科学研究院', ['李艳群', '吴键'], [
    '基本运动技能',
    '体能',
    '定向运动',
    '篮球运动',
    '足球运动',
    '乒乓球运动',
    '排球运动',
    '游泳',
    '速度滑冰·高山滑雪',
    '体操类运动',
    '田径类运动',
    '中华传统体育类运动',
    '花样跳绳·轮滑'
  ]),
  compulsory('sciencep-2024', '科学版', '科学出版社', '科学出版社', ['刘海元'], [
    '基本运动技能',
    '体能',
    '篮球运动',
    '排球运动',
    '乒乓球运动',
    '羽毛球运动',
    '足球运动',
    '田径类运动',
    '技巧与器械体操类运动',
    '艺术性体操类运动',
    '游泳·滑冰·滑雪',
    '中华传统体育类运动',
    '新兴体育类运动'
  ]),
  compulsory('weilai-2024', '未来版', '未来出版社', '未来出版社', ['庄弼'], [
    '基本运动技能',
    '体能',
    '足球·排球',
    '篮球·乒乓球·羽毛球',
    '田径类运动',
    '健美操·技巧·啦啦操',
    '游泳·速度滑冰',
    '长拳·毽球',
    '剑术·短棍',
    '花样跳绳·轮滑'
  ]),
  compulsory(
    'shep-54-2024',
    '沪教版（五·四学制）',
    '上海教育出版社',
    '上海教育出版社',
    ['汪晓赞'],
    [
      '基本运动技能',
      '体能',
      '足球运动',
      '篮球运动',
      '排球运动',
      '乒乓球运动',
      '羽毛球·网球',
      '田径类运动',
      '体操类运动',
      '游泳·滑冰',
      '武术类运动',
      '其他民族民间传统体育类运动',
      '新兴体育类运动'
    ],
    '五四学制'
  ),
  senior('pep-senior', '人教版', '人民教育出版社', '人民教育出版社', ['李志刚', '骆秉全']),
  senior('gdep-senior', '粤教版', '广东教育出版社', '广东教育出版社', ['庄弼', '邓星华']),
  senior('gxnu-senior', '广西师大版', '广西师范大学出版社', '广西师范大学出版社', ['高嵘', '张建华']),
  senior('ecnu-senior', '华东师大版', '华东师范大学出版社', '华东师范大学出版社', ['季浏']),
  senior('hbep-senior', '冀教版', '河北教育出版社', '河北省教育科学研究所', ['李艳群', '吴键']),
  senior('esph-senior', '教科版', '教育科学出版社', '教育科学出版社', ['毛振明']),
  senior('shep-senior', '沪教版', '上海教育出版社', '华东师范大学', ['汪晓赞'])
]

export function editionsForStage(stage: CurriculumStage): TextbookEdition[] {
  return TEXTBOOK_EDITIONS.filter((edition) => edition.stage === stage)
}

export function findEdition(id: string | null | undefined): TextbookEdition | null {
  if (!id) {
    return null
  }
  return TEXTBOOK_EDITIONS.find((edition) => edition.id === id) ?? null
}

export function editionLabel(edition: TextbookEdition): string {
  return `${edition.shortName}（${edition.publisher}，主编 ${edition.chiefEditors.join('、')}）`
}

/**
 * 按运动项目名在该版本教师用书分册中查找对应分册；项目名找不到时按类别关键词回退，
 * 仍找不到返回 null（不猜测）。
 */
export function matchTeacherBook(
  edition: TextbookEdition,
  sportItem: string,
  categoryKeywords: readonly string[] = []
): string | null {
  const needle = sportItem.trim()
  if (needle) {
    const exact = edition.teacherBooks.find((book) =>
      book.split('·').some((part) => part.replace(/运动$/, '') === needle.replace(/运动$/, ''))
    )
    if (exact) {
      return exact
    }
    const partial = edition.teacherBooks.find((book) => book.includes(needle))
    if (partial) {
      return partial
    }
  }
  for (const keyword of categoryKeywords) {
    const byCategory = edition.teacherBooks.find((book) => book.includes(keyword))
    if (byCategory) {
      return byCategory
    }
  }
  return null
}
