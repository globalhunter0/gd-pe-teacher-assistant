import {
  SCHOOL_STAGE_LABELS,
  STAGE_ORGANIZE,
  TRAINING_FOCUS_LABELS,
  TRAINING_LEVEL_LABELS,
  TRAINING_PHASE_LABELS,
  getSportProgram,
  isSchoolStage,
  isTrainingLevel,
  type SportProgram
} from './sportProgram'
import type {
  SchoolStage,
  TrainingExerciseKind,
  TrainingLevel,
  TrainingPhase,
  TrainingPlanBlueprint,
  TrainingSessionFocus
} from './types'

export const PLAN_DURATION_MIN = 30
export const PLAN_DURATION_MAX = 150
export const PLAN_WEEKS_MAX = 8
export const PLAN_SESSIONS_PER_WEEK_MAX = 5

export interface TrainingPlanReference {
  title: string
  use: string
}

/** 训练原则来源；生成内容按这些原则编排，不是原文摘录。 */
export const TRAINING_PLAN_REFERENCES: readonly TrainingPlanReference[] = [
  {
    title: 'NSCA《Essentials of Strength Training and Conditioning》第4版（Haff & Triplett）',
    use: '训练变量、动作顺序、组次与组间休息、减量'
  },
  { title: 'NSCA《Guide to Program Design》（Hoffman）', use: '周期与单课结构、高低强度交替' },
  {
    title: 'NSCA《Developing Speed》《Developing Agility and Quickness》《Developing Power》',
    use: '加速与最大速度、闭式→开式灵敏、增强式落地优先与触地总量'
  },
  {
    title: 'NSCA 青少年长期运动发展立场声明（Lloyd 等, 2016）；青少年抗阻训练立场声明（Faigenbaum 等, 2009）；青少年体能发展模型 YPD（Lloyd & Oliver）',
    use: '按学段与生长阶段安排动作能力、力量与负荷'
  },
  { title: 'RAMP 热身（Jeffreys）', use: '提升—激活与动态活动—增强的准备活动' },
  { title: 'Bompa & Buzzichelli《Periodization》第6版', use: '适应—发展—强化—减量的阶段递进' },
  {
    title: 'Renshaw、Davids 等《The Constraints-Led Approach》',
    use: '约束导向的技术与对抗设计：封闭→变式→决策'
  },
  { title: 'FIFA 11+ / 11+ Kids', use: '膝、踝、腘绳与内收肌损伤预防' },
  { title: 'Foster 等 session-RPE 方法', use: '课后 RPE × 时长监控训练负荷' }
]

const SHORT_REFERENCES =
  'NSCA 体能训练概论（第4版）与速度/灵敏/爆发系列、NSCA 青少年长期发展与抗阻训练立场声明、RAMP 热身、Bompa 周期理论、约束导向教学（CLA）、FIFA 11+、session-RPE。'

type MainBlock = 'quality' | 'skill' | 'apply' | 'strength' | 'conditioning'
type QualityMode = 'linear' | 'agility' | 'jump' | 'throw' | 'rope' | 'swim'
type ConditioningMode = 'alactic' | 'aerobic' | 'intermittent' | 'routine' | 'rope' | 'swim'
type PrehabKey = 'knee' | 'shoulder' | 'ankle' | 'hamstring' | 'adductor' | 'trunk' | 'wrist'
type Region = 'lower' | 'upper' | 'full'
type Line = readonly [name: string, dose: string, cue: string]
type Tiered<T> = readonly [T, T, T]

interface SportProfile {
  weights: Record<MainBlock, number>
  quality: readonly QualityMode[]
  conditioning: ConditioningMode
  prehab: readonly PrehabKey[]
  region: Region
  potentiate: Line
  game: string
  gameRound: number
  tests: readonly [string, string, string]
  /** 技能门槛型项目（如游泳）：练习难度只看水平，不随学段上调 */
  skillGated?: boolean
  starterGame?: string
  starterTests?: readonly [string, string, string]
  raise?: string
}

function weights(quality: number, skill: number, apply: number, strength: number, conditioning: number): Record<MainBlock, number> {
  return { quality, skill, apply, strength, conditioning }
}

