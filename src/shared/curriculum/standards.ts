import type { Grade } from '../class/types'
import type {
  ContentCategory,
  ContentCategoryId,
  CurriculumLevel,
  CurriculumStage,
  LessonPartDefinition,
  LessonPartId,
  SourceDocument,
  StageRule
} from './types'

export const COMPULSORY_STANDARD: SourceDocument = {
  title: '《义务教育体育与健康课程标准（2022年版2025年修订）》',
  issuer: '中华人民共和国教育部',
  url: 'https://ty.ynau.edu.cn/info/1075/5486.htm'
}

export const SENIOR_STANDARD: SourceDocument = {
  title: '《普通高中体育与健康课程标准（2017年版2025年修订）》',
  issuer: '中华人民共和国教育部',
  url: 'https://ty.ynau.edu.cn/info/1075/5496.htm'
}

export const GRADE_LEVEL: Record<Grade, CurriculumLevel> = {
  一年级: 'level1',
  二年级: 'level1',
  三年级: 'level2',
  四年级: 'level2',
  五年级: 'level3',
  六年级: 'level3',
  初一: 'level4',
  初二: 'level4',
  初三: 'level4',
  高一: 'senior',
  高二: 'senior',
  高三: 'senior'
}

export const LEVEL_LABELS: Record<CurriculumLevel, string> = {
  level1: '水平一（1～2年级）',
  level2: '水平二（3～4年级）',
  level3: '水平三（5～6年级）',
  level4: '水平四（7～9年级）',
  senior: '高中（必修必学 / 必修选学模块）'
}

export function stageOfGrade(grade: Grade): CurriculumStage {
  return GRADE_LEVEL[grade] === 'senior' ? 'senior' : 'compulsory'
}

const COMPULSORY_SPECIALIZED: CurriculumLevel[] = ['level2', 'level3', 'level4', 'senior']

/** 课程内容结构（义务教育课标图1、表2；高中课标“课程结构”）。项目举例取自课标原文，可自定义补充。 */
export const CONTENT_CATEGORIES: ContentCategory[] = [
  {
    id: 'basic-motor',
    name: '基本运动技能',
    specialized: false,
    levels: ['level1'],
    items: ['移动性技能', '非移动性技能', '操控性技能']
  },
  {
    id: 'fitness',
    name: '体能',
    specialized: false,
    levels: ['level2', 'level3', 'level4', 'senior'],
    items: ['体能综合练习', '心肺耐力', '肌肉力量与耐力', '速度与灵敏', '柔韧与平衡']
  },
  {
    id: 'health',
    name: '健康教育',
    specialized: false,
    levels: ['level1', 'level2', 'level3', 'level4', 'senior'],
    items: ['健康行为与生活方式', '生长发育与青春期保健', '心理健康', '疾病预防与突发公共卫生事件应对', '安全应急与避险']
  },
  {
    id: 'ball',
    name: '球类运动',
    specialized: true,
    levels: COMPULSORY_SPECIALIZED,
    items: ['篮球', '足球', '排球', '乒乓球', '羽毛球', '网球', '手球', '橄榄球']
  },
  {
    id: 'track-field',
    name: '田径类运动',
    specialized: true,
    levels: COMPULSORY_SPECIALIZED,
    items: ['短跑', '中长跑', '跨栏跑', '接力跑', '跳高', '跳远', '推铅球', '掷实心球', '掷垒球']
  },
  {
    id: 'gymnastics',
    name: '体操类运动',
    specialized: true,
    levels: COMPULSORY_SPECIALIZED,
    items: ['技巧运动', '支撑跳跃', '低单杠运动', '双杠', '韵律操', '健美操']
  },
  {
    id: 'water-ice',
    name: '水上或冰雪类运动',
    specialized: true,
    levels: COMPULSORY_SPECIALIZED,
    items: ['蛙泳', '自由泳', '仰泳', '蝶泳', '速度滑冰', '高山滑雪', '冰球']
  },
  {
    id: 'traditional',
    name: '中华传统体育类运动',
    specialized: true,
    levels: COMPULSORY_SPECIALIZED,
    items: ['长拳', '太极拳', '形意拳', '八卦掌', '中国式摔跤', '射箭', '舞龙', '舞狮', '赛龙舟', '跳竹竿', '毽球']
  },
  {
    id: 'emerging',
    name: '新兴体育类运动',
    specialized: true,
    levels: COMPULSORY_SPECIALIZED,
    items: ['定向运动', '攀岩', '花样跳绳', '轮滑', '滑板', '极限飞盘', '跆拳道']
  },
  {
    id: 'interdisciplinary',
    name: '跨学科主题学习',
    specialized: false,
    levels: ['level1', 'level2', 'level3', 'level4'],
    items: ['钢铁战士', '劳动最光荣', '身心共成长', '破解运动的“密码”', '人与自然和谐美']
  }
]

