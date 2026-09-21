import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { BUSINESS_JSON_FILES } from '../shared/backup/types'
import { runDataIntegrityAudit, type DataIntegrityReport, type DataIntegritySnapshot } from '../shared/dataIntegrity'
import { UserDataCorruptError } from '../shared/persistence/jsonFile'
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

async function fileStatus(fileName: string): Promise<DataIntegritySnapshot['fileStatuses'] extends ReadonlyArray<infer T> | undefined ? T : never> {
  const filePath = join(getUserDataRoot(), fileName)
  try {
    await access(filePath)
    return { fileName, exists: true }
  } catch {
    return { fileName, exists: false }
  }
}

async function safeLoad<T>(label: string, loader: () => Promise<T[]>, fileName: string): Promise<{
  items: T[]
  parseError?: string
}> {
  try {
    return { items: await loader() }
  } catch (error) {
    const message =
      error instanceof UserDataCorruptError
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error)
    return { items: [], parseError: `${label}: ${message}` }
  }
}

export async function buildAndRunDataIntegrityAudit(): Promise<DataIntegrityReport> {
  const root = getUserDataRoot()
  void root

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
  const parseErrors = [
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
  ]
  for (const entry of parseErrors) {
    if (entry.parseError) {
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
        target.parseError = entry.parseError
      }
    }
  }

  const snapshot: DataIntegritySnapshot = {
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

  return runDataIntegrityAudit(snapshot)
}
