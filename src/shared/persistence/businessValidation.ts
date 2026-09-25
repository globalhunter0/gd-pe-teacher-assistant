import { parseClassRecords } from '../class/validate'
import { parseStudentRecords } from '../student/validate'
import { parseScheduleItems } from '../schedule/validate'
import { parsePeSessions } from '../peSession/validate'
import { parsePeTestSessions, parseTestItems } from '../peTest/validate'
import { parseTeachingPlans } from '../teachingPlan/validate'
import { parseResourceItems } from '../resource/validate'
import { parseTrainingTeams, parseTrainingMembers, parseTrainingPlans, parseTrainingSessions, parseTrainingItems, parseTrainingResults } from '../trainingTeam/validate'
import { parseUserPreferences } from '../userPreferences'
import { BUSINESS_JSON_FILES } from './businessFiles'

// Compile-time exhaustive: adding a persisted filename requires its validator here.
export const businessValidators: Record<typeof BUSINESS_JSON_FILES[number], (input: unknown) => unknown> = {
  'classes.json': parseClassRecords,
  'students.json': parseStudentRecords,
  'schedule.json': parseScheduleItems,
  'pe-sessions.json': parsePeSessions,
  'pe-tests.json': parsePeTestSessions,
  'test-items.json': parseTestItems,
  'teaching-plans.json': parseTeachingPlans,
  'resources.json': parseResourceItems,
  'training-teams.json': parseTrainingTeams,
  'training-members.json': parseTrainingMembers,
  'training-plans.json': parseTrainingPlans,
  'training-sessions.json': parseTrainingSessions,
  'training-items.json': parseTrainingItems,
  'training-results.json': parseTrainingResults,
  'settings.json': parseUserPreferences
}

export function validateBusinessDocument(name: typeof BUSINESS_JSON_FILES[number], parsed: unknown): unknown {
  const doc = parsed !== null && typeof parsed === 'object' ? parsed as Record<string, unknown> : null
  if (doc && !Array.isArray(doc) && 'version' in doc && doc.version !== 1) throw new Error('不支持的数据版本')
  const input = name === 'settings.json' ? (doc && 'data' in doc ? doc.data : parsed)
    : Array.isArray(parsed) ? parsed : doc?.items
  if (name === 'settings.json' && (input === null || typeof input !== 'object' || Array.isArray(input))) throw new Error('设置必须是对象')
  return businessValidators[name](input)
}