const PROFILES: Record<string, SportProfile> = {
  'track-sprint': {
    weights: weights(30, 25, 10, 25, 10),
    quality: ['linear', 'jump'],
    conditioning: 'alactic',
    prehab: ['hamstring', 'ankle'],
    region: 'lower',
    potentiate: ['P 渐进加速跑', '3次×30米（60%→80%→90%）', '逐次提速，动作放松'],
    game: '完整起跑+按学段距离全程跑',
    gameRound: 3,
    tests: ['30米站立起跑计时（2次取最好）', '立定跳远（3次取最好）', '50/60米计时（按学段）']
  },
  'track-middle': {
    weights: weights(10, 15, 15, 20, 40),
    quality: ['linear'],
    conditioning: 'aerobic',
    prehab: ['ankle', 'knee'],
    region: 'lower',
    potentiate: ['P 加速跑（Strides）', '3次×60米（70%→85%）', '大步放松，不冲刺'],
    game: '分段配速跑（按计划配速）',
    gameRound: 5,
    tests: ['800米/1000米计时（按学段）', '12分钟跑距离', '课后2分钟心率恢复']
  },
  'track-high-jump': {
    weights: weights(25, 30, 10, 25, 10),
    quality: ['jump', 'linear'],
    conditioning: 'alactic',
    prehab: ['knee', 'ankle'],
    region: 'lower',
    potentiate: ['P 弧线助跑节奏跑', '3次（不起跳）', '最后几步加快、身体内倾'],
    game: '完整助跑试跳（固定高度）',
    gameRound: 3,
    tests: ['助跑摸高（3次取最好）', '立定跳远（3次取最好）', '跳高试跳：记录稳定高度']
  },
  'track-long-jump': {
    weights: weights(25, 30, 10, 25, 10),
    quality: ['linear', 'jump'],
    conditioning: 'alactic',
    prehab: ['hamstring', 'ankle'],
    region: 'lower',
    potentiate: ['P 助跑节奏跑', '3次（不起跳）', '步点稳定、逐步加速'],
    game: '完整助跑试跳',
    gameRound: 3,
    tests: ['助跑跳远（3次取最好）', '立定跳远（3次取最好）', '30米加速跑计时']
  },
  'track-triple-jump': {
    weights: weights(25, 30, 10, 25, 10),
    quality: ['jump', 'linear'],
    conditioning: 'alactic',
    prehab: ['knee', 'ankle'],
    region: 'lower',
    potentiate: ['P 跨步跳过渡单足跳', '2组×20米（草地/跑道）', '轻快有弹性'],
    game: '短中程助跑完整三级跳',
    gameRound: 3,
    tests: ['短助跑三级跳（3次取最好）', '立定三级跳', '30米加速跑计时']
  },
  'track-hurdles': {
    weights: weights(20, 35, 10, 20, 15),
    quality: ['linear', 'jump'],
    conditioning: 'alactic',
    prehab: ['hamstring', 'adductor'],
    region: 'lower',
    potentiate: ['P 栏侧攻栏走+慢跑过栏', '2组×4栏', '髋部打开，上体前倾'],
    game: '完整过栏跑（3–5栏）',
    gameRound: 3,
    tests: ['低栏5栏计时', '30米加速跑计时', '立定跳远（3次取最好）']
  },
  'track-throws': {
    weights: weights(25, 30, 10, 30, 5),
    quality: ['throw', 'jump'],
    conditioning: 'alactic',
    prehab: ['shoulder', 'trunk'],
    region: 'full',
    potentiate: ['P 实心球渐进投', '6次（轻→中）', '由慢到快，用力顺序完整'],
    game: '完整技术投掷（技术评分）',
    gameRound: 3,
    tests: ['实心球前抛（3次取最好）', '实心球后抛（3次取最好）', '立定跳远（3次取最好）']
  },
  'track-relay': {
    weights: weights(30, 35, 15, 15, 5),
    quality: ['linear'],
    conditioning: 'alactic',
    prehab: ['hamstring', 'ankle'],
    region: 'lower',
    potentiate: ['P 行进间传接棒', '4次（慢→中速）', '先看手型再提速'],
    game: '完整接力段（双人→四人）',
    gameRound: 4,
    tests: ['4×50米接力计时', '接力区交接成功率（10次）', '30米加速跑计时']
  },
  basketball: {
    weights: weights(15, 30, 25, 20, 10),
    quality: ['agility', 'jump'],
    conditioning: 'intermittent',
    prehab: ['knee', 'ankle'],
    region: 'full',
    potentiate: ['P 持球移动+急停投篮', '6次', '逐步加快，落地屈膝'],
    game: '半场3对3',
    gameRound: 4,
    tests: ['1分钟定点投篮命中数', '全场运球上篮计时', '5-10-5 灵敏测试']
  },
  football: {
    weights: weights(15, 30, 25, 20, 10),
    quality: ['agility', 'linear'],
    conditioning: 'intermittent',
    prehab: ['hamstring', 'adductor', 'knee'],
    region: 'lower',
    potentiate: ['P 带球变速+短传', '4分钟', '由慢到快，抬头观察'],
    game: '小场4对4/5对5',
    gameRound: 5,
    tests: ['30米运球绕杆计时', '定点传准（10次命中数）', '20米往返跑（高中可用 Yo-Yo IR1）']
  },
  volleyball: {
    weights: weights(15, 30, 25, 20, 10),
    quality: ['jump', 'agility'],
    conditioning: 'intermittent',
    prehab: ['shoulder', 'knee', 'ankle'],
    region: 'full',
    potentiate: ['P 助跑起跳摸高+垫传', '6次', '逐步加高，双脚落地'],
    game: '小场4对4比赛',
    gameRound: 5,
    tests: ['1分钟对墙垫球个数', '发球进区（10次）', '助跑摸高（3次取最好）']
  },
  'table-tennis': {
    weights: weights(20, 35, 20, 15, 10),
    quality: ['agility'],
    conditioning: 'intermittent',
    prehab: ['shoulder', 'wrist'],
    region: 'full',
    potentiate: ['P 徒手挥拍+并步移动', '2组×30秒', '动作逐步加快'],
    game: '11分制比赛对抗',
    gameRound: 6,
    tests: ['1分钟正手连续对推板数', '发球到指定区（10次）', '两点步法30秒触点数']
  },
  badminton: {
    weights: weights(20, 35, 20, 15, 10),
    quality: ['agility', 'jump'],
    conditioning: 'intermittent',
    prehab: ['shoulder', 'wrist', 'ankle'],
    region: 'full',
    potentiate: ['P 空拍步法+挥拍', '2组×30秒', '启动越来越快'],
    game: '计分对抗（单打/双打）',
    gameRound: 6,
    tests: ['高远球到后场（10次）', '六点步法计时', '网前挑球到位率（10次）']
  },
  rope: {
    weights: weights(15, 35, 15, 15, 20),
    quality: ['rope', 'jump'],
    conditioning: 'rope',
    prehab: ['ankle', 'knee'],
    region: 'lower',
    potentiate: ['P 渐进速度单摇', '3组×15秒（慢→快）', '轻落地，手腕摇绳'],
    game: '花样组合展示/计数赛',
    gameRound: 3,
    tests: ['1分钟单摇计数', '30秒快速单摇计数', '连续无失误次数']
  },
  shuttlecock: {
    weights: weights(15, 35, 25, 15, 10),
    quality: ['agility'],
    conditioning: 'intermittent',
    prehab: ['ankle', 'adductor'],
    region: 'lower',
    potentiate: ['P 盘踢+移动接踢', '2分钟', '逐步加快'],
    game: '三人网前比赛',
    gameRound: 5,
    tests: ['1分钟盘踢计数', '两人对踢连续次数', '定点踢准（10次）']
  },
  cheer: {
    weights: weights(15, 35, 20, 20, 10),
    quality: ['jump'],
    conditioning: 'routine',
    prehab: ['knee', 'trunk', 'shoulder'],
    region: 'full',
    potentiate: ['P 8拍手位+跳跃组合', '2遍', '力度逐步加大'],
    game: '分段+成套合练',
    gameRound: 4,
    tests: ['成套完成度（教练按3项评分）', '跳跃落地稳定性（10次）', '平板支撑计时']
  },
  aerobics: {
    weights: weights(15, 35, 20, 20, 10),
    quality: ['jump'],
    conditioning: 'routine',
    prehab: ['knee', 'ankle'],
    region: 'full',
    potentiate: ['P 基本步伐串联（随音乐）', '2遍', '速度提到音乐速度'],
    game: '成套随音乐合练',
    gameRound: 4,
    tests: ['成套完成度（教练按3项评分）', '30秒开合跳（落地质量）', '1分钟基本步伐次数']
  },
  swimming: {
    weights: weights(10, 35, 10, 20, 25),
    quality: ['swim'],
    conditioning: 'swim',
    prehab: ['shoulder', 'trunk'],
    region: 'upper',
    potentiate: ['P 水中渐进快游', '4次×12.5米', '由慢到快，换气不乱'],
    game: '完整泳姿配速游',
    gameRound: 4,
    tests: ['25米计时（小学）/50米计时（初高中）', '25米划臂次数（效率）', '连续游距离（小学可扶边分段）'],
    skillGated: true,
    starterGame: '浅水游戏：水中行走接力、吹泡比赛',
    starterTests: ['抱膝漂浮后独立站起（能/不能）', '30秒扶边吹泡次数', '蹬边滑行距离'],
    raise: 'R 陆上原地活动（不在池边跑动）'
  },
  wushu: {
    weights: weights(15, 40, 20, 20, 5),
    quality: ['jump'],
    conditioning: 'routine',
    prehab: ['knee', 'adductor', 'trunk'],
    region: 'full',
    potentiate: ['P 踢腿组合（正踢/侧踢）', '2组×8次', '高度逐步增加，量力而行'],
    game: '套路完整演练',
    gameRound: 4,
    tests: ['套路完成度（教练按3项评分）', '弓步马步定势保持时间', '正踢腿高度与控制']
  }
}

