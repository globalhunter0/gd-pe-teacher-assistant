import { mkdtempSync, rmSync } from 'node:fs'
import { readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createDataBackup, restoreDataBackup } from '../backup/service'
import { runDataIntegrityAudit } from '../dataIntegrity/audit'
import { BUSINESS_JSON_FILES } from '../persistence/businessFiles'
import { validateBusinessDocument } from '../persistence/businessValidation'
import { pathExists, writeJsonItemsAtomic } from '../persistence/jsonFile'
import { defaultPartMinutes } from '../curriculum/standards'
import {
  checkBigUnitCompliance,
  checkLessonCompliance,
  checkUnitCompliance,
  copyLessonDesign,
  createTeachingDesignId,
  emptyLoad,
  lessonsOfBigUnit,
  lessonsOfUnit,
  parseTeachingDesigns,
  removeBigUnitCascade,
  removeUnitKeepLessons,
  unitsOfBigUnit,
  type BigUnitDesign,
  type LessonDesign,
  type TeachingDesign,
  type UnitDesign
} from './index'

const NOW = '2026-10-12T08:00:00.000Z'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[teaching-design selfcheck] ${message}`)
  }
}

function stable(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : item
  )
}

function expectThrow(fn: () => unknown, message: string): void {
  try {
    fn()
  } catch {
    return
  }
  throw new Error(`[teaching-design selfcheck] 应当拒绝：${message}`)
}

const OBJECTIVES = {
  sportAbility: '在小组对抗情境中，80%以上学生能运用行进间运球摆脱防守',
  healthBehavior: '能在练习中主动调节呼吸并做好放松，知道运动后补水',
  sportsMorality: '比赛中遵守规则、尊重对手，主动为同伴加油'
}

function bigUnit(overrides: Partial<BigUnitDesign> = {}): BigUnitDesign {
  return {
    id: createTeachingDesignId(),
    kind: 'bigUnit',
    title: '初一篮球大单元',
    notes: '',
    generation: null,
    createdAt: NOW,
    updatedAt: NOW,
    grade: '初一',
    academicYear: '2026-2027',
    semester: '第一学期',
    editionId: 'pep-2024',
    categoryId: 'ball',
    sportItem: '篮球',
    totalLessons: 18,
    lessonMinutes: 40,
    teachingPlanId: null,
    materialResourceIds: [],
    guidingIdeas: '以学生发展为中心',
    learnerAnalysis: '初一学生有一定基础',
    contentAnalysis: '篮球是集体对抗项目',
    objectives: { ...OBJECTIVES },
    keyPoints: '运球与传接球的衔接',
    difficulties: '对抗中的技术运用',
    unitOutline: [
      { title: '单元一 运球', lessonFrom: 1, lessonTo: 6, focus: '运球' },
      { title: '单元二 传接球', lessonFrom: 7, lessonTo: 12, focus: '传接球' },
      { title: '单元三 比赛', lessonFrom: 13, lessonTo: 18, focus: '比赛' }
    ],
    assessment: '过程性评价与终结性评价结合',
    safety: '检查场地，做好热身',
    ...overrides
  }
}

function unit(bigUnitId: string, overrides: Partial<UnitDesign> = {}): UnitDesign {
  return {
    id: createTeachingDesignId(),
    kind: 'unit',
    title: '单元一 运球',
    notes: '',
    generation: { provider: 'deepseek', model: 'deepseek-chat', generatedAt: NOW },
    createdAt: NOW,
    updatedAt: NOW,
    bigUnitId,
    order: 1,
    lessonFrom: 1,
    lessonTo: 2,
    objectives: { ...OBJECTIVES },
    keyPoints: '运球手型',
    difficulties: '抬头运球',
    lessonSchedule: [
      { lessonNo: 1, topic: '原地运球', content: '原地高低运球', practiceAndCompetition: '运球接力赛', assessment: '运球次数' },
      { lessonNo: 2, topic: '行进间运球', content: '直线运球', practiceAndCompetition: '运球抢断赛', assessment: '运球速度' }
    ],
    assessment: '',
    ...overrides
  }
}

function lesson(overrides: Partial<LessonDesign> = {}): LessonDesign {
  const parts = defaultPartMinutes(40)
  return {
    id: createTeachingDesignId(),
    kind: 'lesson',
    title: '第1课时 原地运球',
    notes: '',
    generation: null,
    createdAt: NOW,
    updatedAt: NOW,
    bigUnitId: null,
    unitId: null,
    lessonNo: 1,
    grade: '初一',
    maleCount: 22,
    femaleCount: 20,
    lessonMinutes: 40,
    objectives: { ...OBJECTIVES },
    content: '篮球原地运球',
    safetyPlan: '检查场地，学生间保持距离',
    keyPoint: '按拍球的手型',
    difficulty: '抬头运球',
    flow: '情境导入—学练—比赛—放松',
    segments: [
      { part: 'opening', minutes: parts.opening, goal: '集合', content: '课堂常规', teacherActivities: '宣布内容', studentActivities: '快静齐', organization: '四列横队', requirements: '精神饱满' },
      { part: 'warmup', minutes: parts.warmup, goal: '热身', content: '球性练习', teacherActivities: '带领', studentActivities: '跟练', organization: '散点', requirements: '充分活动' },
      { part: 'main', minutes: 6, goal: '学', content: '原地高低运球', teacherActivities: '示范讲解', studentActivities: '练习', organization: '两人一组', requirements: '抬头' },
      { part: 'main', minutes: 10, goal: '练赛', content: '运球接力赛', teacherActivities: '组织比赛', studentActivities: '分组比赛', organization: '四组', requirements: '遵守规则' },
      { part: 'main', minutes: parts.main - 16, goal: '体能', content: '体能循环练习', teacherActivities: '计时', studentActivities: '循环练习', organization: '四站', requirements: '保质保量' },
      { part: 'closing', minutes: parts.closing, goal: '放松', content: '拉伸放松', teacherActivities: '小结', studentActivities: '放松', organization: '体操队形', requirements: '充分放松' }
    ],
    load: { groupDensityPct: 78, individualDensityPct: 55, avgHeartRate: 148, peakHeartRate: 175, fitnessMinutes: 10, note: '' },
    venueEquipment: '篮球场 1 块，篮球 42 个',
    reflection: '',
    ...overrides
  }
}

function hasIssue(issues: ReadonlyArray<{ severity: string; field: string }>, severity: string, field: string): boolean {
  return issues.some((issue) => issue.severity === severity && issue.field === field)
}

function checkParse(): void {
  const big = bigUnit()
  const u = unit(big.id)
  const l = lesson({ bigUnitId: big.id, unitId: u.id })
  const parsed = parseTeachingDesigns(JSON.parse(JSON.stringify([l, u, big])))
  assert(parsed.map((item) => item.kind).join(',') === 'bigUnit,unit,lesson', '应按 大单元/单元/课时 排序')
  assert(stable(parsed[2]) === stable(l), '课时教案 parse 后应字段完全保留')
  assert(stable(parsed[1]) === stable(u), '单元 parse 后应字段完全保留')
  assert(stable(parsed[0]) === stable(big), '大单元 parse 后应字段完全保留')
  assert(JSON.stringify(parseTeachingDesigns(JSON.parse(JSON.stringify(parsed)))) === JSON.stringify(parsed), 'parse 应幂等')

  expectThrow(() => parseTeachingDesigns({}), '非数组 {}')
  expectThrow(() => parseTeachingDesigns('{broken'), '字符串')
  expectThrow(() => parseTeachingDesigns([big, big]), '重复 ID')
  expectThrow(() => parseTeachingDesigns([{ ...big, kind: 'other' }]), '未知类型')
  expectThrow(() => parseTeachingDesigns([{ ...big, id: 'x' }]), '非法 ID')
  expectThrow(() => parseTeachingDesigns([{ ...big, title: '  ' }]), '空名称')
  expectThrow(() => parseTeachingDesigns([{ ...big, grade: '七年级' }]), '非法年级')
  expectThrow(() => parseTeachingDesigns([{ ...big, categoryId: 'chess' }]), '非法类别')
  expectThrow(() => parseTeachingDesigns([{ ...big, totalLessons: 0 }]), '总课时 0')
  expectThrow(() => parseTeachingDesigns([{ ...big, lessonMinutes: 20 }]), '课时长度过短')
  expectThrow(() => parseTeachingDesigns([{ ...big, academicYear: '2026' }]), '学年格式')
  expectThrow(() => parseTeachingDesigns([{ ...u, lessonFrom: 5, lessonTo: 2 }]), '单元起止颠倒')
  expectThrow(() => parseTeachingDesigns([{ ...u, bigUnitId: null }]), '单元缺大单元')
  expectThrow(() => parseTeachingDesigns([{ ...l, segments: {} }]), 'segments 非数组')
  expectThrow(() => parseTeachingDesigns([{ ...l, segments: [{ part: 'middle', minutes: 3 }] }]), '非法课的部分')
  expectThrow(() => parseTeachingDesigns([{ ...l, segments: [{ part: 'main', minutes: -1 }] }]), '负数时间')

  const loose = parseTeachingDesigns([
    {
      ...l,
      bigUnitId: '',
      unitId: undefined,
      maleCount: '21',
      femaleCount: -3,
      objectives: undefined,
      load: { groupDensityPct: 180, avgHeartRate: '150' },
      generation: undefined,
      notes: '  备注\r\n第二行  '
    }
  ])[0] as LessonDesign
  assert(loose.bigUnitId === null && loose.unitId === null, '空引用应归一为 null')
  assert(loose.maleCount === 21 && loose.femaleCount === null, '人数应宽松归一')
  assert(loose.objectives.sportAbility === '', '缺失目标应为空字符串')
  assert(loose.load.groupDensityPct === null && loose.load.avgHeartRate === 150, '负荷越界置空、字符串数字可读')
  assert(loose.generation === null, '缺失生成记录应为 null')
  assert(loose.notes === '备注\n第二行', '文本应去首尾空白并统一换行')

  const legacyBig = { ...big } as Record<string, unknown>
  delete legacyBig.unitOutline
  delete legacyBig.materialResourceIds
  delete legacyBig.teachingPlanId
  const restored = parseTeachingDesigns([legacyBig])[0] as BigUnitDesign
  assert(restored.unitOutline.length === 0 && restored.materialResourceIds.length === 0 && restored.teachingPlanId === null, '缺失可选字段应有默认值')
  assert(parseTeachingDesigns([{ ...big, teachingPlanId: 'bad' }])[0].kind === 'bigUnit', '非法教学计划 ID 应置空而非拒绝')
}

function checkLessonRules(): void {
  const good = lesson()
  const goodIssues = checkLessonCompliance(good)
  assert(!goodIssues.some((issue) => issue.severity === 'error'), `合规教案不应有错误：${JSON.stringify(goodIssues)}`)
  assert(goodIssues.length === 0, `合规教案不应有提示：${JSON.stringify(goodIssues)}`)

  assert(hasIssue(checkLessonCompliance(lesson({ load: { ...good.load, individualDensityPct: 45 } })), 'error', 'load.individualDensityPct'), '个体密度 <50% 应报错')
  assert(hasIssue(checkLessonCompliance(lesson({ load: { ...good.load, groupDensityPct: 70 } })), 'error', 'load.groupDensityPct'), '群体密度 <75% 应报错')
  assert(hasIssue(checkLessonCompliance(lesson({ load: { ...good.load, avgHeartRate: 130 } })), 'error', 'load.avgHeartRate'), '心率 <140 应报错')
  assert(hasIssue(checkLessonCompliance(lesson({ load: { ...good.load, avgHeartRate: 165 } })), 'error', 'load.avgHeartRate'), '心率 >160 应报错')
  assert(!hasIssue(checkLessonCompliance(lesson({ load: { ...good.load, avgHeartRate: 140 } })), 'error', 'load.avgHeartRate'), '心率 140 为边界合规')
  assert(hasIssue(checkLessonCompliance(lesson({ load: { ...good.load, fitnessMinutes: 5 } })), 'warning', 'load.fitnessMinutes'), '体能 5 分钟应提示')
  assert(!hasIssue(checkLessonCompliance(lesson({ load: { ...good.load, fitnessMinutes: 12 } })), 'warning', 'load.fitnessMinutes'), '体能 12 分钟属“10 分钟左右”')
  assert(hasIssue(checkLessonCompliance(lesson({ load: emptyLoad() })), 'warning', 'load.avgHeartRate'), '未填心率应提示')
  assert(hasIssue(checkLessonCompliance(lesson({ objectives: { ...OBJECTIVES, sportsMorality: '' } })), 'error', 'objectives.sportsMorality'), '缺体育品德目标应报错')
  assert(hasIssue(checkLessonCompliance(lesson({ segments: good.segments.filter((s) => s.part !== 'warmup') })), 'error', 'segments'), '缺准备部分应报错')
  assert(hasIssue(checkLessonCompliance(lesson({ segments: [...good.segments].reverse() })), 'error', 'segments'), '顺序颠倒应报错')
  assert(hasIssue(checkLessonCompliance(lesson({ lessonMinutes: 45 })), 'error', 'segments'), '时间合计与课长不符应报错')
  const noCompetition = good.segments.map((s) => (s.part === 'main' ? { ...s, content: '原地运球练习', organization: '散点', requirements: '抬头', studentActivities: '练习' } : s))
  assert(hasIssue(checkLessonCompliance(lesson({ segments: noCompetition })), 'warning', 'segments'), '基本部分无“赛”应提示')
  assert(hasIssue(checkLessonCompliance(lesson({ safetyPlan: '' })), 'warning', 'safetyPlan'), '安全预案为空应提示')
  const senior = checkLessonCompliance(lesson({ grade: '高一', safetyPlan: '' }))
  assert(senior.some((issue) => issue.field === 'safetyPlan' && issue.message.includes('安全防范措施')), '高中应使用“安全防范措施”表述')
}

function checkBigUnitRules(): void {
  assert(checkBigUnitCompliance(bigUnit()).length === 0, `合规大单元不应有问题：${JSON.stringify(checkBigUnitCompliance(bigUnit()))}`)
  assert(hasIssue(checkBigUnitCompliance(bigUnit({ grade: '一年级' })), 'error', 'categoryId'), '水平一选专项应报错')
  assert(checkBigUnitCompliance(bigUnit({ grade: '一年级' }))[0].message.includes('体育游戏'), '水平一提示应指向体育游戏')
  assert(!hasIssue(checkBigUnitCompliance(bigUnit({ grade: '二年级', categoryId: 'basic-motor', sportItem: '移动性技能' })), 'error', 'categoryId'), '水平一基本运动技能合规')
  assert(hasIssue(checkBigUnitCompliance(bigUnit({ grade: '三年级', categoryId: 'basic-motor' })), 'error', 'categoryId'), '水平二不设基本运动技能')
  assert(hasIssue(checkBigUnitCompliance(bigUnit({ grade: '高一', categoryId: 'interdisciplinary' })), 'error', 'categoryId'), '高中无跨学科主题学习')
  const short = bigUnit({ totalLessons: 12, unitOutline: [{ title: '一', lessonFrom: 1, lessonTo: 12, focus: '' }] })
  assert(hasIssue(checkBigUnitCompliance(short), 'error', 'totalLessons'), '专项不足 18 课时应报错')
  assert(!hasIssue(checkBigUnitCompliance(bigUnit({ categoryId: 'health', sportItem: '心理健康', totalLessons: 4, unitOutline: [{ title: '一', lessonFrom: 1, lessonTo: 4, focus: '' }] })), 'error', 'totalLessons'), '健康教育不受 18 课时限制')
  const seniorLong = bigUnit({ grade: '高二', totalLessons: 20, unitOutline: [{ title: '一', lessonFrom: 1, lessonTo: 20, focus: '' }] })
  assert(hasIssue(checkBigUnitCompliance(seniorLong), 'warning', 'totalLessons') && !hasIssue(checkBigUnitCompliance(seniorLong), 'error', 'totalLessons'), '高中非 18 课时仅提示')
  const gap = bigUnit({ unitOutline: [{ title: '一', lessonFrom: 1, lessonTo: 6, focus: '' }, { title: '二', lessonFrom: 8, lessonTo: 18, focus: '' }] })
  assert(hasIssue(checkBigUnitCompliance(gap), 'error', 'unitOutline'), '单元课次断档应报错')
  const shortOutline = bigUnit({ unitOutline: [{ title: '一', lessonFrom: 1, lessonTo: 12, focus: '' }] })
  assert(hasIssue(checkBigUnitCompliance(shortOutline), 'error', 'unitOutline'), '单元未覆盖全部课时应报错')
  assert(hasIssue(checkBigUnitCompliance(bigUnit({ unitOutline: [] })), 'warning', 'unitOutline'), '未划分单元应提示')
  assert(hasIssue(checkBigUnitCompliance(bigUnit({ objectives: { ...OBJECTIVES, healthBehavior: '' } })), 'error', 'objectives.healthBehavior'), '大单元缺健康行为目标应报错')

  const big = bigUnit()
  assert(checkUnitCompliance(unit(big.id), big).length === 0, '合规单元不应有问题')
  assert(hasIssue(checkUnitCompliance(unit(big.id, { lessonFrom: 17, lessonTo: 20 }), big), 'error', 'lessonTo'), '单元超出大单元课时应报错')
  assert(hasIssue(checkUnitCompliance(unit(big.id), null), 'error', 'bigUnitId'), '大单元缺失应报错')
  const outOfRange = unit(big.id, { lessonSchedule: [{ lessonNo: 5, topic: '', content: '', practiceAndCompetition: '', assessment: '' }] })
  assert(hasIssue(checkUnitCompliance(outOfRange, big), 'error', 'lessonSchedule'), '课次安排越界应报错')
}

function checkRelations(): TeachingDesign[] {
  const bigA = bigUnit({ title: 'A' })
  const bigB = bigUnit({ title: 'B' })
  const unitA1 = unit(bigA.id, { order: 1 })
  const unitA2 = unit(bigA.id, { order: 2, lessonFrom: 3, lessonTo: 4, lessonSchedule: [] })
  const lessonA1 = lesson({ bigUnitId: bigA.id, unitId: unitA1.id, lessonNo: 2 })
  const lessonA0 = lesson({ bigUnitId: bigA.id, unitId: unitA1.id, lessonNo: 1 })
  const lessonB = lesson({ bigUnitId: bigB.id, lessonNo: 1 })
  const standalone = lesson({ title: '独立教案', lessonNo: null })
  const all = parseTeachingDesigns([bigA, bigB, unitA2, unitA1, lessonA1, lessonA0, lessonB, standalone])

  assert(unitsOfBigUnit(all, bigA.id).map((item) => item.id).join() === [unitA1.id, unitA2.id].join(), '单元按序号排列')
  assert(lessonsOfBigUnit(all, bigA.id).map((item) => item.lessonNo).join() === '1,2', '课时按课次排列')
  assert(lessonsOfUnit(all, unitA1.id).length === 2, '单元下课时数量')

  const afterUnit = removeUnitKeepLessons(all, unitA1.id, NOW)
  assert(afterUnit.length === all.length - 1, '删除单元只删单元本身')
  assert(lessonsOfBigUnit(afterUnit, bigA.id).every((item) => item.unitId === null), '删除单元后课时解除单元归属')

  const afterBig = removeBigUnitCascade(all, bigA.id)
  assert(afterBig.length === 3, `删除大单元应级联删除其单元和课时，剩余 ${afterBig.length}`)
  assert(afterBig.some((item) => item.id === bigB.id) && afterBig.some((item) => item.id === lessonB.id) && afterBig.some((item) => item.id === standalone.id), '不得误删其他大单元与独立教案')

  const copy = copyLessonDesign(lessonB, NOW)
  assert(copy.id !== lessonB.id && copy.segments !== lessonB.segments && copy.segments.length === lessonB.segments.length, '复制教案应为深拷贝且新 ID')
  return all
}

function checkAudit(all: TeachingDesign[]): void {
  const base = {
    classes: [],
    students: [],
    schedule: [],
    peSessions: [],
    peTests: [],
    teachingPlans: [],
    trainingTeams: [],
    trainingMembers: [],
    trainingSessions: [],
    trainingResults: [],
    resources: [{ id: 'res-keep' }]
  }
  const clean = runDataIntegrityAudit({ ...base, teachingDesigns: all.map(toSnapshot) })
  assert(!clean.issues.some((issue) => issue.domain === 'teaching-designs'), '完整关系不应有审计问题')

  const big = all.find((item): item is BigUnitDesign => item.kind === 'bigUnit')!
  const orphaned = all.filter((item) => item.id !== big.id)
  const dangling = runDataIntegrityAudit({
    ...base,
    teachingDesigns: [
      ...orphaned.map(toSnapshot),
      toSnapshot({ ...bigUnit(), teachingPlanId: 'teaching-plan-gone', materialResourceIds: ['res-keep', 'res-gone'] })
    ]
  })
  const codes = new Set(dangling.issues.filter((issue) => issue.domain === 'teaching-designs').map((issue) => issue.code))
  for (const code of ['dangling_big_unit_id', 'dangling_teaching_plan_id', 'dangling_resource_id']) {
    assert(codes.has(code), `审计应报告 ${code}`)
  }
  assert(!dangling.issues.some((issue) => issue.domain === 'teaching-designs' && issue.severity === 'error'), '悬空引用不应为 error')
  assert(runDataIntegrityAudit(base).status === 'healthy', '旧快照无 teachingDesigns 字段应正常审计')
}

function toSnapshot(item: TeachingDesign): NonNullable<Parameters<typeof runDataIntegrityAudit>[0]['teachingDesigns']>[number] {
  return {
    id: item.id,
    kind: item.kind,
    bigUnitId: item.kind === 'bigUnit' ? null : item.bigUnitId,
    unitId: item.kind === 'lesson' ? item.unitId : null,
    teachingPlanId: item.kind === 'bigUnit' ? item.teachingPlanId : null,
    materialResourceIds: item.kind === 'bigUnit' ? item.materialResourceIds : []
  }
}

async function readDesigns(root: string): Promise<TeachingDesign[]> {
  const text = await readFile(join(root, 'teaching-designs.json'), 'utf8')
  return validateBusinessDocument('teaching-designs.json', JSON.parse(text)) as TeachingDesign[]
}

async function checkPersistence(all: TeachingDesign[]): Promise<void> {
  assert((BUSINESS_JSON_FILES as readonly string[]).includes('teaching-designs.json'), 'teaching-designs.json 应为业务文件')
  expectThrow(() => validateBusinessDocument('teaching-designs.json', {}), '业务文件 {} 应被拒绝')
  assert((validateBusinessDocument('teaching-designs.json', { version: 1, items: [] }) as unknown[]).length === 0, '空文档可读')

  const root = mkdtempSync(join(tmpdir(), 'gdpe-teaching-design-'))
  const outside = mkdtempSync(join(tmpdir(), 'gdpe-teaching-design-bak-'))
  try {
    await writeJsonItemsAtomic(join(root, 'teaching-designs.json'), all)
    const reloaded = await readDesigns(root)
    assert(JSON.stringify(reloaded) === JSON.stringify(all), '保存后再读应一致')

    const edited = reloaded.map((item) => (item.kind === 'lesson' && item.title === '独立教案' ? { ...item, reflection: '学生积极', updatedAt: '2026-10-13T08:00:00.000Z' } : item))
    await writeJsonItemsAtomic(join(root, 'teaching-designs.json'), edited)
    const afterEdit = await readDesigns(root)
    assert(afterEdit.some((item) => item.kind === 'lesson' && item.reflection === '学生积极'), '修改后再保存应保留新字段')
    assert(afterEdit.length === all.length, '修改不应丢失其他设计')

    const archive = join(outside, 'designs.gdpebak')
    const created = await createDataBackup(root, archive, '1.0.1-selfcheck')
    assert(created.manifest.files.some((file) => file.path === 'teaching-designs.json'), '备份应包含 teaching-designs.json')

    await writeJsonItemsAtomic(join(root, 'teaching-designs.json'), [])
    await restoreDataBackup(root, archive, { appVersion: '1.0.1-selfcheck' })
    const restored = await readDesigns(root)
    assert(JSON.stringify(restored) === JSON.stringify(afterEdit), '恢复后教学设计应与备份一致')

    await rm(join(root, 'teaching-designs.json'))
    assert(!(await pathExists(join(root, 'teaching-designs.json'))), '模拟旧版本无该文件')
    const legacyArchive = join(outside, 'legacy.gdpebak')
    await writeJsonItemsAtomic(join(root, 'classes.json'), [])
    await createDataBackup(root, legacyArchive, '0.29.0')
    await writeJsonItemsAtomic(join(root, 'teaching-designs.json'), afterEdit)
    await restoreDataBackup(root, legacyArchive, { appVersion: '1.0.1-selfcheck' })
    const kept = await readDesigns(root)
    assert(kept.length === afterEdit.length, '恢复不含教学设计的旧备份时应保留现有教学设计')
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  }
}

export async function runTeachingDesignSelfCheckOrThrow(): Promise<string> {
  checkParse()
  checkLessonRules()
  checkBigUnitRules()
  const all = checkRelations()
  checkAudit(all)
  await checkPersistence(all)
  return 'teaching design selfcheck ok (parse / compliance / cascade / audit / backup-restore / legacy)'
}

if (process.argv[1] && /teachingDesign[\\/]selfcheck\.ts$/.test(process.argv[1])) {
  runTeachingDesignSelfCheckOrThrow().then(
    (message) => console.log(message),
    (error) => {
      console.error(error)
      process.exitCode = 1
    }
  )
}
