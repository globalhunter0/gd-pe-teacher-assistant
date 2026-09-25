import { readFile, readdir } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { APP_RELEASE_VERSION } from '../shared/backup/types'
import { createSafetyBackupArchive } from '../shared/backup/service'
import {
  applyRawPeSessionStatusRepairs,
  planSafeRepairs,
  runDataIntegrityAudit,
  runStartupHealthAudit,
  scanRawPeSessionsForStatusRepairs,
  summarizeIntegrityIssues,
  type DataIntegrityReport,
  type DataIntegritySnapshot,
  type SafeRepairPlan
} from '../shared/dataIntegrity'
import { pathExists, recoverJsonTextAtomic, UserDataCorruptError, readOnlyInspection } from '../shared/persistence/jsonFile'
import { withExclusiveDataAccess } from '../shared/persistence/writeGate'
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

import { inspectBusinessFiles } from '../shared/persistence/inspectBusinessFiles'

let lastStartupReport: DataIntegrityReport | null = null

export function getLastStartupHealthReport(): DataIntegrityReport | null {
  return lastStartupReport
}

async function safeLoad<T>(
  label: string,
  loader: () => Promise<T[]>,
  fileName: string
): Promise<{ items: T[]; fileName: string; parseError?: string }> {
  try { return { items: await loader(), fileName } }
  catch (error) {
    return { items: [], fileName: error instanceof UserDataCorruptError ? basename(error.filePath) : fileName,
      parseError: label + ': ' + (error instanceof Error ? error.message : String(error)) }
  }
}

function mapParseErrors(
  fileStatuses: Array<import('../shared/dataIntegrity').DataIntegrityFileStatus>,
  entries: Array<{ fileName: string; parseError?: string }>
): void {
  for (const entry of entries) {
    if (!entry.parseError) continue
    const target = fileStatuses.find(item => item.fileName === entry.fileName)
    if (target && !target.parseError) {
      target.parseError = entry.parseError
      target.errorType = 'invalid_structure_or_reference'
      target.structureInvalid = true
      target.writeBlocked = true
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

  const fileStatuses = await inspectBusinessFiles(getUserDataRoot())
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
  return withAttachmentIssues(runDataIntegrityAudit(await readOnlyInspection.run(true, buildSnapshot)))
}

export async function buildAndRunStartupHealthCheck(): Promise<DataIntegrityReport> {
  const report = await withAttachmentIssues(runStartupHealthAudit(await readOnlyInspection.run(true, buildSnapshot)))
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
  return withExclusiveDataAccess(() => runSafeRepairExclusive(options))
}

async function withAttachmentIssues(report: DataIntegrityReport): Promise<DataIntegrityReport> {
  const issues = [...report.issues]
  let names: string[] = []
  try { names = (await readdir(join(getUserDataRoot(), 'resources', 'files'), { withFileTypes: true })).filter(e => e.isFile()).map(e => e.name) }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
  let referenced: string[] = []
  try { referenced = (await readOnlyInspection.run(true, loadResources)).flatMap(r => r.storedFileName ? [r.storedFileName] : []) } catch { /* unreadable index: every file stays unknown */ }
  for (const name of names.filter(n => !referenced.includes(n))) issues.push({ severity: 'warning', domain: 'resources', code: 'unknown_attachment', entityId: name, message: `附件归属未确认，已保留：${name}`, repairable: false })
  for (const name of referenced.filter(n => !names.includes(n))) issues.push({ severity: 'warning', domain: 'resources', code: 'missing_attachment', entityId: name, message: `索引引用的附件缺失：${name}`, repairable: false })
  return summarizeIntegrityIssues(issues)
}

async function runSafeRepairExclusive(options?: {
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

  await recoverJsonTextAtomic(peSessionPath, nextText)
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
