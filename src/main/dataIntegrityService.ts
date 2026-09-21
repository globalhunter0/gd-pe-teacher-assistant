import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { APP_RELEASE_VERSION, BUSINESS_JSON_FILES } from '../shared/backup/types'
import { createSafetyBackupArchive } from '../shared/backup/service'
import {
  applyRawPeSessionStatusRepairs,
  planSafeRepairs,
  runDataIntegrityAudit,
  runStartupHealthAudit,
  scanRawPeSessionsForStatusRepairs,
  type DataIntegrityReport,
  type DataIntegritySnapshot,
  type SafeRepairPlan
} from '../shared/dataIntegrity'
import { pathExists, UserDataCorruptError } from '../shared/persistence/jsonFile'
import { loadClasses } from './classStore'
import { loadPeSessions } from './peSessionStore'
import { loadPeTests } from './peTestStore'
import { loadResources } from './resourceStore'
import { loadSchedule } from './scheduleStore'
import { loadStudents } from './studentStore'
import { loadTeachingPlans } from './teachingPlanStore'
import {
  loadTrainingMembers,
  loadTrainingResults,
  loadTrainingSessions,
  loadTrainingTeams
} from './trainingStore'
import { getUserDataRoot } from './userDataPaths'

const CORRUPT_QUARANTINE_DIR = 'corrupt-quarantine'

let lastStartupReport: DataIntegrityReport | null = null

export function getLastStartupHealthReport(): DataIntegrityReport | null {
  return lastStartupReport
}

async function fileStatus(
  fileName: string
): Promise<NonNullable<DataIntegritySnapshot['fileStatuses']>[number]> {
  const filePath = join(getUserDataRoot(), fileName)
  try {
    await access(filePath)
    return { fileName, exists: true }
  } catch {
    return { fileName, exists: false }
  }
}

async function quarantineCorruptFile(fileName: string): Promise<string | null> {
  const root = getUserDataRoot()
  const source = join(root, fileName)
  if (!(await pathExists(source))) {
    return null
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = join(root, CORRUPT_QUARANTINE_DIR)
  await mkdir(dir, { recursive: true })
  const dest = join(dir, `${fileName}.${stamp}.corrupt`)
  await copyFile(source, dest)
  return dest
}

async function safeLoad<T>(
  label: string,
  loader: () => Promise<T[]>,
  fileName: string
): Promise<{ items: T[]; parseError?: string; quarantinePath?: string }> {
  try {
    return { items: await loader() }
  } catch (error) {
    const message =
      error instanceof UserDataCorruptError
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error)
    let quarantinePath: string | undefined
    try {
      quarantinePath = (await quarantineCorruptFile(fileName)) ?? undefined
    } catch {
      // 隔离失败不掩盖原错误
    }
    return {
      items: [],
      parseError: `${label}: ${message}`,
      quarantinePath
    }
  }
}

function mapParseErrors(
  fileStatuses: Array<{ fileName: string; exists: boolean; parseError?: string }>,
  entries: Array<{ parseError?: string; quarantinePath?: string }>
): void {
  for (const entry of entries) {
    if (!entry.parseError) continue
    const name = entry.parseError.split(':')[0]
    const fileName =
      name === 'classes'
        ? 'classes.json'
        : name === 'students'
          ? 'students.json'
          : name === 'schedule'
            ? 'schedule.json'
            : name === 'pe-sessions'
              ? 'pe-sessions.json'
              : name === 'pe-tests'
                ? 'pe-tests.json'
                : name === 'teaching-plans'
                  ? 'teaching-plans.json'
                  : name === 'training-teams'
                    ? 'training-teams.json'
                    : name === 'training-members'
                      ? 'training-members.json'
                      : name === 'training-sessions'
                        ? 'training-sessions.json'
                        : name === 'training-results'
                          ? 'training-results.json'
                          : name === 'resources'
                            ? 'resources.json'
                            : `${name}.json`
    const target = fileStatuses.find((item) => item.fileName === fileName)
    if (target) {
      target.parseError = entry.quarantinePath
        ? `${entry.parseError}（已保留原文件并复制到 ${entry.quarantinePath}）`
        : entry.parseError
    }
  }
}

