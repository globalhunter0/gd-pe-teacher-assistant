import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadJsonDocumentFile, loadJsonItemsFile, readJsonDocumentFile, writeJsonDocumentAtomic, writeJsonItemsAtomic } from '../persistence/jsonFile'
import {
  DEFAULT_TEACHER_DISPLAY_NAME,
  defaultUserPreferences,
  formatWorkbenchGreeting,
  parseUserPreferences,
  type UserPreferences
} from './index'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

export async function runUserPreferencesSelfCheckOrThrow(): Promise<string> {
  assert(parseUserPreferences(undefined).teacherDisplayName === DEFAULT_TEACHER_DISPLAY_NAME, '缺省应回退郁老师')
  assert(parseUserPreferences({}).teacherDisplayName === DEFAULT_TEACHER_DISPLAY_NAME, '旧文件缺字段应回退郁老师')
  assert(parseUserPreferences({ teacherDisplayName: '  ' }).teacherDisplayName === DEFAULT_TEACHER_DISPLAY_NAME, '空名称应回退')
  assert(parseUserPreferences({ teacherDisplayName: '陈老师' }).teacherDisplayName === '陈老师', '应保存完整显示名称')
  assert(formatWorkbenchGreeting('下午好', '陈老师') === '下午好，陈老师！', '问候语不得再拼接老师')
  assert(formatWorkbenchGreeting('下午好', '郁老师') === '下午好，郁老师！', '默认问候语应直接使用显示名称')

  const root = mkdtempSync(join(tmpdir(), 'gdpe-settings-selfcheck-'))
  try {
    const settingsPath = join(root, 'settings.json')
    const sessionsPath = join(root, 'pe-sessions.json')
    const originalSessions = [{ id: 'session-keep', topic: '历史课堂' }]
    await writeJsonItemsAtomic(sessionsPath, originalSessions)

    const loadedDefault = await loadJsonDocumentFile(settingsPath, parseUserPreferences, defaultUserPreferences())
    assert(loadedDefault.teacherDisplayName === DEFAULT_TEACHER_DISPLAY_NAME, '默认 teacherDisplayName 读取应正常')

    const next: UserPreferences = { teacherDisplayName: '陈老师' }
    await writeJsonDocumentAtomic(settingsPath, parseUserPreferences(next))
    const reloaded = await readJsonDocumentFile(settingsPath, parseUserPreferences)
    assert(reloaded.teacherDisplayName === '陈老师', '保存后 reload 仍应为陈老师')
    assert(formatWorkbenchGreeting('下午好', reloaded.teacherDisplayName) === '下午好，陈老师！', '工作台问候语应读取该值')

    const sessionsAfter = await loadJsonItemsFile(sessionsPath, (input) => {
      if (!Array.isArray(input)) {
        throw new Error('课堂记录不是数组')
      }
      return input
    }, [])
    assert(JSON.stringify(sessionsAfter) === JSON.stringify(originalSessions), '不得修改课堂/测试/训练历史数据')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }

  return 'user preferences self-check passed'
}