const QUALITY_LIBRARY: Record<QualityMode, Tiered<readonly Line[]>> = {
  linear: [
    [
      ['信号起动追逐游戏', '{r}次×10–15米，走回恢复', '反应+加速，不排名次'],
      ['小步跑→高抬腿→加速跑', '3组×20米', '动作轻快，逐步加速'],
      ['绕标志曲线跑', '{r}次×15米', '身体略内倾，步子小而快']
    ],
    [
      ['A字走→A字跳', '2组×20米', '支撑脚落在髋下方'],
      ['多姿势起动加速（站/俯/背向）', '{r}次×15–20米，次间60–90秒', '前三步有力，身体前倾'],
      ['飞行冲刺（加速15米+快跑10米）', '3次，次间2分钟', '高速时肩膀放松']
    ],
    [
      ['A字跳→B字跳', '2组×20米', '扒地发生在髋下方'],
      ['蹲踞式起跑加速', '{r}次×20–30米，次间2–3分钟', '完全恢复，保证每次质量'],
      ['飞行冲刺（加速20米+全速20米）', '3–4次，次间3–4分钟', '最大速度，动作不变形']
    ]
  ],
  agility: [
    [
      ['快速脚步（标志物/敏捷梯）', '3组×15秒', '脚步轻快，手臂配合'],
      ['听信号变向跑', '{r}次×10米', '先看信号再动'],
      ['贴人游戏/抓尾巴', '3局×1分钟', '低重心躲闪']
    ],
    [
      ['5-10-5 折返跑', '{r}次，次间60–90秒', '降重心制动后再蹬出'],
      ['两人镜像追随', '{r}次×5秒', '侧滑步不交叉'],
      ['专项步法组合（滑步-交叉步-后撤）', '3组×20秒', '每步回到准备姿势']
    ],
    [
      ['反应式变向（看手势/颜色）', '{r}次×5–10米', '先判断再变向'],
      ['1对1攻防步法', '{r}次×6秒', '贴近专项情境'],
      ['多方向起动+制动', '3组×4次', '制动时屈膝屈髋']
    ]
  ],
  jump: [
    [
      ['落地缓冲（小台跳下定住）', '2组×5次', '屈膝屈髋，膝对脚尖'],
      ['立定跳停稳', '2组×4次', '双脚同时落地，停2秒'],
      ['双脚前后/左右小跳过线', '2组×10次', '前脚掌轻快']
    ],
    [
      ['跳上跳箱（跳上不跳下）', '3组×4次', '落箱安静，走下来'],
      ['单脚跳停稳', '2组×4次/侧', '落地膝不内扣'],
      ['连续立定跳（3连跳）', '3组×3次', '每跳之间停顿短']
    ],
    [
      ['连续跨越低栏（30–50厘米）', '3组×5次', '触地快而有弹性'],
      ['单脚连续跳', '3组×4次/侧', '保持髋部稳定'],
      ['侧向连续跳', '3组×6次', '落地稳定后再加速']
    ]
  ],
  throw: [
    [
      ['双手胸前推球（1–2千克）', '3组×6次', '蹬腿后推手'],
      ['过头抛软球/沙包', '3组×6次', '对空地，听口令捡'],
      ['跪姿胸前推球', '2组×6次', '躯干稳定']
    ],
    [
      ['实心球侧抛墙（2–3千克）', '3组×5次/侧', '转髋带手'],
      ['实心球过头后抛', '3组×5次', '伸髋发力'],
      ['上步胸前推球', '3组×5次', '下肢先动']
    ],
    [
      ['实心球旋转砸墙（3–4千克）', '4组×4次/侧', '最大速度出手'],
      ['跳步过头后抛', '3组×4次', '伸展连贯'],
      ['单臂推实心球（模拟推铅球）', '3组×4次/侧', '用力顺序完整']
    ]
  ],
  rope: [
    [
      ['节拍单摇', '{r}组×20秒，间歇40秒', '跟节拍，轻落地'],
      ['原地踝弹跳（Pogo）', '2组×10次', '膝几乎不弯'],
      ['开合/交换脚节奏练习', '3组×8拍', '手脚协调']
    ],
    [
      ['快速单摇', '{r}组×15秒，间歇45秒', '手腕摇绳，频率稳定'],
      ['Pogo 连续弹跳', '3组×12次', '触地短、落地安静'],
      ['花样步伐组合（交换脚+开合）', '{r}组×20秒', '失误后立即接上']
    ],
    [
      ['快速单摇冲刺', '{r}组×10秒，间歇50秒', '最大频率'],
      ['双摇或交叉摇', '4组×5次', '先保证落地缓冲'],
      ['单脚 Pogo', '3组×8次/侧', '踝关节刚性']
    ]
  ],
  swim: [
    [
      ['扶边快速打腿', '{r}组×15秒，休息30秒', '从髋部发力，脚能踩到底'],
      ['水中快走比赛', '{r}次×5米', '在浅水区内完成'],
      ['扶边蹬边滑行后站起', '6次', '身体成一条直线，滑完立即站稳']
    ],
    [
      ['25米快速游', '{r}次，次间60秒', '保持动作完整'],
      ['蹬边出发+15米快游', '{r}次', '出发后先滑行再划'],
      ['竖直打腿', '3组×20秒', '头部稳定']
    ],
    [
      ['25米冲刺', '{r}次，次间90秒', '最大速度'],
      ['转身+15米快游', '{r}次', '转身快、蹬壁有力'],
      ['50米配速游', '3次，次间2分钟', '按目标配速']
    ]
  ]
}

type StrengthKey =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'push'
  | 'pull'
  | 'antiExt'
  | 'antiRot'
  | 'hamstring'
  | 'calf'
  | 'shoulder'
  | 'adductor'
  | 'wrist'
  | 'balance'

type StrengthUnit = 'reps' | 'side' | 'hold' | 'holdSide' | 'eccentric'

interface StrengthMove {
  names: Tiered<string>
  unit: StrengthUnit
  main: boolean
  cue: string
}

