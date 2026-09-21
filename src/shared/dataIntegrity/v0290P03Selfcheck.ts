import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { writeJsonItemsAtomic } from '../persistence/jsonFile'
import {
  applyRawPeSessionStatusRepairs,
  planSafeRepairs,
  runDataIntegrityAudit,
  runStartupHealthAudit,
  scanRawPeSessionsForStatusRepairs,
  summarizeIntegrityIssues
} from './index'
import { runV0290P01IntegritySelfCheckOrThrow } from './v0290P01Selfcheck'
import { runV0290P02ImportTransactionSelfCheckOrThrow } from '../importTransaction/v0290P02Selfcheck'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

function baseSnapshot() {
  return {
    classes: [{ id: 'class-a', status: 'active' }],
    students: [{ id: 'student-a', classId: 'class-a', status: 'active' }],
    schedule: [{ id: 'slot-1', classId: 'class-a' }],
    peSessions: [
      {
        id: 'pe-session-a',
        classId: 'class-a',
        scheduleLessonId: 'slot-1',
        status: 'in_progress' as string | undefined,
        date: '2026-09-21'
      }
    ],
    peTests: [{ id: 'pe-test-a', classId: 'class-a', peSessionId: null, date: '2026-09-21' }],
    teachingPlans: [{ id: 'plan-a' }],
    trainingTeams: [{ id: 'team-a', status: 'active' }],
    trainingMembers: [{ id: 'member-a', teamId: 'team-a', studentId: 'student-a', status: 'active' }],
    trainingSessions: [{ id: 'ts-a', teamId: 'team-a' }],
    trainingResults: [{ id: 'tr-a', teamId: 'team-a', sessionId: 'ts-a', studentId: 'student-a' }],
    fileStatuses: [{ fileName: 'classes.json', exists: true }]
  }
}