/** 用于在教师用书分册中按类别回退匹配的关键词。 */
export const CATEGORY_TEACHER_BOOK_KEYWORDS: Record<ContentCategoryId, string[]> = {
  'basic-motor': ['基本运动技能'],
  fitness: ['体能'],
  health: [],
  ball: [],
  'track-field': ['田径'],
  gymnastics: ['体操', '健美操', '技巧'],
  'water-ice': ['游泳', '冰雪', '滑冰', '滑雪'],
  traditional: ['中华传统体育', '武术', '民族民间传统体育', '长拳'],
  emerging: ['新兴体育', '定向运动', '花样跳绳'],
  interdisciplinary: []
}

export function findContentCategory(id: string | null | undefined): ContentCategory | null {
  return CONTENT_CATEGORIES.find((item) => item.id === id) ?? null
}

export function categoriesForLevel(level: CurriculumLevel): ContentCategory[] {
  return CONTENT_CATEGORIES.filter((item) => item.levels.includes(level))
}

const CORE = ['运动能力', '健康行为', '体育品德'] as const

export const STAGE_RULES: Record<CurriculumStage, StageRule> = {
  compulsory: {
    stage: 'compulsory',
    standard: COMPULSORY_STANDARD,
    load: {
      groupDensityMinPct: 75,
      individualDensityMinPct: 50,
      heartRateMin: 140,
      heartRateMax: 160,
      fitnessMinutesTarget: 10
    },
    minUnitLessons: 18,
    coreCompetencies: CORE,
    lessonPlanElements: ['学习目标', '教学内容', '重点难点', '教学流程', '组织方法与学练要求', '运动负荷', '安全预案', '场地器材'],
    principles: [
      '核心素养（运动能力、健康行为、体育品德）贯穿学年、学期、单元、课时各层次目标，学习目标须写明条件、行为与表现、结果三部分，使用可观察的表现性行为动词。',
      '专项运动技能实施大单元教学：对某个运动项目或项目组合进行18课时及以上相对系统和完整的教学；避免在一个时间段内教授不同项目造成负迁移。',
      '1～2年级以体育游戏发展基本运动技能，玩中学、玩中练；3～6年级原则上每学期学练2个不同运动项目；7～8年级原则上一个学期学练1个运动项目，须包括中华传统体育类项目；9年级可自主选择1个项目进行为期1年的学习。',
      '避免孤立、静态的单个技术碎片化教学，采用结构化知识与技能教学，“学、练、赛”有机结合，创设真实复杂的运动情境（对抗练习、展示或比赛）。',
      '摒弃说教课、“放羊课”、安全课、单一技术课、测试课；尽量减少讲解、示范、队形调动时间，让所有学生充分动起来。',
      '每节课群体运动密度不低于75%，个体运动密度不低于50%，达到中高运动强度，班级平均心率原则上140～160次/分；每节课安排10分钟左右体现多样性、补偿性、趣味性和整合性的体能练习。',
      '加强中华传统体育类项目教学，重视对抗性项目，减少花拳绣腿式比画动作；融入国防与安全教育、文明健康的生活方式。',
      '落实“教会、勤练、常赛”，布置课外体育作业，促进课内外结合；保证规定课时的健康教育。'
    ]
  },
  senior: {
    stage: 'senior',
    standard: SENIOR_STANDARD,
    load: {
      groupDensityMinPct: 75,
      individualDensityMinPct: 50,
      heartRateMin: 140,
      heartRateMax: 160,
      fitnessMinutesTarget: 10
    },
    minUnitLessons: 18,
    coreCompetencies: CORE,
    lessonPlanElements: ['学习目标', '教学内容', '教学步骤', '学法与教法', '运动负荷（运动密度、运动强度）', '安全防范措施', '教学反思'],
    principles: [
      '高中三年216课时、12个模块、12学分：体能1个模块、健康教育1个模块、专项运动技能10个模块；1个模块一般为18课时。',
      '必修选学分三个阶段：第一学年3个模块、第二学年4个模块、第三学年3个模块；同一项目模块之间递进衔接，第一个模块要与义务教育阶段内容衔接。',
      '模块教学计划包括学习目标、教学内容、教学方法和学习评价；课时教学计划包括学习目标、教学内容、教学步骤、学法与教法、运动负荷、安全防范措施和教学反思。',
      '学业质量水平划分为3级（水平1至水平3），学习目标须指向运动能力、健康行为、体育品德三方面学科核心素养的具体表现。',
      '每节课群体运动密度不低于75%，个体运动密度不低于50%，达到中高运动强度，班级平均心率原则上140～160次/分；每节课合理安排10分钟左右体能练习（一般体能与专项体能，含补偿性体能练习）。',
      '开放式运动技能从一开始就加强完整体验和学练；每节课不只教一项技术，在游戏和比赛情境中运用技术，在实践课和比赛中学习规则。',
      '落实“教会、勤练、常赛”，重视因材施教、关注每个学生的进步和发展。'
    ]
  }
}