const STRENGTH: Record<StrengthKey, StrengthMove> = {
  squat: { names: ['自重箱式深蹲', '高脚杯深蹲', '杠铃前蹲（技术达标后）'], unit: 'reps', main: true, cue: '膝对脚尖，脊柱中立' },
  hinge: { names: ['木棍髋铰链', '壶铃/哑铃罗马尼亚硬拉', '六角杠铃硬拉'], unit: 'reps', main: true, cue: '髋向后推，背部平直' },
  lunge: { names: ['静态分腿蹲', '后撤步弓步蹲', '后脚抬高分腿蹲（持哑铃）'], unit: 'side', main: true, cue: '前膝稳定不内扣' },
  push: { names: ['上斜俯卧撑', '标准俯卧撑', '哑铃卧推'], unit: 'reps', main: true, cue: '身体成直线，肩胛稳定' },
  pull: { names: ['弹力带划船', '低杠反向划船', '引体向上（可辅助）'], unit: 'reps', main: true, cue: '先收肩胛再拉' },
  antiExt: { names: ['死虫（慢速交替）', '平板支撑', '跪姿健腹轮'], unit: 'hold', main: false, cue: '腰不塌，呼吸不憋' },
  antiRot: { names: ['鸟狗', '侧平板', 'Pallof 抗旋转推'], unit: 'holdSide', main: false, cue: '躯干不转动' },
  hamstring: { names: ['臀桥', '单腿臀桥', '北欧挺（离心，同伴压脚）'], unit: 'eccentric', main: false, cue: '慢放，控制下落' },
  calf: { names: ['双脚提踵', '单脚提踵', '单脚离心提踵（台阶）'], unit: 'reps', main: false, cue: '上快下慢，踝不外翻' },
  shoulder: { names: ['弹力带肩外旋', '俯身 Y-T-W', '半跪单臂上推'], unit: 'reps', main: false, cue: '轻负荷，肩不耸' },
  adductor: { names: ['侧卧内收抬腿', '哥本哈根（短杠杆）', '哥本哈根（长杠杆）'], unit: 'holdSide', main: false, cue: '髋部抬平' },
  wrist: { names: ['握力球捏握', '弹力带腕屈伸', '哑铃腕旋转'], unit: 'reps', main: false, cue: '慢速全幅度' },
  balance: { names: ['单腿站立平衡（闭眼进阶）', '单腿 Y 平衡伸够', '单腿蹲至箱'], unit: 'side', main: false, cue: '膝不内扣，骨盆水平' }
}

const PREHAB_MOVE: Record<PrehabKey, StrengthKey> = {
  knee: 'balance',
  shoulder: 'shoulder',
  ankle: 'calf',
  hamstring: 'hamstring',
  adductor: 'adductor',
  trunk: 'antiExt',
  wrist: 'wrist'
}

const MOBILITY: Record<Region, readonly Line[]> = {
  lower: [
    ['M 弓步转体（世界最伟大拉伸）', '5次/侧', '后腿伸直，胸椎旋转'],
    ['M 踝关节靠墙推膝', '8次/侧', '脚跟不离地'],
    ['M 髋关节 90/90 转换', '6次/侧', '躯干立直']
  ],
  upper: [
    ['M 弹力带肩部拉开', '12次', '肩胛后收下沉'],
    ['M 跪姿胸椎旋转', '6次/侧', '腰不跟着转'],
    ['M 肩胛俯卧撑', '10次', '只动肩胛']
  ],
  full: [
    ['M 弓步转体（世界最伟大拉伸）', '5次/侧', '后腿伸直，胸椎旋转'],
    ['M 跪姿胸椎旋转', '6次/侧', '腰不跟着转'],
    ['M 踝关节靠墙推膝', '8次/侧', '脚跟不离地']
  ]
}

const ACTIVATE: Record<Region, Line> = {
  lower: ['A 臀桥+侧向弹力带走', '各2组×10次', '臀部发力，膝不内扣'],
  upper: ['A 弹力带拉开+肩外旋', '各2组×12次', '肩胛下沉后收'],
  full: ['A 臀桥+鸟狗', '各2组×8次', '躯干稳定']
}

const STRETCH: Record<Region, readonly Line[]> = {
  lower: [
    ['小腿拉伸', '30秒/侧', '脚跟踩实'],
    ['股四头肌站立拉伸', '30秒/侧', '骨盆不前倾'],
    ['腘绳肌仰卧拉伸', '30秒/侧', '膝微屈']
  ],
  upper: [
    ['肩后侧交叉拉伸', '30秒/侧', '肩不耸'],
    ['胸大肌门框拉伸', '30秒/侧', '不挺腰'],
    ['前臂屈伸肌拉伸', '20秒/侧', '轻拉']
  ],
  full: [
    ['髋屈肌跪姿拉伸', '30秒/侧', '收紧臀部'],
    ['腘绳肌仰卧拉伸', '30秒/侧', '膝微屈'],
    ['肩后侧交叉拉伸', '30秒/侧', '肩不耸']
  ]
}

interface PhaseInfo {
  goal: string
  practice: string
  constraint: string
  rpe: readonly [number, number]
  volume: number
  reps: number
}

const PHASES: Record<TrainingPhase, PhaseInfo> = {
  adapt: {
    goal: '建立动作模式和训练习惯，量与强度都偏低，先观察每名队员的动作基线。',
    practice: '封闭练习',
    constraint: '降低难度：减少人数或对抗，先求做对',
    rpe: [5, 6],
    volume: 0.8,
    reps: 4
  },
  develop: {
    goal: '动作质量稳定后逐步增加训练量，技术练习开始变换条件。',
    practice: '变式练习',
    constraint: '变化条件：距离、角度、节奏每轮都变',
    rpe: [6, 7],
    volume: 1,
    reps: 5
  },
  intensify: {
    goal: '训练量持平，提高强度、速度和对抗压力，技术放进决策情境。',
    practice: '随机+决策',
    constraint: '加入对抗和计分压力，贴近比赛',
    rpe: [7, 8],
    volume: 0.9,
    reps: 6
  },
  taper: {
    goal: '训练量减少约40%、保持强度，让身体消除疲劳并完成阶段测评。',
    practice: '巩固练习',
    constraint: '短时高质量，保持比赛节奏',
    rpe: [5, 6],
    volume: 0.6,
    reps: 3
  }
}

interface FocusInfo {
  weights: Record<MainBlock, number>
  region: Region | 'profile' | 'prehab'
  drillOrder: readonly [number, number, number, number]
}

const FOCUS: Record<TrainingSessionFocus, FocusInfo> = {
  speed: { weights: weights(1.5, 1, 0.7, 1.1, 0.5), region: 'lower', drillOrder: [0, 1, 2, 3] },
  skill: { weights: weights(0.8, 1.4, 0.9, 1, 0.6), region: 'upper', drillOrder: [2, 3, 0, 1] },
  game: { weights: weights(0.6, 0.9, 1.5, 0.6, 1.5), region: 'full', drillOrder: [1, 3, 0, 2] },
  recovery: { weights: weights(0.4, 1.3, 0.8, 0.7, 0.4), region: 'prehab', drillOrder: [0, 2, 1, 3] },
  full: { weights: weights(1, 1, 1, 1, 1), region: 'profile', drillOrder: [0, 1, 2, 3] }
}

const WEEK_PATTERN: Record<number, readonly TrainingSessionFocus[]> = {
  1: ['full'],
  2: ['speed', 'game'],
  3: ['speed', 'skill', 'game'],
  4: ['speed', 'skill', 'recovery', 'game'],
  5: ['speed', 'skill', 'recovery', 'game', 'skill']
}

const DAY_OFFSETS: Record<number, readonly number[]> = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4]
}

const STAGE_INDEX: Record<SchoolStage, number> = { primary: 0, junior: 1, senior: 2 }
const LEVEL_INDEX: Record<TrainingLevel, number> = { starter: 0, basic: 1, developing: 2 }