async function buildSnapshot(): Promise<DataIntegritySnapshot> {
  const classes = await safeLoad('classes', loadClasses, 'classes.json')
  const students = await safeLoad('students', loadStudents, 'students.json')
  const schedule = await safeLoad('schedule', loadSchedule, 'schedule.json')
  const peSessions = await safeLoad('pe-sessions', loadPeSessions, 'pe-sessions.json')
  const peTests = await safeLoad('pe-tests', loadPeTests, 'pe-tests.json')
  const teachingPlans = await safeLoad('teaching-plans', loadTeachingPlans, 'teaching-plans.json')
  const trainingTeams = await safeLoad('training-teams', loadTrainingTeams, 'training-teams.json')
  const trainingMembers = await safeLoad('training-members', loadTrainingMembers, 'training-members.json')
  const trainingSessions = await safeLoad('training-sessions', loadTrainingSessions, 'training-sessions.json')
  const trainingResults = await safeLoad('training-results', loadTrainingResults, 'training-results.json')
  const resources = await safeLoad('resources', loadResources, 'resources.json')

  const fileStatuses = await Promise.all(BUSINESS_JSON_FILES.map((name) => fileStatus(name)))
  mapParseErrors(fileStatuses, [
    classes,
    students,
    schedule,
    peSessions,
    peTests,
    teachingPlans,
    trainingTeams,
    trainingMembers,
    trainingSessions,
    trainingResults,
    resources
  ])

  return {
    classes: classes.items.map((item) => ({ id: item.id, status: item.status })),
    students: students.items.map((item) => ({
      id: item.id,
      classId: item.classId,
      status: item.status
    })),
    schedule: schedule.items.map((item) => ({
      id: item.id,
      classId: item.classId,
      trainingTeamId: item.trainingTeamId
    })),
    peSessions: peSessions.items.map((item) => ({
      id: item.id,
      classId: item.classId,
      scheduleLessonId: item.scheduleLessonId,
      teachingPlanId: item.teachingPlanId,
      status: item.status,
      date: item.date
    })),
    peTests: peTests.items.map((item) => ({
      id: item.id,
      classId: item.classId,
      peSessionId: item.peSessionId,
      status: item.status,
      date: item.date
    })),
    teachingPlans: teachingPlans.items.map((item) => ({ id: item.id })),
    trainingTeams: trainingTeams.items.map((item) => ({ id: item.id, status: item.status })),
    trainingMembers: trainingMembers.items.map((item) => ({
      id: item.id,
      teamId: item.teamId,
      studentId: item.studentId,
      status: item.status
    })),
    trainingSessions: trainingSessions.items.map((item) => ({
      id: item.id,
      teamId: item.teamId,
      planId: item.planId
    })),
    trainingResults: trainingResults.items.map((item) => ({
      id: item.id,
      teamId: item.teamId,
      sessionId: item.sessionId,
      studentId: item.studentId
    })),
    resources: resources.items.map((item) => ({ id: item.id })),
    fileStatuses
  }
}

export async function buildAndRunDataIntegrityAudit(): Promise<DataIntegrityReport> {
  return runDataIntegrityAudit(await buildSnapshot())
}

export async function buildAndRunStartupHealthCheck(): Promise<DataIntegrityReport> {
  const report = runStartupHealthAudit(await buildSnapshot())
  lastStartupReport = report
  return report
}

export interface SafeRepairResult {
  ok: boolean
  safetyBackupPath: string | null
  plan: SafeRepairPlan
  repairedCount: number
  message: string
  reportAfter: DataIntegrityReport | null
}

export async function runSafeRepairWithBackup(options?: {
  createSafetyBackup?: () => Promise<string>
}): Promise<SafeRepairResult> {
  const before = await buildAndRunDataIntegrityAudit()
  const peSessionPath = join(getUserDataRoot(), 'pe-sessions.json')
  let rawExtra = [] as ReturnType<typeof scanRawPeSessionsForStatusRepairs>
  if (await pathExists(peSessionPath)) {
    try {
      const rawText = await readFile(peSessionPath, 'utf8')
      rawExtra = scanRawPeSessionsForStatusRepairs(rawText)
    } catch {
      rawExtra = []
    }
  }
  const plan = planSafeRepairs(before, rawExtra)
  if (plan.actions.length === 0) {
    return {
      ok: true,
      safetyBackupPath: null,
      plan,
      repairedCount: 0,
      message:
        plan.blocked.length > 0
          ? '没有可自动修复的项；其余问题需人工处理或从备份恢复。'
          : '没有需要修复的项。',
      reportAfter: before
    }
  }

  let safetyBackupPath: string
  try {
    safetyBackupPath = options?.createSafetyBackup
      ? await options.createSafetyBackup()
      : await createSafetyBackupArchive(getUserDataRoot(), APP_RELEASE_VERSION, 'pre-repair')
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      safetyBackupPath: null,
      plan,
      repairedCount: 0,
      message: `安全备份失败，已禁止修复。${reason}`,
      reportAfter: before
    }
  }

  if (!safetyBackupPath || !(await pathExists(safetyBackupPath))) {
    return {
      ok: false,
      safetyBackupPath: null,
      plan,
      repairedCount: 0,
      message: '安全备份失败，已禁止修复。未生成安全备份文件。',
      reportAfter: before
    }
  }

  if (!(await pathExists(peSessionPath))) {
    return {
      ok: false,
      safetyBackupPath,
      plan,
      repairedCount: 0,
      message: 'pe-sessions.json 不存在，无法修复。',
      reportAfter: before
    }
  }

  const rawText = await readFile(peSessionPath, 'utf8')
  const nextText = applyRawPeSessionStatusRepairs(rawText, plan.actions)
  if (nextText === null) {
    return {
      ok: false,
      safetyBackupPath,
      plan,
      repairedCount: 0,
      message: 'pe-sessions.json 无法解析，已保留原文件，请从备份恢复。未自动清空。',
      reportAfter: before
    }
  }

  await writeFile(peSessionPath, nextText, 'utf8')
  const reportAfter = await buildAndRunStartupHealthCheck()
  return {
    ok: true,
    safetyBackupPath,
    plan,
    repairedCount: plan.actions.length,
    message: `已安全修复 ${plan.actions.length} 项。安全备份：${safetyBackupPath}`,
    reportAfter
  }
}
