import type { ExamItemDefinition, ExamStandard } from './types'

const ITEM_KEY_ALIASES: Record<string, string[]> = {
  'run-1000m': ['1000米', '男1000米', '一千米', '1000米跑', '男生1000米', '1000m', '男子1000米', '男子1000米跑'],
  'run-800m': ['800米', '女800米', '八百米', '800米跑', '女生800米', '800m', '女子800米', '女子800米跑'],
  'run-100m': ['100米', '一百米', '100米跑'],
  'run-200m': ['200米', '200米跑', '200米短跑'],
  'run-50m': ['50米', '50米跑', '50m', '50M', '五十米'],
  'swim-100m': ['100米游泳', '游泳100米', '游泳', '100m游泳'],
  'standing-long-jump': ['立定跳远', '立定跳远(米)', '立定跳远（米）', '立定跳', '立定跳远成绩'],
  'standing-triple-jump': ['立定三级跳远', '三级跳远'],
  'triple-frog-jump': ['三级连续蛙跳', '三级蛙跳', '蛙跳'],
  'rope-skip-1min': ['一分钟跳绳', '跳绳', '1分钟跳绳', '跳绳1分钟', '一分钟跳绳次数'],
  'medicine-ball': ['实心球', '投掷实心球', '掷实心球'],
  'shot-put': ['原地推铅球', '推铅球', '铅球'],
  'pull-up': ['引体向上', '引体'],
  'sit-up': ['仰卧起坐', '一分钟仰卧起坐', '1分钟仰卧起坐'],
  'parallel-ladder': ['平行梯悬垂攀移', '平行梯'],
  football: ['足球', '足球25米绕杆运球', '足球25米绕竿运球', '足球运球', '足球绕杆', '足球28米绕杆运球'],
  basketball: ['篮球', '篮球运球', '篮球半场来回运球上篮', '篮球半场运球上篮'],
  'basketball-dribble': ['篮球半场来回运球上篮', '篮球运球上篮', '篮球运球', '篮球半场运球上篮', '篮球'],
  volleyball: ['排球', '一分钟排球对墙传（垫）球', '排球对墙垫球', '一分钟排球对墙垫球', '一分钟排球垫球'],
  badminton: ['羽毛球'],
  'table-tennis': ['乒乓球'],
  tennis: ['网球'],
  'football-dribble-shoot': ['足球运球绕杆射门', '足球绕杆射门'],
  'basketball-dribble-shot': ['篮球运球绕杆定点投篮', '篮球绕杆投篮'],
  'table-tennis-push-attack': ['乒乓球左推右攻'],
  'push-up-20s': ['20秒连续俯卧撑', '连续俯卧撑'],
  'push-up-15s': ['15秒连续俯卧撑'],
  'v-up-20s': ['20秒两头起', '两头起'],
  'figure8-run': ['3×10米8字绕杆跑', '8字绕杆跑', '3x10米8字绕杆跑']
}

const ITEM_ID_ALIASES: Record<string, string[]> = {
  'male-1000m': ['男1000米', '男生1000米', '男子1000米', '男子1000米跑'],
  'female-800m': ['女800米', '女生800米', '女子800米', '女子800米跑'],
  'male-100m': ['男子100米', '男100米'],
  'female-100m': ['女子100米', '女100米'],
  'male-100m-swim': ['男100米游泳'],
  'female-100m-swim': ['女100米游泳']
}

export function aliasesForItem(item: ExamItemDefinition): string[] {
  const extra = [...(ITEM_KEY_ALIASES[item.itemKey] ?? []), ...(ITEM_ID_ALIASES[item.id] ?? []), ...(item.aliases ?? [])]
  return [...new Set(extra.map((value) => value.trim()).filter((value) => value !== '' && value !== item.name))]
}

export function attachExamItemAliases(standard: ExamStandard): ExamStandard {
  return {
    ...standard,
    items: standard.items.map((item) => ({
      ...item,
      aliases: aliasesForItem(item)
    }))
  }
}