const STAGE_NOTE: Record<SchoolStage, string> = {
  primary: '小学：以游戏化任务和基本动作能力为主；力量练习只用自重或很轻的器械，不追求极限成绩。',
  junior: '初中：近3个月身高增长明显（生长突增期）的队员，减少跳跃和冲刺次数，多做技术与协调。',
  senior: '高中：外加负荷前先确认动作达标；按 RPE 调整负荷，不做力竭。'
}

const BLOCK_LABEL: Record<MainBlock, string> = {
  quality: '速度与爆发',
  skill: '专项技术',
  apply: '专项应用',
  strength: '力量与动作能力',
  conditioning: '能量系统'
}

const BLOCK_ORDER: readonly MainBlock[] = ['quality', 'skill', 'apply', 'strength', 'conditioning']
const RECOVERY_ORDER: readonly MainBlock[] = ['skill', 'quality', 'apply', 'strength', 'conditioning']

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function strip(text: string): string {
  return text.replace(/[。；，]+$/u, '')
}

function line(item: Line): string {
  return item.filter((part) => part !== '').join('｜')
}

function header(label: string, minutes: number): string {
  return `【${label} · ${minutes}分钟】`
}

function tierOf(stage: SchoolStage, level: TrainingLevel, skillGated = false): 0 | 1 | 2 {
  const raw = skillGated ? LEVEL_INDEX[level] : Math.round((STAGE_INDEX[stage] + LEVEL_INDEX[level]) / 2)
  const cap = stage === 'primary' ? 1 : 2
  return clamp(raw, 0, cap) as 0 | 1 | 2
}

function rpeRange(stage: SchoolStage, phase: TrainingPhase, focus: TrainingSessionFocus): readonly [number, number] {
  let [lo, hi] = PHASES[phase].rpe
  if (stage === 'primary') {
    hi = Math.min(hi, 7)
    lo = Math.min(lo, hi - 1)
  }
  if (focus === 'recovery') {
    lo -= 1
    hi -= 1
  }
  return [lo, hi]
}

function phaseFor(index: number, totalWeeks: number): TrainingPhase {
  if (totalWeeks === 1) {
    return 'develop'
  }
  if (index === 0) {
    return 'adapt'
  }
  if (totalWeeks >= 4 && index === totalWeeks - 1) {
    return 'taper'
  }
  const position = index % 4
  if (position === 3) {
    return index === totalWeeks - 2 ? 'intensify' : 'taper'
  }
  return position === 2 ? 'intensify' : 'develop'
}

export function trainingPhaseSequence(totalWeeks: number): TrainingPhase[] {
  return Array.from({ length: totalWeeks }, (_, index) => phaseFor(index, totalWeeks))
}

const MIN_BLOCK_MINUTES: Record<MainBlock, number> = {
  quality: 5,
  skill: 5,
  apply: 5,
  strength: 8,
  conditioning: 5
}

function allocate(total: number, raw: Record<MainBlock, number>): { warmup: number; cooldown: number; main: Map<MainBlock, number> } {
  const warmup = clamp(Math.round(total * 0.18), 8, 20)
  const cooldown = clamp(Math.round(total * 0.08), 5, 10)
  const available = total - warmup - cooldown
  let active = BLOCK_ORDER.filter((key) => raw[key] > 0)
  for (;;) {
    const sum = active.reduce((acc, key) => acc + raw[key], 0)
    const smallest = active
      .filter((key) => key !== 'skill')
      .sort((a, b) => raw[a] - raw[b])
      .find((key) => (available * raw[key]) / sum < MIN_BLOCK_MINUTES[key])
    if (!smallest || active.length <= 1) {
      break
    }
    active = active.filter((key) => key !== smallest)
  }
  const sum = active.reduce((acc, key) => acc + raw[key], 0)
  const main = new Map<MainBlock, number>()
  let used = 0
  for (const key of active) {
    const minutes = Math.floor((available * raw[key]) / sum)
    main.set(key, minutes)
    used += minutes
  }
  const ranked = [...active].sort((a, b) => raw[b] - raw[a])
  for (let index = 0; used < available; index += 1, used += 1) {
    const key = ranked[index % ranked.length]
    main.set(key, (main.get(key) ?? 0) + 1)
  }
  return { warmup, cooldown, main }
}

interface SessionContext {
  program: SportProgram
  profile: SportProfile
  stage: SchoolStage
  level: TrainingLevel
  tier: 0 | 1 | 2
  phase: TrainingPhase
  focus: TrainingSessionFocus
}

function warmupLines(ctx: SessionContext, minutes: number, region: Region): string[] {
  const raise = Math.max(3, Math.round(minutes * 0.35))
  const mobility = MOBILITY[region]
  return [
    header('准备活动 RAMP', minutes),
    line([ctx.profile.raise ?? 'R 慢跑与专项移动', `${raise}分钟`, strip(ctx.program.prep)]),
    line(mobility[0]),
    line(mobility[1]),
    ...(minutes >= 12 ? [line(mobility[2])] : []),
    line(ACTIVATE[region]),
    line(ctx.profile.potentiate)
  ]
}

const QUALITY_ORDER: readonly QualityMode[] = ['linear', 'agility', 'jump', 'throw', 'rope', 'swim']

function qualityLines(ctx: SessionContext, minutes: number): string[] {
  const modes = [...ctx.profile.quality].sort((a, b) => QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b))
  const count = clamp(Math.round(minutes / 5), 1, 4)
  const reps = Math.max(2, PHASES[ctx.phase].reps - (ctx.stage === 'primary' ? 1 : 0))
  const offset = ctx.focus === 'game' ? 1 : 0
  const picked: Array<{ mode: QualityMode; item: Line }> = []
  for (let index = 0; index < count; index += 1) {
    const mode = modes[index % modes.length]
    const library = QUALITY_LIBRARY[mode][ctx.tier]
    picked.push({ mode, item: library[(Math.floor(index / modes.length) + offset) % library.length] })
  }
  const lines = picked
    .sort((a, b) => QUALITY_ORDER.indexOf(a.mode) - QUALITY_ORDER.indexOf(b.mode))
    .map(({ item }) => line([item[0], item[1].replace('{r}', String(reps)), item[2]]))
  if (ctx.stage === 'senior' && ctx.tier === 2 && modes.includes('jump') && ctx.phase === 'intensify') {
    lines.push(line(['低台跳深（20–30厘米）', '3组×4次', '触地即起；只在落地稳定的队员中进行']))
  }
  if (picked.some((item) => item.mode === 'jump' || item.mode === 'rope')) {
    const base = [40, 60, 80][STAGE_INDEX[ctx.stage]] * (1 + 0.15 * LEVEL_INDEX[ctx.level])
    const contacts = Math.round((base * PHASES[ctx.phase].volume) / 5) * 5
    lines.push(line(['跳跃总量控制', `本段总触地≤${contacts}次`, '落地质量下降立即停止跳跃']))
  }
  return [header(ctx.profile.quality.includes('swim') ? '水中速度' : BLOCK_LABEL.quality, minutes), ...lines]
}