/** 广州市统一课时教案模板的课堂结构（课时教案模板.docx：开始、准备、基本、结束四部分）。 */
export const GUANGZHOU_LESSON_PARTS: LessonPartDefinition[] = [
  { part: 'opening', label: '开始部分' },
  { part: 'warmup', label: '准备部分' },
  { part: 'main', label: '基本部分' },
  { part: 'closing', label: '结束部分' }
]

export const LESSON_PART_LABELS: Record<LessonPartId, string> = {
  opening: '开始部分',
  warmup: '准备部分',
  main: '基本部分',
  closing: '结束部分'
}

export const DEFAULT_LESSON_MINUTES = 40
export const MIN_LESSON_MINUTES = 30
export const MAX_LESSON_MINUTES = 90

/**
 * 模板默认时间分配：40分钟课为 开始2 + 准备4 + 基本(6+10+14) + 结束4。
 * 其他课长保持开始、结束不变，余量按 准备:基本 = 4:30 比例分配。
 */
export function defaultPartMinutes(lessonMinutes: number): Record<LessonPartId, number> {
  if (!Number.isInteger(lessonMinutes) || lessonMinutes < MIN_LESSON_MINUTES || lessonMinutes > MAX_LESSON_MINUTES) {
    throw new Error(`课时长度必须是 ${MIN_LESSON_MINUTES}～${MAX_LESSON_MINUTES} 分钟的整数`)
  }
  const opening = 2
  const closing = 4
  const middle = lessonMinutes - opening - closing
  const warmup = Math.max(3, Math.round((middle * 4) / 34))
  return { opening, warmup, main: middle - warmup, closing }
}

export function stageRuleForGrade(grade: Grade): StageRule {
  return STAGE_RULES[stageOfGrade(grade)]
}