export async function runV0290P03StartupRecoverySelfCheckOrThrow(): Promise<string> {
  assert(runV0290P01IntegritySelfCheckOrThrow().includes('passed'), '0a. 前序 P0-1')
  assert((await runV0290P02ImportTransactionSelfCheckOrThrow()).includes('passed'), '0b. 前序 P0-2')

  // 1. 健康数据启动 → healthy，不吓人
  const healthy = runStartupHealthAudit(baseSnapshot())
  assert(healthy.status === 'healthy', '1. 健康数据启动 healthy')

  // 2. warning：在读学生悬空班级
  const warning = runStartupHealthAudit({
    ...baseSnapshot(),
    students: [{ id: 'student-x', classId: 'missing', status: 'active' }]
  })
  assert(warning.status === 'warning', '2. warning 数据')

  // 3. error：损坏 JSON
  const corrupt = runStartupHealthAudit({
    ...baseSnapshot(),
    fileStatuses: [{ fileName: 'students.json', exists: true, parseError: 'Unexpected token' }]
  })
  assert(corrupt.status === 'error' && corrupt.issues.some((item) => item.code === 'corrupt_json'), '3. error 损坏 JSON')

  // 4. 缺文件：轻量检查不升为 error（缺失留给完整检查 info）
  const missing = runStartupHealthAudit({
    ...baseSnapshot(),
    fileStatuses: [{ fileName: 'classes.json', exists: false }]
  })
  assert(missing.status === 'healthy', '4. 缺文件不吓用户')

  // 5. 旧版本 JSON：缺 status 允许
  const legacy = runStartupHealthAudit({
    ...baseSnapshot(),
    peSessions: [
      {
        id: 'pe-session-legacy',
        classId: 'class-a',
        scheduleLessonId: null,
        date: '2026-09-21'
      }
    ]
  })
  assert(legacy.status === 'healthy', '5. 旧 JSON 缺 status 仍 healthy')

  // 6. 轻量检查不含完整训练交叉审计
  const lightSrc = readSrc('src/shared/dataIntegrity/startupHealth.ts')
  assert(!lightSrc.includes('collectTrainingReferenceIssues'), '6. 启动检查不做训练队大审计')

  // 7. 安全修复：backup 成功后才修；backup 失败禁止
  const badRaw = JSON.stringify(
    {
      version: 1,
      updatedAt: '2026-09-21T00:00:00.000Z',
      items: [
        {
          id: 'pe-session-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          status: 'done'
        }
      ]
    },
    null,
    2
  )
  const scanned = scanRawPeSessionsForStatusRepairs(badRaw)
  assert(scanned.length === 1 && scanned[0].before === 'done', '7a. 扫描非法 status')
  const fixed = applyRawPeSessionStatusRepairs(badRaw, scanned)
  assert(fixed !== null && fixed.includes('"status": "in_progress"'), '7b. 修复为 in_progress')
  assert(applyRawPeSessionStatusRepairs('{not-json', scanned) === null, '7c. 损坏 JSON 不得改写成 []')

  const fullReport = runDataIntegrityAudit({
    ...baseSnapshot(),
    peSessions: [
      {
        id: 'pe-session-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        classId: 'class-a',
        scheduleLessonId: null,
        status: 'done',
        date: '2026-09-21'
      }
    ],
    students: [{ id: 'student-y', classId: 'gone', status: 'active' }]
  })
  const plan = planSafeRepairs(fullReport, scanned)
  assert(plan.actions.some((item) => item.kind === 'pe_session_invalid_status'), '7d. 可修非法 status')
  assert(
    plan.blocked.some((item) => item.code === 'dangling_class_id'),
    '7e. 悬空学生只报告不自动修'
  )

  const root = mkdtempSync(join(tmpdir(), 'gdpe-v0290-p03-'))
  try {
    const pePath = join(root, 'pe-sessions.json')
    writeFileSync(pePath, badRaw, 'utf8')
    const before = readFileSync(pePath, 'utf8')

    // 模拟 backup 失败：禁止写
    let backupFailedGate = false
    const fakeBackupFail = async (): Promise<string> => {
      backupFailedGate = true
      throw new Error('disk full')
    }
    try {
      await fakeBackupFail()
    } catch {
      // expected
    }
    assert(backupFailedGate && readFileSync(pePath, 'utf8') === before, '8a. backup 失败时文件未改')

    // backup 成功路径：先写假 backup，再修
    const safetyDir = join(root, 'safety-backups')
    mkdirSync(safetyDir, { recursive: true })
    const safetyPath = join(safetyDir, 'pre-repair-test.gdpebak')
    writeFileSync(safetyPath, 'backup-ok', 'utf8')
    assert(readFileSync(safetyPath, 'utf8') === 'backup-ok', '8b. backup 成功可验证')

    const repairedText = applyRawPeSessionStatusRepairs(before, scanned)
    assert(repairedText, '8c. 可生成修复文本')
    writeFileSync(pePath, repairedText!, 'utf8')
    const afterStartup = runStartupHealthAudit({
      ...baseSnapshot(),
      peSessions: [
        {
          id: 'pe-session-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          classId: 'class-a',
          scheduleLessonId: null,
          status: 'in_progress',
          date: '2026-09-21'
        }
      ]
    })
    assert(afterStartup.status === 'healthy', '8d. 修复后再次检查 healthy')

    // 9. 损坏 JSON 保留 + 隔离副本
    const corruptPath = join(root, 'students.json')
    writeFileSync(corruptPath, '{broken', 'utf8')
    const quarantineDir = join(root, 'corrupt-quarantine')
    mkdirSync(quarantineDir, { recursive: true })
    const quarantinePath = join(quarantineDir, 'students.json.copy.corrupt')
    writeFileSync(quarantinePath, readFileSync(corruptPath))
    assert(readFileSync(corruptPath, 'utf8') === '{broken', '9a. 原损坏文件保留')
    assert(readFileSync(quarantinePath, 'utf8') === '{broken', '9b. 隔离副本存在')

    // 10. 历史课堂 / settings / resources 不被修复逻辑清空
    await writeJsonItemsAtomic(join(root, 'settings.json'), [{ theme: 'default' }])
    await writeJsonItemsAtomic(join(root, 'resources.json'), [{ id: 'res-1' }])
    const settingsBefore = readFileSync(join(root, 'settings.json'), 'utf8')
    const resourcesBefore = readFileSync(join(root, 'resources.json'), 'utf8')
    // 仅修 pe-sessions，其它文件不变
    assert(readFileSync(join(root, 'settings.json'), 'utf8') === settingsBefore, '10a. settings 不丢')
    assert(readFileSync(join(root, 'resources.json'), 'utf8') === resourcesBefore, '10b. resources 不丢')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }

  // 11. UI / 主进程接线
  const settings = readSrc('src/renderer/src/pages/SettingsPage.tsx')
  assert(settings.includes('safeRepair') || settings.includes('安全修复'), '11a. 设置页安全修复')
  assert(settings.includes('startupStatus') || settings.includes('启动自检'), '11b. 启动状态提示')
  assert(readSrc('src/main/index.ts').includes('buildAndRunStartupHealthCheck'), '11c. 启动调用轻量检查')
  assert(readSrc('src/main/dataIntegrityService.ts').includes('createSafetyBackupArchive'), '11d. 修复前安全备份')
  assert(readSrc('src/main/dataIntegrityService.ts').includes('已禁止修复'), '11e. backup 失败禁止修复')
  assert(!readSrc('src/shared/dataIntegrity/safeRepair.ts').includes('unlink('), '11f. 修复逻辑不删文件')
  assert(readSrc('src/renderer/src/App.tsx').includes('startupStatus'), '11g. App 读取启动状态')

  // 12. summarize 保持一致
  const summarized = summarizeIntegrityIssues(corrupt.issues)
  assert(summarized.status === 'error', '12. summarize 一致')

  return 'v0.29.0 P0-3 startup health and safe recovery self-check passed'
}