function testLines(ctx: SessionContext, minutes: number, baseline: boolean): string[] {
  return [
    header(baseline ? '基线测评' : '阶段测评', minutes),
    ...(ctx.level === 'starter' && ctx.profile.starterTests ? ctx.profile.starterTests : ctx.profile.tests).map((item) =>
      line([`测评：${item}`, '按统一流程，充分热身后进行', baseline ? '记入成绩作为基线' : '记入成绩，与基线比较'])
    )
  ]
}

function skillLines(ctx: SessionContext, minutes: number): string[] {
  const lesson = ctx.program.levels[ctx.level]
  const order = FOCUS[ctx.focus].drillOrder
  const count = clamp(Math.round(minutes / 7), 1, 4)
  const each = Math.max(3, Math.floor(minutes / count))
  const practice = PHASES[ctx.phase].practice
  const lines = order.slice(0, count).map((drillIndex, index) =>
    line([strip(lesson.drills[drillIndex]), `${each}分钟（${practice}）`, strip(lesson.points[index % lesson.points.length])])
  )
  return [header(BLOCK_LABEL.skill, minutes), ...lines]
}

function applyLines(ctx: SessionContext, minutes: number): string[] {
  const round = ctx.phase === 'taper' ? Math.max(2, ctx.profile.gameRound - 1) : ctx.profile.gameRound
  const rounds = Math.max(1, Math.floor(minutes / (round + 1)))
  const lesson = ctx.program.levels[ctx.level]
  const game = ctx.level === 'starter' && ctx.profile.starterGame ? ctx.profile.starterGame : ctx.profile.game
  return [
    header(BLOCK_LABEL.apply, minutes),
    line([game, `${rounds}轮×${round}分钟，轮间1分钟`, PHASES[ctx.phase].constraint]),
    line([strip(lesson.apply), '贯穿本段', strip(lesson.watch[0])])
  ]
}

function strengthDose(ctx: SessionContext, move: StrengthMove, compact: boolean): string {
  const stageIndex = STAGE_INDEX[ctx.stage]
  const levelIndex = LEVEL_INDEX[ctx.level]
  const phase = ctx.phase
  const [lo, hi] = rpeRange(ctx.stage, phase, ctx.focus)
  const rpe = `RPE ${lo}–${hi}`
  if (move.main) {
    const setsTable = [
      [2, 2, 2],
      [2, 3, 3],
      [2, 3, 4]
    ][stageIndex]
    const repsTable = [
      ['10', '8–10', '8–10'],
      ['10–12', '8–12', '6–10'],
      ['10–12', '8–10', '4–6']
    ][stageIndex]
    const restTable = [
      ['60秒', '60秒', '60秒'],
      ['60–90秒', '60–90秒', '90秒'],
      ['90秒', '2分钟', '2–3分钟']
    ][stageIndex]
    let sets = setsTable[levelIndex]
    if (phase === 'adapt' || phase === 'taper' || ctx.focus === 'recovery') {
      sets = Math.max(phase === 'taper' ? 1 : 2, sets - 1)
    }
    if (compact) {
      sets = Math.min(sets, 2)
    }
    const suffix = move.unit === 'side' ? '/侧' : ''
    return `${sets}组×${repsTable[levelIndex]}次${suffix}，${rpe}，组间${restTable[levelIndex]}`
  }
  const sets = phase === 'taper' ? 1 : stageIndex === 2 && levelIndex === 2 ? 3 : 2
  const hold = ['15–20', '20–30', '30–40'][stageIndex]
  switch (move.unit) {
    case 'hold':
      return `${sets}组×${hold}秒`
    case 'holdSide':
      return `${sets}组×${hold}秒/侧`
    case 'side':
      return `${sets}组×8次/侧`
    case 'eccentric':
      return ctx.tier === 2 ? `${sets}组×4–6次` : `${sets}组×10次`
    default:
      return `${sets}组×12–15次`
  }
}

function strengthLines(ctx: SessionContext, minutes: number, label: string): string[] {
  const focusRegion = FOCUS[ctx.focus].region
  const region = focusRegion === 'profile' ? ctx.profile.region : focusRegion
  const pool: Record<Region | 'prehab', readonly StrengthKey[]> = {
    lower: ['squat', 'hinge', 'lunge', 'calf', 'antiExt'],
    upper: ['push', 'pull', 'antiRot', 'shoulder', 'antiExt'],
    full: ['squat', 'push', 'hinge', 'pull', 'antiExt', 'antiRot'],
    prehab: ['balance', 'antiExt', 'antiRot', 'calf']
  }
  const count = clamp(Math.round(minutes / 4), 2, 6)
  const prehabCount = count >= 4 ? 2 : 1
  const prehab = ctx.profile.prehab.map((key) => PREHAB_MOVE[key])
  const keys: StrengthKey[] = []
  for (const key of pool[region]) {
    if (keys.length >= count - prehabCount) {
      break
    }
    keys.push(key)
  }
  for (const key of [...prehab, ...pool[region]]) {
    if (keys.length >= count) {
      break
    }
    if (!keys.includes(key)) {
      keys.push(key)
    }
  }
  const tier = ctx.stage === 'primary' ? 0 : ctx.tier
  const lines = keys.map((key, index) => {
    const move = STRENGTH[key]
    const tag = `${String.fromCharCode(65 + Math.floor(index / 2))}${(index % 2) + 1}`
    return line([`${tag} ${move.names[tier]}`, strengthDose(ctx, move, minutes < 12), move.cue])
  })
  return [header(label, minutes), ...lines, line(['同字母两项交替进行', '组间休息按第一项', '动作变形即停止该组'])]
}

function conditioningLines(ctx: SessionContext, minutes: number): string[] {
  const m = Math.max(4, Math.round(minutes * (ctx.phase === 'taper' ? 0.7 : 1)))
  const primary = ctx.stage === 'primary'
  const phase = ctx.phase
  let item: Line
  switch (ctx.profile.conditioning) {
    case 'aerobic':
      if (primary) {
        item = ['走跑交替', `${Math.max(1, Math.floor(m / 3))}组×（跑2分钟+走1分钟）`, '能说短句，不憋气']
      } else if (phase === 'adapt' || phase === 'taper') {
        item = ['匀速持续跑', `${m}分钟`, 'RPE 4–5，能说短句']
      } else if (phase === 'develop') {
        item = ['法特莱克变速跑', `${Math.max(1, Math.floor(m / 3))}组×（快2分钟+慢1分钟）`, 'RPE 6–7']
      } else if (ctx.tier === 2) {
        item = ['间歇跑', `${Math.max(2, Math.floor(m / 3.5))}×400米，间歇90秒`, 'RPE 8，配速稳定']
      } else {
        item = ['阈值节奏跑', `${Math.max(1, Math.floor(m / 4.5))}组×3分钟，组间慢跑90秒`, 'RPE 7']
      }
      break
    case 'alactic':
      item = primary
        ? ['接力追逐游戏', `${Math.max(2, Math.floor(m / 2))}局×1分钟，局间1分钟`, '短时快速，充分休息']
        : ['节奏跑（Tempo）', `${clamp(Math.floor(m / 1.5), 3, 12)}×100米，约65–70%速度，走回恢复`, '放松、动作完整，不冲刺']
      break
    case 'intermittent':
      if (primary) {
        item = ['间歇游戏（红绿灯/追逐）', `${Math.max(2, Math.floor(m / 2))}局×1分钟，局间1分钟`, '快慢交替']
      } else if (phase === 'intensify' && ctx.tier >= 1) {
        const sets = clamp(Math.floor(m / 5), 1, ctx.stage === 'junior' ? 2 : 3)
        item = ['重复冲刺能力（RSA）', `${sets}组×6×20米，次间20秒，组间3分钟`, '每次接近全力，动作不散']
      } else if (phase === 'develop') {
        item = ['30秒快/30秒慢间歇跑', `${m}次`, 'RPE 7']
      } else {
        item = ['15秒快/15秒慢间歇跑', `连续${m}分钟（${m * 2}次）`, 'RPE 6']
      }
      break
    case 'routine':
      item = primary
        ? ['分段连续演练', `${Math.max(2, Math.floor(m / 3))}段，段间1分钟`, '动作完整，不憋气']
        : ['成套连续演练', `${Math.max(1, Math.floor(m / 4))}遍，遍间2–3分钟`, '后半段保持动作质量']
      break
    case 'rope':
      item =
        phase === 'intensify' && !primary
          ? ['1分钟计数跳', `${Math.max(1, Math.floor(m / 3))}组，组间2分钟`, '高频但不跺地']
          : ['间歇跳绳', `${Math.max(2, m)}组×30秒，间歇30秒`, 'RPE 6–7']
      break
    default:
      if (ctx.level === 'starter') {
        item = ['扶边打腿间歇', `${Math.max(2, m)}组×20秒，休息40秒`, '浅水区内，随时能站立']
      } else if (primary) {
        item = ['分段游', `${Math.max(2, m)}×12.5米，扶边休息30秒`, '浅水区内，不憋气']
      } else if (phase === 'adapt' || phase === 'taper') {
        item = ['持续游', `${Math.max(2, Math.floor(m / 1.5))}×50米，间歇20秒`, 'RPE 5']
      } else if (phase === 'develop') {
        item = ctx.tier === 0
          ? ['有氧分段游', `${Math.max(2, Math.floor(m / 1.5))}×50米，间歇20秒`, 'RPE 6']
          : ['有氧分段游', `${Math.max(2, Math.floor(m / 3))}×100米，间歇20–30秒`, 'RPE 6–7']
      } else {
        item = ['快速分段游', `${Math.max(2, Math.floor(m / 1.5))}×50米，间歇40秒`, 'RPE 8']
      }
      break
  }
  return [header(BLOCK_LABEL.conditioning, minutes), line(item)]
}

function cooldownLines(minutes: number, region: Region): string[] {
  const stretch = STRETCH[region]
  return [
    header('整理与恢复', minutes),
    line(['慢走与呼吸调整', '2–3分钟', '心率回落']),
    ...stretch.map(line),
    line(['课后记录', '每人报 RPE（0–10）', '录入训练记录，计算 sRPE'])
  ]
}

export interface TrainingBlockInput {
  stage: SchoolStage
  programId: string
  level: TrainingLevel
  durationMinutes: number
  weeks: number
  sessionsPerWeek: number
  startDate: string
  blockId: string
}

export interface GeneratedTrainingPlan {
  date: string
  title: string
  goal: string
  content: string
  notes: string
  blueprint: TrainingPlanBlueprint
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + days))
  return next.toISOString().slice(0, 10)
}

function assertInput(input: TrainingBlockInput): SportProgram {
  const program = getSportProgram(input.programId)
  if (!program || !isSchoolStage(input.stage) || !isTrainingLevel(input.level)) {
    throw new Error('训练项目、学段或水平不正确')
  }
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < PLAN_DURATION_MIN || input.durationMinutes > PLAN_DURATION_MAX) {
    throw new Error(`单次训练时长应为 ${PLAN_DURATION_MIN}–${PLAN_DURATION_MAX} 分钟`)
  }
  if (!Number.isInteger(input.weeks) || input.weeks < 1 || input.weeks > PLAN_WEEKS_MAX) {
    throw new Error(`周期应为 1–${PLAN_WEEKS_MAX} 周`)
  }
  if (!Number.isInteger(input.sessionsPerWeek) || input.sessionsPerWeek < 1 || input.sessionsPerWeek > PLAN_SESSIONS_PER_WEEK_MAX) {
    throw new Error(`每周训练次数应为 1–${PLAN_SESSIONS_PER_WEEK_MAX} 次`)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) {
    throw new Error('请选择开始日期')
  }
  return program
}

interface SessionSlot {
  week: number
  session: number
  phase: TrainingPhase
  focus: TrainingSessionFocus
  date: string
}

function slotLabel(slot: SessionSlot): string {
  return `第${slot.week}周第${slot.session}课（${slot.date}，${TRAINING_FOCUS_LABELS[slot.focus]}）`
}

function buildSession(
  input: TrainingBlockInput,
  program: SportProgram,
  slot: SessionSlot,
  previous: SessionSlot | null,
  next: SessionSlot | null
): GeneratedTrainingPlan {
  const profile = PROFILES[program.id]
  const ctx: SessionContext = {
    program,
    profile,
    stage: input.stage,
    level: input.level,
    tier: tierOf(input.stage, input.level, profile.skillGated),
    phase: slot.phase,
    focus: slot.focus
  }
  const focusInfo = FOCUS[slot.focus]
  const region: Region = focusInfo.region === 'profile' || focusInfo.region === 'prehab' ? profile.region : focusInfo.region
  const raw = BLOCK_ORDER.reduce(
    (acc, key) => ({ ...acc, [key]: profile.weights[key] * focusInfo.weights[key] }),
    {} as Record<MainBlock, number>
  )
  const { warmup, cooldown, main } = allocate(input.durationMinutes, raw)
  const baseline = input.weeks >= 4 && slot.week === 1 && slot.session === 1
  const assessment = baseline || (input.weeks >= 4 && slot.phase === 'taper' && slot.session === 1)
  const testBlock = assessment ? (['quality', 'apply', 'skill'] as const).find((key) => main.has(key)) : undefined
  const order = slot.focus === 'recovery' ? RECOVERY_ORDER : BLOCK_ORDER
  const swim = program.id === 'swimming'
  const stageLabel = SCHOOL_STAGE_LABELS[input.stage]
  const levelLabel = TRAINING_LEVEL_LABELS[input.level]
  const phaseLabel = TRAINING_PHASE_LABELS[slot.phase]
  const [rpeLo, rpeHi] = rpeRange(input.stage, slot.phase, slot.focus)

  const body: string[] = []
  for (const key of order) {
    const minutes = main.get(key)
    if (!minutes) {
      continue
    }
    if (key === testBlock) {
      body.push(...testLines(ctx, minutes, baseline))
      continue
    }
    switch (key) {
      case 'quality':
        body.push(...qualityLines(ctx, minutes))
        break
      case 'skill':
        body.push(...skillLines(ctx, minutes))
        break
      case 'apply':
        body.push(...applyLines(ctx, minutes))
        break
      case 'strength':
        body.push(...strengthLines(ctx, minutes, swim ? '陆上力量与动作能力' : BLOCK_LABEL.strength))
        break
      case 'conditioning':
        body.push(...conditioningLines(ctx, minutes))
        break
    }
  }

  const content = [
    `◆ ${program.name}｜${stageLabel}·${levelLabel}｜第${slot.week}/${input.weeks}周 第${slot.session}课｜${phaseLabel}｜${TRAINING_FOCUS_LABELS[slot.focus]}｜共${input.durationMinutes}分钟`,
    `◆ 课前确认：${program.safety}`,
    `◆ 学段要求：${program.dose[input.stage]}`,
    `◆ 不要做：${program.avoid}`,
    `◆ 器械：${program.equipment}；组织：${STAGE_ORGANIZE[input.stage]}`,
    ...warmupLines(ctx, warmup, region),
    ...body,
    ...cooldownLines(cooldown, region)
  ].join('\n')

  const lesson = program.levels[input.level]
  const goal = [
    `阶段：${phaseLabel}——${PHASES[slot.phase].goal}`,
    `本课重点：${TRAINING_FOCUS_LABELS[slot.focus]}${assessment ? (baseline ? '，含基线测评' : '，含阶段测评') : ''}。技术目标：${lesson.aim}`,
    `技术要点：${lesson.points.join(' ')}`,
    `承接：${previous ? `上一课为${slotLabel(previous)}` : '本周期第一课，先观察动作基线'}；${next ? `下一课为${slotLabel(next)}` : '本课为周期最后一课，课后对照测评结果安排下一周期'}。`,
    `负荷目标：课后 RPE ${rpeLo}–${rpeHi}，sRPE 约 ${rpeLo * input.durationMinutes}–${rpeHi * input.durationMinutes}。`
  ].join('\n')

  const notes = [
    `负荷监控：课后每人报 RPE（0–10）并填在训练记录里，sRPE = RPE × 分钟。连续两课明显高于目标就降量。`,
    STAGE_NOTE[input.stage],
    `重点观察：${lesson.watch[0]}${lesson.watch[1]}`,
    '停止标准：疼痛、头晕、胸闷或动作明显变形，立即停止该练习。',
    `编写依据：${SHORT_REFERENCES}请按人数、场地、天气和当天状态调整。`
  ].join('\n')

  const focusShort = TRAINING_FOCUS_LABELS[slot.focus]
  const title =
    input.weeks === 1 && input.sessionsPerWeek === 1
      ? `${program.name}·${stageLabel}${levelLabel}·${focusShort}（${input.durationMinutes}分钟）`
      : `${program.name}·${stageLabel}${levelLabel}·W${slot.week}-${slot.session} ${focusShort}`

  if (title.length > 80 || goal.length > 1000 || content.length > 4000 || notes.length > 1000) {
    throw new Error(`${title}超出训练计划字数限制`)
  }

  return {
    date: slot.date,
    title,
    goal,
    content,
    notes,
    blueprint: {
      stage: input.stage,
      programId: program.id,
      level: input.level,
      durationMinutes: input.durationMinutes,
      blockId: input.blockId,
      week: slot.week,
      session: slot.session,
      totalWeeks: input.weeks,
      sessionsPerWeek: input.sessionsPerWeek,
      phase: slot.phase,
      focus: slot.focus
    }
  }
}

/** 生成一个连续的训练周期：每周按高低强度交替安排课次，周与周之间按适应→发展→强化→减量递进。 */
export function generateTrainingBlock(input: TrainingBlockInput): GeneratedTrainingPlan[] {
  const program = assertInput(input)
  const pattern = WEEK_PATTERN[input.sessionsPerWeek]
  const offsets = DAY_OFFSETS[input.sessionsPerWeek]
  const slots: SessionSlot[] = []
  for (let week = 1; week <= input.weeks; week += 1) {
    const phase = phaseFor(week - 1, input.weeks)
    for (let session = 1; session <= input.sessionsPerWeek; session += 1) {
      slots.push({
        week,
        session,
        phase,
        focus: pattern[session - 1],
        date: addDays(input.startDate, (week - 1) * 7 + offsets[session - 1])
      })
    }
  }
  return slots.map((slot, index) =>
    buildSession(input, program, slot, slots[index - 1] ?? null, slots[index + 1] ?? null)
  )
}

const HEADER_KIND: ReadonlyArray<readonly [RegExp, TrainingExerciseKind]> = [
  [/准备|热身/u, 'warmup'],
  [/整理|恢复|放松/u, 'recovery'],
  [/力量/u, 'strength'],
  [/速度|爆发|能量|测评/u, 'repeat'],
  [/技术|应用/u, 'drill']
]

export interface PlanContentExercise {
  name: string
  kind: TrainingExerciseKind
  sets: number | null
  reps: number | null
  distanceM: number | null
  durationSec: number | null
  notes: string
}

function firstInt(pattern: RegExp, text: string, max: number): number | null {
  const match = pattern.exec(text)
  if (!match) {
    return null
  }
  const value = Number(match[1])
  return Number.isInteger(value) && value >= 0 && value <= max ? value : null
}

/** 把训练计划内容拆成训练记录里的练习行；【标题】决定类型，◆ 行是说明不进入练习。 */
export function exercisesFromPlanContent(content: string): PlanContentExercise[] {
  let kind: TrainingExerciseKind = 'drill'
  const items: PlanContentExercise[] = []
  for (const raw of content.split(/\r?\n/)) {
    const text = raw.trim()
    if (text === '' || text.startsWith('◆')) {
      continue
    }
    const heading = /^【(.+?)】$/u.exec(text)
    if (heading) {
      kind = HEADER_KIND.find(([pattern]) => pattern.test(heading[1]))?.[1] ?? 'other'
      continue
    }
    const [head, ...rest] = text.split('｜')
    const dose = rest[0] ?? ''
    const overflow = head.length > 80 ? head.slice(80) : ''
    const notes = [overflow, ...rest].filter(Boolean).join('｜')
    const sets = firstInt(/(\d+)组/u, dose, 99)
    const reps = firstInt(/×(\d+)(?:–\d+)?次/u, dose, 999)
    const distanceM = firstInt(/×(\d+)(?:–\d+)?米/u, dose, 100000)
    const minutes = sets === null && reps === null ? firstInt(/^(\d+)分钟/u, dose, 600) : null
    const seconds = firstInt(/×(\d+)(?:–\d+)?秒/u, dose, 36000)
    items.push({
      name: head.slice(0, 80),
      kind,
      sets,
      reps,
      distanceM,
      durationSec: minutes !== null ? minutes * 60 : seconds,
      notes: notes.length > 200 ? notes.slice(0, 200) : notes
    })
  }
  return items
}
